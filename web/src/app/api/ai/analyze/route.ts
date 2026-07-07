import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { applyDeterministicGuardrails } from "@/lib/analysis/deterministic-skill-overlap";
import { fetchRuleBasedAnalysis } from "@/lib/analysis/rule-based-proxy";
import type { WebAnalysisInput } from "@/lib/analysis/types";
import {
  REQUEST_ID_HEADER,
  generateRequestId,
} from "@/lib/observability/safe-events";
import { createClerkSupabaseClient, getSupabaseEnv } from "@/lib/supabase/client";
import {
  checkSmartAnalysisQuota,
  isAiFeaturesEnabled,
  notifyQuotaExceededIfNeeded,
  quotaExceededMessage,
  reserveAiUsageEvent,
  updateAiUsageEvent,
} from "@/lib/supabase/ai-usage";

export const runtime = "nodejs";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";
const BACKEND_REQUEST_TIMEOUT_MS = 30_000;
const MAX_ANALYSIS_REQUEST_BODY_BYTES = 1_000_000;

const REQUEST_TOO_LARGE_MESSAGE =
  "The analysis request is too large. Shorten the resume or job description and try again.";

function withRequestId<T>(response: NextResponse<T>, requestId: string): NextResponse<T> {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function resolveBackendBaseUrl(): string | null {
  const configured = process.env.ANALYSIS_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return null;
}

function contentLengthExceedsLimit(request: Request): boolean {
  const value = request.headers.get("content-length");
  if (value === null) {
    return false;
  }
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return false;
  }
  return Number(trimmed) > MAX_ANALYSIS_REQUEST_BODY_BYTES;
}

function parseAnalysisInput(body: unknown): WebAnalysisInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const resumeText = typeof record.resumeText === "string" ? record.resumeText.trim() : "";
  const jobText = typeof record.jobText === "string" ? record.jobText.trim() : "";
  if (!resumeText || !jobText) {
    return null;
  }
  if (resumeText.length > 100_000 || jobText.length > 100_000) {
    return null;
  }

  const optionalString = (value: unknown): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  return {
    resumeText,
    jobText,
    jobTitle: optionalString(record.jobTitle),
    company: optionalString(record.company),
    sourceUrl: optionalString(record.sourceUrl),
    notes: optionalString(record.notes),
  };
}

async function tryRuleBasedFallback(
  input: WebAnalysisInput,
  requestId: string,
  fallbackReason: string,
): Promise<NextResponse> {
  const fallback = await fetchRuleBasedAnalysis(input, requestId);
  if (!fallback) {
    return withRequestId(
      NextResponse.json(
        { detail: "Smart AI and rule-based analysis are temporarily unavailable." },
        { status: 503 },
      ),
      requestId,
    );
  }

  return withRequestId(
    NextResponse.json({
      outcome: "rule_based_fallback",
      fallbackReason,
      result: {
        ...fallback,
        analysisMode: "rule_based_fallback",
        fallbackReason,
      },
    }),
    requestId,
  );
}

type AiBackendSuccess = {
  matchedSkills: unknown[];
  missingSkills: unknown[];
  transferableSkills?: unknown[];
  resumeSkills?: unknown[];
  jobSkills?: unknown[];
  ignoredBoilerplate?: string[];
  summary: string;
  limitations?: string[];
  matchedSkillsCount: number;
  missingSkillsCount: number;
  usage?: {
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
  };
  model?: string;
};

