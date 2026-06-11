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
      if (response.status === 401 || response.status === 403) {
        return {
          status: "error",
          message: "Sign in to run analysis.",
        };
      }

      if (response.status === 422) {
        return {
          status: "error",
          message: "Resume text and job description text are required.",
        };
      }

      if (response.status === 502 || response.status === 503) {
        return {
          status: "error",
          message:
            "Analysis service is unavailable. Check that the FastAPI server is running and try again.",
        };
      }

      return {
        status: "error",
        message:
          "Analysis service returned an error. Check the FastAPI server and try again.",
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
        "Analysis service is unavailable. Start the FastAPI service and try again.",
    };
  }
}
