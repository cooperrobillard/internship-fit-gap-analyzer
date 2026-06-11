/**
 * Browser client for the local FastAPI analysis service prototype.
 *
 * - Reads NEXT_PUBLIC_ANALYSIS_API_URL (defaults to http://127.0.0.1:8000)
 * - Sends pasted text to POST /analyze for in-memory analysis only
 * - Does not store resume/job text, call Supabase, or use Clerk
 */

import type { WebAnalysisInput, WebAnalysisResult } from "./types";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";

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

/** Base URL for the local FastAPI analysis service. */
export function getAnalysisApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ANALYSIS_API_URL?.trim();
  if (!configured) {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return configured.replace(/\/$/, "");
}

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
 * Call the local FastAPI /analyze endpoint with pasted resume and job text.
 * Text is sent only for this request; this helper does not persist it.
 */
export async function analyzeWithApi(
  input: WebAnalysisInput,
): Promise<ApiAnalysisClientResult> {
  const baseUrl = getAnalysisApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/analyze`, {
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
      if (response.status === 422) {
        return {
          status: "error",
          message: "Resume text and job description text are required.",
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
