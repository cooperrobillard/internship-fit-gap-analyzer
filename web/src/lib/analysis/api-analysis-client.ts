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

export type ApiAnalysisClientResult =
  | { status: "success"; result: WebAnalysisResult }
  | { status: "error"; message: string };

function toWebAnalysisResult(payload: ApiAnalyzeResponse): WebAnalysisResult {
  return {
    matchedSkills: payload.matchedSkills,
    missingSkills: payload.missingSkills,
    matchedSkillsCount: payload.matchedSkillsCount,
    missingSkillsCount: payload.missingSkillsCount,
    summary: payload.summary,
  };
}

function formatValidationDetail(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter((msg): msg is string => Boolean(msg));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return null;
}

function messageFromErrorBody(body: RouteErrorBody | null): string | null {
  if (!body) {
    return null;
  }

  const fromDetail = formatValidationDetail(body.detail);
  if (fromDetail) {
    return fromDetail;
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  return null;
}

function messageForHttpStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Sign in to run analysis.";
  }

  if (status === 422) {
    return "Resume text and job description text are required.";
  }

  if (status === 500) {
    return "The analysis service is not configured correctly. Check deployment environment variables.";
  }

  if (status === 502) {
    return "The backend returned an unexpected response.";
  }

  if (status === 503) {
    return "The hosted analysis service is temporarily unavailable.";
  }

  if (status === 504) {
    return "The analysis service is not responding yet. Please try again in a moment.";
  }

  return "The analysis service returned an error. Please try again.";
}

async function parseRouteErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as RouteErrorBody;
    return messageFromErrorBody(body) ?? messageForHttpStatus(response.status);
  } catch {
    return messageForHttpStatus(response.status);
  }
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
      return {
        status: "error",
        message: await parseRouteErrorMessage(response),
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
      message:
        "The hosted analysis service is temporarily unavailable. Please try again in a moment.",
    };
  }
}
