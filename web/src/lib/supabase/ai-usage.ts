/**
 * Server-side Smart AI quota tracking via Supabase RLS.
 *
 * Uses Clerk JWT through the publishable Supabase client — never service-role keys.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AiUsageFeature = "smart_analysis" | "profile_extraction";

export type AiUsageStatus = "reserved" | "success" | "error";

export type AiUsageEventRow = {
  id: string;
  clerk_user_id: string;
  feature: AiUsageFeature;
  status: AiUsageStatus;
  provider: string;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  error_class: string | null;
  created_at: string;
  updated_at: string;
};

export type AiQuotaLimits = {
  dailySmartAnalysis: number;
  monthlySmartAnalysis: number;
  monthlyProfileExtraction: number;
};

export const DEFAULT_AI_DAILY_LIMIT = 10;
export const DEFAULT_AI_MONTHLY_LIMIT = 50;
export const DEFAULT_AI_PROFILE_MONTHLY_LIMIT = 10;

export function isAiFeaturesEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED?.trim() === "true";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function getAiQuotaLimits(): AiQuotaLimits {
  return {
    dailySmartAnalysis: parsePositiveInt(
      process.env.AI_DAILY_LIMIT,
      DEFAULT_AI_DAILY_LIMIT,
    ),
    monthlySmartAnalysis: parsePositiveInt(
      process.env.AI_MONTHLY_LIMIT,
      DEFAULT_AI_MONTHLY_LIMIT,
    ),
    monthlyProfileExtraction: parsePositiveInt(
      process.env.AI_PROFILE_MONTHLY_LIMIT,
      DEFAULT_AI_PROFILE_MONTHLY_LIMIT,
    ),
  };
}

export function startOfUtcDayIso(now: Date = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export function startOfUtcMonthIso(now: Date = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

const QUOTA_COUNT_STATUSES: AiUsageStatus[] = ["reserved", "success", "error"];

export async function countAiUsageSince(
  supabase: SupabaseClient,
  clerkUserId: string,
  feature: AiUsageFeature,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact" })
    .eq("clerk_user_id", clerkUserId)
    .eq("feature", feature)
    .gte("created_at", sinceIso)
    .in("status", QUOTA_COUNT_STATUSES);

  if (error) {
    throw new Error("quota_count_failed");
  }

  return count ?? 0;
}

export type SmartAnalysisQuotaCheck = {
  allowed: boolean;
  reason?: "daily_exceeded" | "monthly_exceeded";
  dailyCount: number;
  monthlyCount: number;
  limits: AiQuotaLimits;
};

export async function checkSmartAnalysisQuota(
  supabase: SupabaseClient,
  clerkUserId: string,
  limits: AiQuotaLimits = getAiQuotaLimits(),
  now: Date = new Date(),
): Promise<SmartAnalysisQuotaCheck> {
  const dailyCount = await countAiUsageSince(
    supabase,
    clerkUserId,
    "smart_analysis",
    startOfUtcDayIso(now),
  );
  const monthlyCount = await countAiUsageSince(
    supabase,
    clerkUserId,
    "smart_analysis",
    startOfUtcMonthIso(now),
  );

  if (dailyCount >= limits.dailySmartAnalysis) {
    return {
      allowed: false,
      reason: "daily_exceeded",
      dailyCount,
      monthlyCount,
      limits,
    };
  }

  if (monthlyCount >= limits.monthlySmartAnalysis) {
    return {
      allowed: false,
      reason: "monthly_exceeded",
      dailyCount,
      monthlyCount,
      limits,
    };
  }

  return {
    allowed: true,
    dailyCount,
    monthlyCount,
    limits,
  };
}

export type ProfileExtractionQuotaCheck = {
  allowed: boolean;
  reason?: "monthly_exceeded";
  monthlyCount: number;
  limits: AiQuotaLimits;
};

export async function checkProfileExtractionQuota(
  supabase: SupabaseClient,
  clerkUserId: string,
  limits: AiQuotaLimits = getAiQuotaLimits(),
  now: Date = new Date(),
): Promise<ProfileExtractionQuotaCheck> {
  const monthlyCount = await countAiUsageSince(
    supabase,
    clerkUserId,
    "profile_extraction",
    startOfUtcMonthIso(now),
  );

  if (monthlyCount >= limits.monthlyProfileExtraction) {
    return {
      allowed: false,
      reason: "monthly_exceeded",
      monthlyCount,
      limits,
    };
  }

  return {
    allowed: true,
    monthlyCount,
    limits,
  };
}

export async function reserveAiUsageEvent(
  supabase: SupabaseClient,
  clerkUserId: string,
  feature: AiUsageFeature,
): Promise<string> {
  const { data, error } = await supabase
    .from("ai_usage_events")
    .insert({
      clerk_user_id: clerkUserId,
      feature,
      status: "reserved",
      provider: "openai",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("quota_reserve_failed");
  }

  if (!data?.id) {
    throw new Error("quota_reserve_failed");
  }

  return data.id as string;
}

export type AiUsageUpdateInput = {
  status: Extract<AiUsageStatus, "success" | "error">;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  errorClass?: string | null;
};

export async function updateAiUsageEvent(
  supabase: SupabaseClient,
  clerkUserId: string,
  eventId: string,
  update: AiUsageUpdateInput,
): Promise<void> {
  const { error } = await supabase
    .from("ai_usage_events")
    .update({
      status: update.status,
      model: update.model ?? null,
      prompt_tokens: update.promptTokens ?? null,
      completion_tokens: update.completionTokens ?? null,
      total_tokens: update.totalTokens ?? null,
      error_class: update.errorClass ?? null,
    })
    .eq("id", eventId)
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    throw new Error("quota_update_failed");
  }
}

export function quotaExceededMessage(
  feature: AiUsageFeature,
  reason: "daily_exceeded" | "monthly_exceeded",
): string {
  if (feature === "profile_extraction") {
    return "Monthly Smart AI profile extraction quota reached. Rule-based extraction is still available.";
  }
  if (reason === "daily_exceeded") {
    return "Daily Smart AI analysis quota reached. Rule-based analysis is still available.";
  }
  return "Monthly Smart AI analysis quota reached. Rule-based analysis is still available.";
}
