/**
 * Server-side helper to run rule-based analysis through Render FastAPI.
 * Used as an automatic fallback when Smart AI cannot run.
 */

import type { WebAnalysisInput, WebAnalysisResult } from "./types";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";

export function resolveAnalysisBackendBaseUrl(): string | null {
  const configured = process.env.ANALYSIS_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return null;
}

type RuleBasedApiResponse = {
  matchedSkills: { skill: string; category: string }[];
  missingSkills: { skill: string; category: string }[];
  matchedSkillsCount: number;
  missingSkillsCount: number;
  summary: string;
};

export async function fetchRuleBasedAnalysis(
  input: WebAnalysisInput,
  requestId: string,
): Promise<WebAnalysisResult | null> {
  const baseUrl = resolveAnalysisBackendBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  try {
    const response = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers,
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
      return null;
    }

    const payload = (await response.json()) as RuleBasedApiResponse;
    return {
      matchedSkills: payload.matchedSkills,
      missingSkills: payload.missingSkills,
      matchedSkillsCount: payload.matchedSkillsCount,
      missingSkillsCount: payload.missingSkillsCount,
      summary: payload.summary,
      analysisMode: "rule_based_fallback",
    };
  } catch {
    return null;
  }
}
