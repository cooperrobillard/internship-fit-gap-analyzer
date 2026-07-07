/**
 * Browser client for Smart AI analysis via protected Next.js routes.
 *
 * Returns discriminated unions instead of throwing into UI components.
 */

import { analyzeWithApi } from "./api-analysis-client";
import { normalizeExtractedJobMetadata } from "./job-metadata-autofill";
import type {
  UserAnalysisModeChoice,
  WebAnalysisInput,
  WebAnalysisResult,
} from "./types";

export const AI_ANALYZE_API_ROUTE = "/api/ai/analyze";
export const AI_EXTRACT_PROFILE_API_ROUTE = "/api/ai/extract-profile";

type AiSkillPayload = {
  skill: string;
  category: string;
  evidence?: string | null;
};

type AiAnalyzeRouteSuccess = {
  outcome: "ai_success";
  result: WebAnalysisResult;
};

type AiAnalyzeRouteFallback = {
  outcome: "rule_based_fallback";
  result: WebAnalysisResult;
  fallbackReason: string;
};

type AiAnalyzeRouteError = {
  outcome: "error";
  message: string;
  category: "validation" | "unavailable" | "temporary";
};

type AiAnalyzeRouteResponse =
  | AiAnalyzeRouteSuccess
  | AiAnalyzeRouteFallback
  | AiAnalyzeRouteError;

type AiProfileRouteSuccess = {
  outcome: "ai_success";
  candidateName: string;
  skills: string[];
  summary: string;
  model?: string;
};

type AiProfileRouteFallback = {
  outcome: "rule_based_fallback";
  fallbackReason: string;
};

type AiProfileRouteError = {
  outcome: "error";
  message: string;
};

type AiProfileRouteResponse =
  | AiProfileRouteSuccess
  | AiProfileRouteFallback
  | AiProfileRouteError;

export type SmartAnalysisClientResult =
  | { status: "success"; result: WebAnalysisResult }
  | {
      status: "fallback";
      result: WebAnalysisResult;
      fallbackReason: string;
    }
  | {
      status: "error";
      message: string;
      category: "validation" | "unavailable" | "temporary";
      retryAfterSeconds?: number;
    };

export type ProfileExtractionClientResult =
  | {
      status: "success";
      candidateName: string;
      skills: string[];
      summary: string;
      extractionMethod: "ai";
      model?: string;
    }
  | {
      status: "fallback";
      fallbackReason: string;
    }
  | {
      status: "error";
      message: string;
    };

function mapAiSkills(items: AiSkillPayload[] | undefined) {
  return (items ?? []).map((item) => ({
    skill: item.skill,
    category: item.category,
    evidence: item.evidence?.trim() || undefined,
  }));
}

function mapAiAnalyzePayload(payload: Record<string, unknown>): WebAnalysisResult {
  const matchedSkills = (payload.matchedSkills as AiSkillPayload[]) ?? [];
  const missingSkills = (payload.missingSkills as AiSkillPayload[]) ?? [];

  return {
    matchedSkills: matchedSkills.map(({ skill, category }) => ({ skill, category })),
    missingSkills: missingSkills.map(({ skill, category }) => ({ skill, category })),
    matchedSkillsCount:
      typeof payload.matchedSkillsCount === "number"
        ? payload.matchedSkillsCount
        : matchedSkills.length,
    missingSkillsCount:
      typeof payload.missingSkillsCount === "number"
        ? payload.missingSkillsCount
        : missingSkills.length,
    summary: String(payload.summary ?? ""),
    analysisMode: "ai_smart",
    transferableSkills: mapAiSkills(payload.transferableSkills as AiSkillPayload[]),
    resumeSkills: mapAiSkills(payload.resumeSkills as AiSkillPayload[]),
    jobSkills: mapAiSkills(payload.jobSkills as AiSkillPayload[]),
    ignoredBoilerplate: Array.isArray(payload.ignoredBoilerplate)
      ? payload.ignoredBoilerplate.map((item) => String(item))
      : [],
    limitations: Array.isArray(payload.limitations)
      ? payload.limitations.map((item) => String(item))
      : [],
    model: typeof payload.model === "string" ? payload.model : undefined,
    jobMetadata: normalizeExtractedJobMetadata(payload.jobMetadata),
  };
}

