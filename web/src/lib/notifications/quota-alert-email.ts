/**
 * Server-side Smart AI quota alert emails via Resend.
 * Sends safe metadata only — never resume/job text or user content.
 */

import type { AiUsageFeature } from "@/lib/supabase/ai-usage";

export type QuotaExceededReason = "daily_exceeded" | "monthly_exceeded";

export type QuotaAlertEmailInput = {
  feature: AiUsageFeature;
  limitType: QuotaExceededReason;
  configuredLimit: number;
  currentCount: number;
  clerkUserId: string;
  timestampIso?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function resolveEnvironmentLabel(): string {
  return (
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    "unknown"
  );
}

export function quotaExceededErrorClass(
  feature: AiUsageFeature,
  reason: QuotaExceededReason,
): string {
  if (feature === "profile_extraction") {
    return "quota_exceeded_profile_monthly";
  }
  if (reason === "daily_exceeded") {
    return "quota_exceeded_daily";
  }
  return "quota_exceeded_monthly";
}

function formatFeatureLabel(feature: AiUsageFeature): string {
  return feature === "profile_extraction"
    ? "profile_extraction"
    : "smart_analysis";
}

function formatLimitLabel(reason: QuotaExceededReason): string {
  return reason === "daily_exceeded" ? "daily" : "monthly";
}

function buildEmailText(input: QuotaAlertEmailInput): string {
  const timestamp = input.timestampIso ?? new Date().toISOString();
  return [
    "Smart AI quota exceeded",
    "",
    `Feature: ${formatFeatureLabel(input.feature)}`,
    `Limit type: ${formatLimitLabel(input.limitType)}`,
    `Configured limit: ${input.configuredLimit}`,
    `Current count: ${input.currentCount}`,
    `Clerk user id: ${input.clerkUserId}`,
    `Timestamp (UTC): ${timestamp}`,
    `Environment: ${resolveEnvironmentLabel()}`,
  ].join("\n");
}

export async function sendQuotaAlertEmail(
  input: QuotaAlertEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.AI_QUOTA_ALERT_EMAIL?.trim();
  const from = process.env.ALERTS_FROM_EMAIL?.trim();

  if (!apiKey || !to || !from) {
    return;
  }

  const subject = `Job Fit quota alert: ${formatFeatureLabel(input.feature)} (${formatLimitLabel(input.limitType)})`;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: buildEmailText(input),
      }),
    });

    if (!response.ok) {
      return;
    }
  } catch {
    // Best effort only — never block user flows or expose provider errors.
  }
}
