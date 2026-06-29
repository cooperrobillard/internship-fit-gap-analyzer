import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { createSafeAnalysisEvent } from "./safe-events";
import { __resetSentryServerForTests, captureSafeFailureToSentry, reconstructSentryEvent } from "./sentry-server";

type FakeCall = ["init" | "captureEvent", Record<string, unknown>] | ["flush", { timeout?: number }];
type SdkShape = {
  init: (options: Record<string, unknown>) => void;
  captureEvent: (event: Record<string, unknown>) => void;
  flush: (timeout?: number) => Promise<boolean>;
};
type FakeSdk = SdkShape & { calls: FakeCall[] };
const RID = "123e4567-e89b-42d3-a456-426614174000";
const SENTINELS = ["SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_HEADER_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_COOKIE_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_EXCEPTION_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_IDENTITY_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_URL_SENTINEL_DO_NOT_CAPTURE"];
function failure() { return createSafeAnalysisEvent({ request_id: RID, service: "nextjs_analysis_proxy", outcome: "failure", severity: "error", route_template: "/api/analyze", http_method: "POST", http_status: 503, duration_ms: 1, failure_class: "proxy.upstream_unreachable", payload_size_bucket: "under_10kb", environment: "prod", release: "rel-1" }); }
function success() { return createSafeAnalysisEvent({ request_id: RID, service: "nextjs_analysis_proxy", outcome: "success", severity: "info", route_template: "/api/analyze", http_method: "POST", http_status: 200, duration_ms: 1 }); }
function sdk(options: { flushResult?: boolean; flushThrows?: boolean } = {}): FakeSdk {
  const calls: FakeCall[] = [];
  return {
    calls,
    init: (o) => calls.push(["init", o]),
    captureEvent: (e) => { calls.push(["captureEvent", e]); },
    flush: async (timeout) => {
      calls.push(["flush", { timeout }]);
      if (options.flushThrows) throw new Error("flush failed");
      return options.flushResult ?? true;
    },
  };
}
beforeEach(() => __resetSentryServerForTests());

test("disabled combinations do not initialize, capture, or flush", async () => {
  for (const config of [{}, {OBSERVABILITY_TELEMETRY_ENABLED:"true"}, {SENTRY_DSN:"https://fake"}]) {
    __resetSentryServerForTests();
    const fake = sdk();
    assert.equal(await captureSafeFailureToSentry(failure(), {sdk: fake, config}), "disabled");
    assert.equal(fake.calls.length, 0);
  }
});
test("enabled initializes once with privacy config, captures valid failure, and flushes", async () => {
  const fake = sdk();
  assert.equal(await captureSafeFailureToSentry(failure(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake", SENTRY_ENVIRONMENT:"bad value", SENTRY_RELEASE:"rel-1"}}), "queued");
  assert.equal(await captureSafeFailureToSentry(failure(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}), "queued");
  assert.equal(fake.calls.filter(c=>c[0]==="init").length,1);
  assert.equal(fake.calls.filter(c=>c[0]==="captureEvent").length,2);
  assert.equal(fake.calls.filter(c=>c[0]==="flush").length,2);
  const flushCalls = fake.calls.filter((c): c is ["flush", { timeout?: number }] => c[0] === "flush");
  assert.equal(flushCalls[0]?.[1].timeout, 2000);
  const initCall = fake.calls.find((c): c is ["init", Record<string, unknown>] => c[0] === "init");
  assert.ok(initCall);
  const cfg = initCall[1];
  assert.equal(cfg.sendDefaultPii,false); assert.equal(cfg.defaultIntegrations,false); assert.deepEqual(cfg.integrations,[]); assert.equal(cfg.maxBreadcrumbs,0); assert.equal(cfg.attachStacktrace,false); assert.equal(cfg.enableLogs,false); assert.equal(cfg.sendClientReports,false); assert.deepEqual(cfg.tracePropagationTargets,[]); assert.equal("tracesSampleRate" in cfg,false); assert.equal((cfg.beforeBreadcrumb as (value: unknown) => null)({}), null); assert.equal(cfg.environment, undefined); assert.equal(cfg.release, "rel-1");
});
test("success and malformed events are dropped", async () => {
  const fake = sdk();
  assert.equal(await captureSafeFailureToSentry(success(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}), "dropped");
  assert.equal(fake.calls.length,0);
});
test("beforeSend reconstructs and removes malicious provider data", () => { const safe=failure(); const out=reconstructSentryEvent({ event_id:"a".repeat(32), timestamp: 1, request:{url:SENTINELS[8]}, user:{id:SENTINELS[7]}, tags:{evil:SENTINELS[3]}, extra:{ safe_event:safe, evil:SENTINELS[0]}, exception:{values:[{value:SENTINELS[6]}]}, contexts:{evil:SENTINELS[1]}, breadcrumbs:[{message:SENTINELS[2]}] }); assert.ok(out); const text=JSON.stringify(out); for (const s of SENTINELS) assert.equal(text.includes(s), false); assert.equal((out.extra as Record<string, unknown>).evil, undefined); assert.equal(((out.extra as { safe_event: { request_id: string } }).safe_event).request_id, RID); assert.equal(out.message, "nextjs_analysis_proxy:proxy.upstream_unreachable"); assert.deepEqual(out.fingerprint, ["nextjs_analysis_proxy", "proxy.upstream_unreachable"]); assert.equal((out.tags as Record<string, unknown>).request_id, undefined); });
test("beforeSend rejects missing safe_event, sentinel mutation, and info severity", () => { assert.equal(reconstructSentryEvent({extra:{}}), null); const bad={...failure(), release:"SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE"}; assert.equal(reconstructSentryEvent({extra:{safe_event:bad}}), null); const info={...failure(), severity:"info"}; assert.equal(reconstructSentryEvent({extra:{safe_event:info}}), null); });
test("adapter failure isolation", async () => {
  await assert.doesNotReject(async () => captureSafeFailureToSentry(failure(), {sdk:{init(){throw new Error("x")}, captureEvent(){}, flush: async () => true} as SdkShape, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}));
  __resetSentryServerForTests();
  assert.equal(await captureSafeFailureToSentry(failure(), {sdk:{init(){}, captureEvent(){throw new Error("x")}, flush: async () => true} as SdkShape, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}), "failed");
});
test("flush timeout false result does not throw", async () => {
  const fake = sdk({ flushResult: false });
  await assert.doesNotReject(async () => captureSafeFailureToSentry(failure(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}));
  assert.equal(fake.calls.filter(c=>c[0]==="flush").length, 1);
});
test("flush exception does not throw", async () => {
  const fake = sdk({ flushThrows: true });
  await assert.doesNotReject(async () => captureSafeFailureToSentry(failure(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}));
  assert.equal(await captureSafeFailureToSentry(failure(), {sdk: fake, config:{OBSERVABILITY_TELEMETRY_ENABLED:"true", SENTRY_DSN:"https://fake"}}), "queued");
});
