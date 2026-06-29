import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import {
  REQUEST_ID_HEADER,
  assertSafeEventKeys,
  isCanonicalUuidV4,
} from "@/lib/observability/safe-events";

import { POST, __setAnalyzeRouteTestDeps } from "./route";

const FIXED_REQUEST_ID = "123e4567-e89b-42d3-a456-426614174000";
const BROWSER_REQUEST_ID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const BACKEND_BASE_URL = "https://analysis-backend.test";
const SHARED_SECRET = "SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE";
const SENTINELS = [
  "SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE",
  "SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE",
  "SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE",
  SHARED_SECRET,
  "resumeText",
  "jobText",
  "X-Analysis-Api-Key",
];

const VALID_BODY = {
  resumeText: "Python SQL Git",
  jobText: "Intern role requiring Python and SQL.",
};

type CapturedFetch = {
  url: string;
  init?: RequestInit;
};

type MockFetchOptions = {
  status?: number;
  ok?: boolean;
  body?: string;
  rejectWith?: Error;
};

let capturedFetches: CapturedFetch[] = [];
let stderrLines: string[] = [];
let originalStderrWrite: typeof process.stderr.write;
let originalEnv: NodeJS.ProcessEnv;
let clearedTimeoutIds: ReturnType<typeof setTimeout>[];
let sentryEvents: unknown[] = [];
let sentryShouldThrow = false;

function resetCapturedEvents(): void {
  capturedFetches = [];
  stderrLines = [];
  clearedTimeoutIds = [];
  sentryEvents = [];
  sentryShouldThrow = false;
}

function installStderrCapture(): void {
  originalStderrWrite = process.stderr.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrLines.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stderr.write;
}

function restoreStderrCapture(): void {
  process.stderr.write = originalStderrWrite;
}

function parsedEvents(): Record<string, unknown>[] {
  return stderrLines
    .flatMap((line) => line.split("\n"))
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function assertNoOperationalFailureEvents(events: Record<string, unknown>[]): void {
  for (const event of events) {
    assert.equal(event.outcome, "success");
  }
}

function assertFailureClass(events: Record<string, unknown>[], failureClass: string): void {
  assert.equal(events.length, 1);
  assert.equal(events[0]?.outcome, "failure");
  assert.equal(events[0]?.failure_class, failureClass);
  assert.equal(events[0]?.request_id, FIXED_REQUEST_ID);
}

function assertSentinelsAbsentFromEvents(events: Record<string, unknown>[]): void {
  const serialized = JSON.stringify(events);
  for (const sentinel of SENTINELS) {
    assert.equal(serialized.includes(sentinel), false, `sentinel leaked: ${sentinel}`);
  }
  for (const event of events) {
    assert.equal(assertSafeEventKeys(event), true);
  }
}

function createMockFetch(options: MockFetchOptions = {}): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedFetches.push({
      url: String(input),
      init,
    });

    if (options.rejectWith) {
      throw options.rejectWith;
    }

    const status = options.status ?? 200;
    const body = options.body ?? JSON.stringify({
      matchedSkills: [{ skill: "python", category: "programming" }],
      missingSkills: [],
      matchedSkillsCount: 1,
      missingSkillsCount: 0,
      summary: "Safe summary only.",
    });

    return new Response(body, { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

function createAnalyzeRequest(options: {
  body?: string;
  contentLength?: string;
  browserRequestId?: string;
} = {}): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.contentLength !== undefined) {
    headers.set("content-length", options.contentLength);
  }
  if (options.browserRequestId) {
    headers.set(REQUEST_ID_HEADER, options.browserRequestId);
  }

  return new Request("https://app.test/api/analyze", {
    method: "POST",
    headers,
    body: options.body ?? JSON.stringify(VALID_BODY),
  });
}

function installTestDeps(fetchImpl: typeof fetch): void {
  __setAnalyzeRouteTestDeps({
    protect: async () => {},
    fetchImpl,
    generateRequestIdImpl: () => FIXED_REQUEST_ID,
    captureSafeFailureToSentryImpl: async (event) => {
      sentryEvents.push(event);
      if (sentryShouldThrow) throw new Error("adapter failed");
      return "queued";
    },
  });
}

beforeEach(() => {
  resetCapturedEvents();
  installStderrCapture();
  originalEnv = { ...process.env };
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "production";
  env.ANALYSIS_API_URL = BACKEND_BASE_URL;
  env.ANALYSIS_API_SHARED_SECRET = SHARED_SECRET;

  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  global.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = originalSetTimeout(handler, timeout, ...args);
    return id;
  }) as typeof setTimeout;
  global.clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
    clearedTimeoutIds.push(id);
    originalClearTimeout(id);
  }) as typeof clearTimeout;

  installTestDeps(createMockFetch());
});

afterEach(() => {
  __setAnalyzeRouteTestDeps(undefined);
  restoreStderrCapture();
  process.env = originalEnv;
});

