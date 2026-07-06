import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  REQUEST_ID_HEADER,
  generateRequestId,
} from "@/lib/observability/safe-events";
import { createClerkSupabaseClient, getSupabaseEnv } from "@/lib/supabase/client";
import {
  checkProfileExtractionQuota,
  isAiFeaturesEnabled,
  notifyQuotaExceededIfNeeded,
  quotaExceededMessage,
  reserveAiUsageEvent,
  updateAiUsageEvent,
} from "@/lib/supabase/ai-usage";

export const runtime = "nodejs";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";
const BACKEND_REQUEST_TIMEOUT_MS = 30_000;
const MAX_REQUEST_BODY_BYTES = 1_000_000;

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

type ProfileExtractInput = {
  resumeText: string;
  filename?: string;
  sourceKind?: string;
};

function parseProfileInput(body: unknown): ProfileExtractInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const resumeText = typeof record.resumeText === "string" ? record.resumeText.trim() : "";
  if (!resumeText || resumeText.length > 100_000) {
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
    filename: optionalString(record.filename),
    sourceKind: optionalString(record.sourceKind),
  };
}

type AiProfileBackendSuccess = {
  candidateName: string;
  skills: string[];
  summary: string;
  usage?: {
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
  };
  model?: string;
};

async function callBackendProfileExtraction(
  input: ProfileExtractInput,
  requestId: string,
): Promise<{ ok: true; payload: AiProfileBackendSuccess } | { ok: false; status: number }> {
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
    const response = await fetch(`${baseUrl}/ai/extract-profile`, {
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

    return { ok: true, payload: payload as AiProfileBackendSuccess };
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

  if (new TextEncoder().encode(requestText).length > MAX_REQUEST_BODY_BYTES) {
    return withRequestId(
      NextResponse.json(
        { detail: "The request is too large. Shorten the resume text and try again." },
        { status: 413 },
      ),
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

  const input = parseProfileInput(parsedBody);
  if (!input) {
    return withRequestId(
      NextResponse.json({ detail: "Resume text is required." }, { status: 422 }),
      requestId,
    );
  }

  if (!isAiFeaturesEnabled()) {
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason: "Smart AI is not enabled. Use rule-based extraction instead.",
      }),
      requestId,
    );
  }

  if (!getSupabaseEnv()) {
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason: "Usage tracking is not configured. Use rule-based extraction instead.",
      }),
      requestId,
    );
  }

  const supabase = createClerkSupabaseClient(() => getToken());

  let quota;
  try {
    quota = await checkProfileExtractionQuota(supabase, userId);
  } catch {
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason: "Smart AI quota could not be verified. Use rule-based extraction instead.",
      }),
      requestId,
    );
  }

  if (!quota.allowed && quota.reason) {
    try {
      await notifyQuotaExceededIfNeeded(
        supabase,
        userId,
        "profile_extraction",
        quota,
      );
    } catch {
      // Best effort only.
    }
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason: quotaExceededMessage("profile_extraction", quota.reason),
      }),
      requestId,
    );
  }

  let usageEventId: string;
  try {
    usageEventId = await reserveAiUsageEvent(supabase, userId, "profile_extraction");
  } catch {
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason: "Smart AI quota could not be reserved. Use rule-based extraction instead.",
      }),
      requestId,
    );
  }

  const backendResult = await callBackendProfileExtraction(input, requestId);

  if (!backendResult.ok) {
    try {
      await updateAiUsageEvent(supabase, userId, usageEventId, {
        status: "error",
        errorClass: `backend_${backendResult.status}`,
      });
    } catch {
      // Best effort only.
    }
    return withRequestId(
      NextResponse.json({
        outcome: "rule_based_fallback",
        fallbackReason:
          "Smart AI profile extraction could not complete. Use rule-based extraction instead.",
      }),
      requestId,
    );
  }

  const payload = backendResult.payload;
  try {
    await updateAiUsageEvent(supabase, userId, usageEventId, {
      status: "success",
      model: payload.model ?? null,
      promptTokens: payload.usage?.promptTokens ?? null,
      completionTokens: payload.usage?.completionTokens ?? null,
      totalTokens: payload.usage?.totalTokens ?? null,
    });
  } catch {
    // Best effort only.
  }

  return withRequestId(
    NextResponse.json({
      outcome: "ai_success",
      candidateName: payload.candidateName,
      skills: payload.skills,
      summary: payload.summary,
      model: payload.model,
    }),
    requestId,
  );
}
