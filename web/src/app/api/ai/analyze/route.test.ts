import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import {
  POST,
  __setAiAnalyzeRouteTestDeps,
  type AiAnalyzeRouteTestDeps,
} from "./route";

const REQUEST_ID = "123e4567-e89b-42d3-a456-426614174000";
const BACKEND_URL = "https://analysis-backend.test";
const SHARED_SECRET = "test-shared-secret";
const VALID_INPUT = {
  resumeText: "Python and SQL",
  jobText: "This role requires Python, SQL, and Docker.",
};

let originalEnv: NodeJS.ProcessEnv;
let backendCalls: Array<{ url: string; init?: RequestInit }>;
let fallbackCalls: number;

function request(body: unknown = VALID_INPUT): Request {
  return new Request("https://app.test/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function backendResponse(status = 200): Response {
  return new Response(
    JSON.stringify({
      matchedSkills: [{ skill: "Python", category: "Programming" }],
      missingSkills: [{ skill: "Docker", category: "Backend" }],
      matchedSkillsCount: 1,
      missingSkillsCount: 1,
      summary: "Smart AI result.",
      model: "test-model",
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function installDeps(overrides: Partial<AiAnalyzeRouteTestDeps> = {}): void {
  __setAiAnalyzeRouteTestDeps({
    protect: async () => {},
    getUserId: async () => "user_test",
    generateRequestIdImpl: () => REQUEST_ID,
    isAiFeaturesEnabledImpl: () => true,
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return backendResponse();
    }) as typeof fetch,
    fetchRuleBasedAnalysisImpl: async () => {
      fallbackCalls += 1;
      return {
        matchedSkills: [{ skill: "Python", category: "Programming" }],
        missingSkills: [{ skill: "Docker", category: "Backend" }],
        matchedSkillsCount: 1,
        missingSkillsCount: 1,
        summary: "Rule-based result.",
        analysisMode: "rule_based_fallback",
      };
    },
    ...overrides,
  });
}

beforeEach(() => {
  originalEnv = { ...process.env };
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  env.ANALYSIS_API_URL = BACKEND_URL;
  env.ANALYSIS_API_SHARED_SECRET = SHARED_SECRET;
  delete env.NEXT_PUBLIC_SUPABASE_URL;
  delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  backendCalls = [];
  fallbackCalls = 0;
  installDeps();
});

afterEach(() => {
  __setAiAnalyzeRouteTestDeps(undefined);
  process.env = originalEnv;
});

test("rejects an unauthenticated Smart AI request", async () => {
  installDeps({ getUserId: async () => null });

  const response = await POST(request());

  assert.equal(response.status, 401);
  assert.equal(backendCalls.length, 0);
  assert.equal(fallbackCalls, 0);
});

test("rejects invalid Smart AI input before calling the backend", async () => {
  const response = await POST(request({ resumeText: "", jobText: "Python" }));

  assert.equal(response.status, 422);
  assert.equal(backendCalls.length, 0);
  assert.equal(fallbackCalls, 0);
});

test("uses rule-based fallback when the global AI feature flag is disabled", async () => {
  installDeps({ isAiFeaturesEnabledImpl: () => false });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 0);
  assert.equal(fallbackCalls, 1);
});

test("calls Smart AI without Supabase quota configuration and returns its result", async () => {
  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "ai_success");
  assert.equal(payload.result.analysisMode, "ai_smart");
  assert.equal(payload.result.summary, "Smart AI result.");
  assert.equal(backendCalls.length, 1);
  assert.equal(backendCalls[0]?.url, `${BACKEND_URL}/ai/analyze`);
  const headers = new Headers(backendCalls[0]?.init?.headers);
  assert.equal(headers.get("X-Analysis-Api-Key"), SHARED_SECRET);
  assert.equal(fallbackCalls, 0);
});

test("a provider quota response makes one backend attempt and safely falls back", async () => {
  installDeps({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return backendResponse(429);
    }) as typeof fetch,
  });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 1);
  assert.equal(fallbackCalls, 1);
  assert.match(payload.fallbackReason, /could not complete/i);
});

test("another backend failure safely falls back", async () => {
  installDeps({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return new Response(JSON.stringify({ detail: "Unavailable." }), { status: 503 });
    }) as typeof fetch,
  });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 1);
  assert.equal(fallbackCalls, 1);
});

test("an invalid Smart AI response safely falls back", async () => {
  installDeps({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return new Response(JSON.stringify({ summary: "Incomplete" }), { status: 200 });
    }) as typeof fetch,
  });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 1);
  assert.equal(fallbackCalls, 1);
  assert.match(payload.fallbackReason, /invalid result/i);
});
