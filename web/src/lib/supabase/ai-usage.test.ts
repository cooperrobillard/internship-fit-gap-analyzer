import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_AI_DAILY_LIMIT,
  DEFAULT_AI_MONTHLY_LIMIT,
  DEFAULT_AI_PROFILE_MONTHLY_LIMIT,
  getAiQuotaLimits,
  isAiFeaturesEnabled,
  quotaExceededMessage,
  startOfUtcDayIso,
  startOfUtcMonthIso,
} from "@/lib/supabase/ai-usage";

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("isAiFeaturesEnabled requires exact true", () => {
  process.env.AI_FEATURES_ENABLED = "true";
  assert.equal(isAiFeaturesEnabled(), true);

  process.env.AI_FEATURES_ENABLED = "True";
  assert.equal(isAiFeaturesEnabled(), false);

  delete process.env.AI_FEATURES_ENABLED;
  assert.equal(isAiFeaturesEnabled(), false);
});

test("getAiQuotaLimits reads env overrides", () => {
  process.env.AI_DAILY_LIMIT = "3";
  process.env.AI_MONTHLY_LIMIT = "12";
  process.env.AI_PROFILE_MONTHLY_LIMIT = "4";

  assert.deepEqual(getAiQuotaLimits(), {
    dailySmartAnalysis: 3,
    monthlySmartAnalysis: 12,
    monthlyProfileExtraction: 4,
  });
});

test("getAiQuotaLimits uses defaults for invalid values", () => {
  delete process.env.AI_DAILY_LIMIT;
  delete process.env.AI_MONTHLY_LIMIT;
  delete process.env.AI_PROFILE_MONTHLY_LIMIT;

  assert.deepEqual(getAiQuotaLimits(), {
    dailySmartAnalysis: DEFAULT_AI_DAILY_LIMIT,
    monthlySmartAnalysis: DEFAULT_AI_MONTHLY_LIMIT,
    monthlyProfileExtraction: DEFAULT_AI_PROFILE_MONTHLY_LIMIT,
  });
});

test("quota window helpers use UTC boundaries", () => {
  const now = new Date("2026-07-06T15:30:00.000Z");
  assert.equal(startOfUtcDayIso(now), "2026-07-06T00:00:00.000Z");
  assert.equal(startOfUtcMonthIso(now), "2026-07-01T00:00:00.000Z");
});

test("quotaExceededMessage is user-safe", () => {
  const daily = quotaExceededMessage("smart_analysis", "daily_exceeded");
  assert.match(daily, /Daily Smart AI analysis quota/i);
  assert.match(daily, /Rule-based analysis/i);

  const profile = quotaExceededMessage("profile_extraction", "monthly_exceeded");
  assert.match(profile, /profile extraction quota/i);
  assert.match(profile, /Rule-based extraction/i);
});