async function callBackendSmartAnalysis(
  input: WebAnalysisInput,
  requestId: string,
): Promise<{ ok: true; payload: AiBackendSuccess } | { ok: false; status: number }> {
  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return { ok: false, status: 503 };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    [REQUEST_ID_HEADER]: requestId,
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/ai/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload: unknown = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      return { ok: false, status: 502 };
    }

    if (!response.ok || !payload || typeof payload !== "object") {
      return { ok: false, status: response.status || 502 };
    }

    return { ok: true, payload: payload as AiBackendSuccess };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, status: 504 };
    }
    return { ok: false, status: 503 };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: Request) {
  await auth.protect();
  const requestId = generateRequestId();
  const { userId, getToken } = await auth();

  if (!userId) {
    return withRequestId(
      NextResponse.json({ detail: "Sign in required." }, { status: 401 }),
      requestId,
    );
  }

  if (contentLengthExceedsLimit(request)) {
    return withRequestId(
      NextResponse.json({ detail: REQUEST_TOO_LARGE_MESSAGE }, { status: 413 }),
      requestId,
    );
  }

  let requestText: string;
  try {
    requestText = await request.text();
  } catch {
    return withRequestId(
      NextResponse.json(
        { detail: "The request could not be read. Check the inputs and try again." },
        { status: 400 },
      ),
      requestId,
    );
  }

  const bodyByteLength = new TextEncoder().encode(requestText).length;
  if (bodyByteLength > MAX_ANALYSIS_REQUEST_BODY_BYTES) {
    return withRequestId(
      NextResponse.json({ detail: REQUEST_TOO_LARGE_MESSAGE }, { status: 413 }),
      requestId,
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(requestText);
  } catch {
    return withRequestId(
      NextResponse.json(
        { detail: "The request could not be read. Check the inputs and try again." },
        { status: 400 },
      ),
      requestId,
    );
  }

  const input = parseAnalysisInput(parsedBody);
  if (!input) {
    return withRequestId(
      NextResponse.json(
        { detail: "Resume text and job description text are required." },
        { status: 422 },
      ),
      requestId,
    );
  }

  if (!isAiFeaturesEnabled()) {
    return tryRuleBasedFallback(
      input,
      requestId,
      "Smart AI is not enabled, so rule-based analysis was used instead.",
    );
  }

  if (!getSupabaseEnv()) {
    return tryRuleBasedFallback(
      input,
      requestId,
      "Usage tracking is not configured, so rule-based analysis was used instead.",
    );
  }

  const supabase = createClerkSupabaseClient(() => getToken());

  let quota;
  try {
    quota = await checkSmartAnalysisQuota(supabase, userId);
  } catch {
    return tryRuleBasedFallback(
      input,
      requestId,
      "Smart AI quota could not be verified, so rule-based analysis was used instead.",
    );
  }

  if (!quota.allowed && quota.reason) {
    try {
      await notifyQuotaExceededIfNeeded(supabase, userId, "smart_analysis", quota);
    } catch {
      // Best effort only.
    }
    return tryRuleBasedFallback(
      input,
      requestId,
      quotaExceededMessage("smart_analysis", quota.reason),
    );
  }

  let usageEventId: string;
  try {
    usageEventId = await reserveAiUsageEvent(supabase, userId, "smart_analysis");
  } catch {
    return tryRuleBasedFallback(
      input,
      requestId,
      "Smart AI quota could not be reserved, so rule-based analysis was used instead.",
    );
  }

  const backendResult = await callBackendSmartAnalysis(input, requestId);

  if (!backendResult.ok) {
    try {
      await updateAiUsageEvent(supabase, userId, usageEventId, {
        status: "error",
        errorClass: `backend_${backendResult.status}`,
      });
    } catch {
      // Best effort only.
    }
    return tryRuleBasedFallback(
      input,
      requestId,
      "Smart AI could not complete this request, so rule-based analysis was used instead.",
    );
  }

  const payload = backendResult.payload;
  const guarded = applyDeterministicGuardrails(payload, input);
  if (!guarded.ok) {
    try {
      await updateAiUsageEvent(supabase, userId, usageEventId, {
        status: "error",
        errorClass: "ai_invalid_response",
      });
    } catch {
      // Best effort only.
    }
    return tryRuleBasedFallback(
      input,
      requestId,
      "Smart AI returned an invalid result, so rule-based analysis was used instead.",
    );
  }

  const result = guarded.result;
  try {
    await updateAiUsageEvent(supabase, userId, usageEventId, {
      status: "success",
      model: result.model ?? null,
      promptTokens: result.usage?.promptTokens ?? null,
      completionTokens: result.usage?.completionTokens ?? null,
      totalTokens: result.usage?.totalTokens ?? null,
    });
  } catch {
    // Best effort only — still return AI result.
  }

  return withRequestId(
    NextResponse.json({
      outcome: "ai_success",
      result: {
        ...result,
        analysisMode: "ai_smart",
      },
    }),
    requestId,
  );
}