async function parseAiAnalyzeResponse(
  response: Response,
): Promise<AiAnalyzeRouteResponse> {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      body && typeof body.detail === "string"
        ? body.detail
        : "Smart AI analysis is temporarily unavailable.";
    return {
      outcome: "error",
      message: detail,
      category: response.status === 422 ? "validation" : "temporary",
    };
  }

  if (!body) {
    return {
      outcome: "error",
      message: "Smart AI analysis returned an invalid response.",
      category: "temporary",
    };
  }

  if (body.outcome === "rule_based_fallback" && body.result) {
    return {
      outcome: "rule_based_fallback",
      result: {
        ...(body.result as WebAnalysisResult),
        analysisMode: "rule_based_fallback",
        fallbackReason:
          typeof body.fallbackReason === "string" ? body.fallbackReason : undefined,
      },
      fallbackReason:
        typeof body.fallbackReason === "string"
          ? body.fallbackReason
          : "Smart AI was unavailable, so rule-based analysis was used instead.",
    };
  }

  if (body.outcome === "ai_success" && body.result) {
    return {
      outcome: "ai_success",
      result: mapAiAnalyzePayload(body.result as Record<string, unknown>),
    };
  }

  if (body.matchedSkills && body.missingSkills) {
    return {
      outcome: "ai_success",
      result: mapAiAnalyzePayload(body),
    };
  }

  return {
    outcome: "error",
    message: "Smart AI analysis returned an invalid response.",
    category: "temporary",
  };
}

export async function analyzeWithSmartAi(
  input: WebAnalysisInput,
): Promise<SmartAnalysisClientResult> {
  try {
    const response = await fetch(AI_ANALYZE_API_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const parsed = await parseAiAnalyzeResponse(response);
    if (parsed.outcome === "error") {
      return {
        status: "error",
        message: parsed.message,
        category: parsed.category,
      };
    }
    if (parsed.outcome === "rule_based_fallback") {
      return {
        status: "fallback",
        result: {
          ...parsed.result,
          fallbackReason: parsed.fallbackReason,
        },
        fallbackReason: parsed.fallbackReason,
      };
    }

    return {
      status: "success",
      result: parsed.result,
    };
  } catch {
    return {
      status: "error",
      message: "Check your connection and try again.",
      category: "temporary",
    };
  }
}

export async function runAnalysisByMode(
  mode: UserAnalysisModeChoice,
  input: WebAnalysisInput,
): Promise<SmartAnalysisClientResult> {
  if (mode === "rule_based") {
    const ruleResult = await analyzeWithApi(input);
    if (ruleResult.status === "error") {
      return {
        status: "error",
        message: ruleResult.message,
        category:
          ruleResult.category === "validation" ? "validation" : "temporary",
        retryAfterSeconds: ruleResult.retryAfterSeconds,
      };
    }
    return {
      status: "success",
      result: {
        ...ruleResult.result,
        analysisMode: "rule_based",
      },
    };
  }

  return analyzeWithSmartAi(input);
}

export async function extractProfileWithAi(input: {
  resumeText: string;
  filename?: string;
  sourceKind?: string;
}): Promise<ProfileExtractionClientResult> {
  try {
    const response = await fetch(AI_EXTRACT_PROFILE_API_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    let body: AiProfileRouteResponse | null = null;
    try {
      body = (await response.json()) as AiProfileRouteResponse;
    } catch {
      body = null;
    }

    if (!response.ok) {
      return {
        status: "error",
        message:
          body && "message" in body && typeof body.message === "string"
            ? body.message
            : "Smart AI profile extraction is temporarily unavailable.",
      };
    }

    if (!body) {
      return {
        status: "error",
        message: "Smart AI profile extraction returned an invalid response.",
      };
    }

    if (body.outcome === "ai_success") {
      return {
        status: "success",
        candidateName: body.candidateName,
        skills: body.skills,
        summary: body.summary,
        extractionMethod: "ai",
        model: body.model,
      };
    }

    if (body.outcome === "rule_based_fallback") {
      return {
        status: "fallback",
        fallbackReason: body.fallbackReason,
      };
    }

    return {
      status: "error",
      message:
        "message" in body && typeof body.message === "string"
          ? body.message
          : "Smart AI profile extraction is temporarily unavailable.",
    };
  } catch {
    return {
      status: "error",
      message: "Check your connection and try again.",
    };
  }
}
