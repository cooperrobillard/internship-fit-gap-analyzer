/**
 * Browser client for the analysis API via the Next.js route handler.
 *
 * - Calls POST /api/analyze (server forwards to FastAPI with a shared secret)
 * - Does not store resume/job text, call Supabase, or expose server secrets
 */

import type { WebAnalysisInput, WebAnalysisResult } from "./types";

/** Relative App Router endpoint the dashboard calls from the browser. */
export const ANALYSIS_API_ROUTE = "/api/analyze";

/** Display helper for UI copy (browser-safe; no backend URL or secrets). */
export function getAnalysisApiBaseUrl(): string {
  return ANALYSIS_API_ROUTE;
}

type ApiAnalyzeResponse = {
  matchedSkills: { skill: string; category: string }[];
  missingSkills: { skill: string; category: string }[];
  matchedSkillsCount: number;
  missingSkillsCount: number;
  summary: string;
};

type RouteErrorBody = {
  detail?: unknown;
  message?: unknown;
};

export type AnalysisErrorCategory =
  | "validation"
  | "authentication"
  | "timeout"
  | "unavailable"
  | "rate_limited"
  | "generic";

export type ApiAnalysisClientResult =
  | { status: "success"; result: WebAnalysisResult }
  | {
      status: "error";
      message: string;
      category: AnalysisErrorCategory;
      retryable: boolean;
      retryAfterSeconds?: number;
    };

function toWebAnalysisResult(payload: ApiAnalyzeResponse): WebAnalysisResult {
  return {
    matchedSkills: payload.matchedSkills,
    missingSkills: payload.missingSkills,
    matchedSkillsCount: payload.matchedSkillsCount,
    missingSkillsCount: payload.missingSkillsCount,
    summary: payload.summary,
  };
}

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  resumeText: "Resume text",
  jobText: "Job description text",
  body: "The request",
};

function sanitizeValidationMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("traceback") ||
    lower.includes("stack trace") ||
    lower.includes("environment variable") ||
    lower.includes("service_role") ||
    lower.includes("supabase_service") ||
    lower.includes("sk_live") ||
    lower.includes("private key")
  ) {
    return null;
  }

  return trimmed.replace(/[.。]+$/, "");
}

function validationMessageFromBody(body: RouteErrorBody | null): string | null {
  const errors = (body as { errors?: unknown } | null)?.errors;
  if (!Array.isArray(errors)) {
    return null;
  }

  const messages: string[] = [];
  for (const item of errors) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const field = (item as { field?: unknown }).field;
    const message = (item as { message?: unknown }).message;
    if (
      typeof field !== "string" ||
      !(field in VALIDATION_FIELD_LABELS) ||
      typeof message !== "string"
    ) {
      continue;
    }

    const safeMessage = sanitizeValidationMessage(message);
    if (!safeMessage) {
      continue;
    }

    messages.push(`${VALIDATION_FIELD_LABELS[field]} ${safeMessage.charAt(0).toLowerCase()}${safeMessage.slice(1)}.`);
  }

  return messages.length > 0 ? messages.join(" ") : null;
}

function messageForHttpStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Your session may have expired. Refresh the page or sign in again.";
  }

  if (status === 413) {
    return "The analysis request is too large. Shorten the resume or job description and try again.";
  }

  if (status === 422) {
    return "The request could not be read. Check the inputs and try again.";
  }

  if (status === 429) {
    return "You have run several analyses in a short period. Wait about a minute and try again.";
  }

  if (status === 500 || status === 502 || status === 503) {
    return "This feature is temporarily unavailable. Please try again shortly.";
  }

  if (status === 504) {
    return "The analysis service is taking longer than expected. Please try again shortly.";
  }

  return "We could not complete that action right now. Please try again.";
}

function categoryForHttpStatus(status: number): AnalysisErrorCategory {
  if (status === 401 || status === 403) {
    return "authentication";
  }
  if (status === 413 || status === 422) {
    return "validation";
  }
  if (status === 429) {
    return "rate_limited";
  }
  if (status === 504) {
    return "timeout";
  }
  if (status === 500 || status === 502 || status === 503) {
    return "unavailable";
  }
  return "generic";
}

function retryAfterSecondsFromHeader(value: string | null): number {
  if (value === null || !/^[0-9]+$/.test(value.trim())) {
    return 60;
  }

  const seconds = Number(value.trim());
  if (!Number.isSafeInteger(seconds)) {
    return 60;
  }

  return Math.min(600, Math.max(1, seconds));
}

function isRetryableCategory(category: AnalysisErrorCategory): boolean {
  return category !== "validation" && category !== "rate_limited";
}

async function parseRouteError(response: Response): Promise<{
  message: string;
  category: AnalysisErrorCategory;
  retryable: boolean;
  retryAfterSeconds?: number;
}> {
  const category = categoryForHttpStatus(response.status);

  if (response.status === 429) {
    return {
      message: messageForHttpStatus(response.status),
      category,
      retryable: false,
      retryAfterSeconds: retryAfterSecondsFromHeader(response.headers.get("retry-after")),
    };
  }

  let body: RouteErrorBody | null = null;

  try {
    body = (await response.json()) as RouteErrorBody;
  } catch {
    body = null;
  }

  const message =
    response.status === 422
      ? validationMessageFromBody(body) ?? messageForHttpStatus(response.status)
      : messageForHttpStatus(response.status);

  return {
    message,
    category,
    retryable: isRetryableCategory(category),
  };
}

/**
 * Run analysis through the Next.js API route (forwards to FastAPI server-side).
 * Text is sent only for this request; this helper does not persist it.
 */
export async function analyzeWithApi(
  input: WebAnalysisInput,
): Promise<ApiAnalysisClientResult> {
  try {
    const response = await fetch(ANALYSIS_API_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: input.resumeText,
        jobText: input.jobText,
        jobTitle: input.jobTitle,
        company: input.company,
        sourceUrl: input.sourceUrl,
        notes: input.notes,
      }),
    });

    if (!response.ok) {
      const error = await parseRouteError(response);
      return {
        status: "error",
        ...error,
      };
    }

    const payload = (await response.json()) as ApiAnalyzeResponse;
    return {
      status: "success",
      result: toWebAnalysisResult(payload),
    };
  } catch {
    return {
      status: "error",
      message: "Check your connection and try again.",
      category: "unavailable",
      retryable: true,
    };
  }
}