test("ignores browser-supplied X-Request-ID and forwards generated ID upstream", async () => {
  const response = await POST(createAnalyzeRequest({ browserRequestId: BROWSER_REQUEST_ID }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.notEqual(response.headers.get(REQUEST_ID_HEADER), BROWSER_REQUEST_ID);
  assert.equal(capturedFetches.length, 1);
  const forwardedHeaders = new Headers(capturedFetches[0]?.init?.headers);
  assert.equal(forwardedHeaders.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.equal(forwardedHeaders.get("X-Analysis-Api-Key"), SHARED_SECRET);
});

test("successful response returns 200, header, upstream ID, and success event", async () => {
  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.equal(isCanonicalUuidV4(FIXED_REQUEST_ID), true);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.outcome, "success");
  assert.equal(sentryEvents.length, 0);
  assert.equal(events[0]?.request_id, FIXED_REQUEST_ID);
  assert.equal("failure_class" in events[0], false);
  assertSentinelsAbsentFromEvents(events);
});

test("malformed request body returns 400 with header and no operational failure event", async () => {
  const response = await POST(createAnalyzeRequest({ body: "{not-json" }));
  const events = parsedEvents();

  assert.equal(response.status, 400);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertNoOperationalFailureEvents(events);
  assert.equal(events.length, 0);
});

test("oversized request returns 413 with header and no operational failure event", async () => {
  const oversized = "a".repeat(1_000_001);
  const response = await POST(createAnalyzeRequest({
    body: JSON.stringify({ resumeText: oversized, jobText: "Python" }),
  }));
  const events = parsedEvents();

  assert.equal(response.status, 413);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertNoOperationalFailureEvents(events);
  assert.equal(events.length, 0);
});

test("upstream 422 returns 422 with header and no operational failure event", async () => {
  installTestDeps(createMockFetch({
    status: 422,
    ok: false,
    body: JSON.stringify({
      detail: "Invalid request data.",
      errors: [{ field: "resumeText", message: "This field is required." }],
    }),
  }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 422);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertNoOperationalFailureEvents(events);
  assert.equal(events.length, 0);
  assert.equal(sentryEvents.length, 0);
});

test("upstream 429 returns safe rate-limit response with header and no operational failure event", async () => {
  installTestDeps(createMockFetch({
    status: 429,
    ok: false,
    body: JSON.stringify({ detail: "Too many requests" }),
  }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();
  const payload = await response.json() as { detail: string };

  assert.equal(response.status, 429);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.match(payload.detail, /short period/i);
  assertNoOperationalFailureEvents(events);
  assert.equal(events.length, 0);
  assert.equal(sentryEvents.length, 0);
});

test("upstream 401 maps to config.shared_secret_rejected", async () => {
  installTestDeps(createMockFetch({ status: 401, ok: false, body: JSON.stringify({ detail: "Unauthorized" }) }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 502);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertFailureClass(events, "config.shared_secret_rejected");
  assertSentinelsAbsentFromEvents(events);
  assert.equal(sentryEvents.length, 1);
  assert.deepEqual(sentryEvents[0], events[0]);
});

test("upstream 403 maps to config.shared_secret_rejected", async () => {
  installTestDeps(createMockFetch({ status: 403, ok: false, body: JSON.stringify({ detail: "Forbidden" }) }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 502);
  assertFailureClass(events, "config.shared_secret_rejected");
});

test("upstream 5xx maps to proxy.upstream_5xx", async () => {
  installTestDeps(createMockFetch({ status: 503, ok: false, body: JSON.stringify({ detail: "Unavailable" }) }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertFailureClass(events, "proxy.upstream_5xx");
  assertSentinelsAbsentFromEvents(events);
});

test("malformed upstream JSON maps to proxy.upstream_invalid_response", async () => {
  installTestDeps(createMockFetch({ status: 200, ok: true, body: "not-json" }));

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 502);
  assertFailureClass(events, "proxy.upstream_invalid_response");
});

test("timeout maps to proxy.upstream_timeout", async () => {
  installTestDeps((async () => {
    throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
  }) as typeof fetch);

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 504);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertFailureClass(events, "proxy.upstream_timeout");
  assert.equal(events[0]?.severity, "warning");
});

test("network failure maps to proxy.upstream_unreachable", async () => {
  installTestDeps((async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch);

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 503);
  assertFailureClass(events, "proxy.upstream_unreachable");
  assert.equal(JSON.stringify(events).includes("fetch failed"), false);
  assert.equal(sentryEvents.length, 1);
  assert.equal(JSON.stringify(sentryEvents).includes("fetch failed"), false);
});

test("missing backend configuration maps to proxy.configuration_failure", async () => {
  delete (process.env as Record<string, string | undefined>).ANALYSIS_API_URL;

  const response = await POST(createAnalyzeRequest());
  const events = parsedEvents();

  assert.equal(response.status, 500);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assertFailureClass(events, "proxy.configuration_failure");
  assert.equal(events[0]?.severity, "error");
  assert.equal(capturedFetches.length, 0);
  assert.equal(sentryEvents.length, 1);
});

test("content-length oversize returns 413 with header before upstream fetch", async () => {
  const response = await POST(createAnalyzeRequest({
    body: JSON.stringify(VALID_BODY),
    contentLength: String(1_000_001),
  }));
  const events = parsedEvents();

  assert.equal(response.status, 413);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.equal(capturedFetches.length, 0);
  assert.equal(events.length, 0);
});

test("timeout cleanup clears abort timer after completion", async () => {
  installTestDeps((async () => {
    throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
  }) as typeof fetch);

  await POST(createAnalyzeRequest());

  assert.ok(clearedTimeoutIds.length >= 1);
});


test("Sentry adapter failure does not change proxy response", async () => {
  sentryShouldThrow = true;
  installTestDeps(createMockFetch({ status: 503, ok: false, body: "SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE" }));
  const response = await POST(createAnalyzeRequest());
  const payload = await response.json() as { detail: string };
  assert.equal(response.status, 502);
  assert.equal(response.headers.get(REQUEST_ID_HEADER), FIXED_REQUEST_ID);
  assert.match(payload.detail, /temporarily unavailable/i);
  assert.equal(sentryEvents.length, 1);
  assert.equal(JSON.stringify(sentryEvents).includes("SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE"), false);
});
