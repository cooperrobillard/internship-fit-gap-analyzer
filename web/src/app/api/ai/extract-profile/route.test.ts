import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import {
  POST,
  __setAiExtractProfileRouteTestDeps,
  type AiExtractProfileRouteTestDeps,
} from "./route";

const REQUEST_ID = "123e4567-e89b-42d3-a456-426614174000";
const BACKEND_URL = "https://analysis-backend.test";
const SHARED_SECRET = "test-shared-secret";
const VALID_INPUT = { resumeText: "Python, SQL, and Git" };

let originalEnv: NodeJS.ProcessEnv;
let backendCalls: Array<{ url: string; init?: RequestInit }>;

function request(body: unknown = VALID_INPUT): Request {
  return new Request("https://app.test/api/ai/extract-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function installDeps(overrides: Partial<AiExtractProfileRouteTestDeps> = {}): void {
  __setAiExtractProfileRouteTestDeps({
    protect: async () => {},
    getUserId: async () => "user_test",
    generateRequestIdImpl: () => REQUEST_ID,
    isAiFeaturesEnabledImpl: () => true,
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return new Response(
        JSON.stringify({
          candidateName: "Candidate",
          skills: ["Python", "SQL", "Git"],
          summary: "Smart AI profile extraction.",
          model: "test-model",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch,
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
  installDeps();
});

afterEach(() => {
  __setAiExtractProfileRouteTestDeps(undefined);
  process.env = originalEnv;
});

test("rejects an unauthenticated profile-extraction request", async () => {
  installDeps({ getUserId: async () => null });

  const response = await POST(request());

  assert.equal(response.status, 401);
  assert.equal(backendCalls.length, 0);
});

test("rejects invalid profile-extraction input", async () => {
  const response = await POST(request({ resumeText: "" }));

  assert.equal(response.status, 422);
  assert.equal(backendCalls.length, 0);
});

test("uses rule-based fallback when the global AI feature flag is disabled", async () => {
  installDeps({ isAiFeaturesEnabledImpl: () => false });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 0);
});

test("extracts a profile without Supabase quota configuration", async () => {
  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "ai_success");
  assert.deepEqual(payload.skills, ["Python", "SQL", "Git"]);
  assert.equal(backendCalls.length, 1);
  assert.equal(backendCalls[0]?.url, `${BACKEND_URL}/ai/extract-profile`);
  const headers = new Headers(backendCalls[0]?.init?.headers);
  assert.equal(headers.get("X-Analysis-Api-Key"), SHARED_SECRET);
});

test("a provider quota response makes one backend attempt and safely falls back", async () => {
  installDeps({
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      backendCalls.push({ url: String(input), init });
      return new Response(JSON.stringify({ detail: "Provider unavailable." }), { status: 429 });
    }) as typeof fetch,
  });

  const response = await POST(request());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.outcome, "rule_based_fallback");
  assert.equal(backendCalls.length, 1);
  assert.match(payload.fallbackReason, /could not complete/i);
});
