import assert from "node:assert/strict";
import test from "node:test";

import {
  FAILURE_CLASSES,
  assertSafeEventKeys,
  createSafeAnalysisEvent,
  emitSafeEvent,
  generateRequestId,
  isCanonicalUuidV4,
  isRecognizedFailureClass,
  payloadSizeBucket,
  safeDurationMs,
  serializeSafeEvent,
} from "./safe-events";

const VALID_REQUEST_ID = "123e4567-e89b-42d3-a456-426614174000";
const SENTINELS = [
  "SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE",
  "SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE",
  "SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE",
  "SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE",
  "secret",
];

function baseInput() {
  return {
    request_id: VALID_REQUEST_ID,
    service: "nextjs_analysis_proxy" as const,
    outcome: "success" as const,
    severity: "info" as const,
    route_template: "/api/analyze" as const,
    http_method: "POST" as const,
    http_status: 200,
    duration_ms: 12,
  };
}

test("generated request IDs are canonical UUIDv4 and not deterministic", () => {
  const first = generateRequestId();
  const second = generateRequestId();
  assert.equal(isCanonicalUuidV4(first), true);
  assert.equal(isCanonicalUuidV4(second), true);
  assert.notEqual(first, second);
});

test("UUIDv4 validation rejects invalid, oversized, uppercase, and non-v4 values", () => {
  assert.equal(isCanonicalUuidV4(VALID_REQUEST_ID), true);
  assert.equal(isCanonicalUuidV4("not-a-uuid"), false);
  assert.equal(isCanonicalUuidV4(`${VALID_REQUEST_ID}${"a".repeat(100)}`), false);
  assert.equal(isCanonicalUuidV4(VALID_REQUEST_ID.toUpperCase()), false);
  assert.equal(isCanonicalUuidV4("123e4567-e89b-12d3-a456-426614174000"), false);
});

test("event IDs are UUIDv4", () => {
  const event = createSafeAnalysisEvent(baseInput());
  assert.equal(isCanonicalUuidV4(event.event_id), true);
});

test("success events omit failure_class and failure events require recognized failure_class", () => {
  const success = createSafeAnalysisEvent(baseInput());
  assert.equal("failure_class" in success, false);

  assert.throws(() => createSafeAnalysisEvent({ ...baseInput(), outcome: "failure", severity: "error" }));
  assert.throws(() => createSafeAnalysisEvent({ ...baseInput(), outcome: "failure", severity: "error", failure_class: "new.name" as never }));

  const failure = createSafeAnalysisEvent({
    ...baseInput(),
    outcome: "failure",
    severity: "error",
    http_status: 503,
    failure_class: "proxy.upstream_unreachable",
  });
  assert.equal(failure.failure_class, "proxy.upstream_unreachable");
  assert.equal(isRecognizedFailureClass(failure.failure_class), true);
});

test("event keys are restricted to the allowlist and extra fields cannot serialize", () => {
  const event = createSafeAnalysisEvent(baseInput()) as Record<string, unknown>;
  event.extra = "SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE";
  const parsed = JSON.parse(serializeSafeEvent(event as never));
  assert.equal(assertSafeEventKeys(parsed), true);
  assert.equal("extra" in parsed, false);
});

test("sentinel résumé/job/note/token/secret strings cannot enter output", () => {
  const event = createSafeAnalysisEvent({
    ...baseInput(),
    release: "SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE secret with spaces",
  });
  const output = serializeSafeEvent(event);
  for (const sentinel of SENTINELS) {
    assert.equal(output.includes(sentinel), false);
  }
});

test("malicious release and optional values are omitted rather than passed through", () => {
  const event = createSafeAnalysisEvent({
    ...baseInput(),
    release: "release with spaces and SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE",
    environment: "production",
    runtime_name: "nodejs",
    runtime_version: "22.1.0",
  });
  assert.equal(event.release, undefined);
  assert.equal(event.environment, "production");
  assert.equal(event.runtime_name, "nodejs");
  assert.equal(event.runtime_version, "22.1.0");
});

test("duration and status validation/clamping are safe", () => {
  assert.equal(safeDurationMs(100, 90), 0);
  assert.equal(safeDurationMs(0, 9_999_999), 3_600_000);
  const event = createSafeAnalysisEvent({ ...baseInput(), http_status: 999, duration_ms: Number.POSITIVE_INFINITY });
  assert.equal(event.http_status, 500);
  assert.equal(event.duration_ms, 3_600_000);
});

test("emission failure does not throw", () => {
  const original = process.stderr.write;
  try {
    process.stderr.write = (() => { throw new Error("boom"); }) as never;
    assert.doesNotThrow(() => emitSafeEvent(createSafeAnalysisEvent(baseInput())));
  } finally {
    process.stderr.write = original;
  }
});

test("payload-size classification is coarse", () => {
  assert.equal(payloadSizeBucket(undefined), "unknown");
  assert.equal(payloadSizeBucket(9_999), "under_10kb");
  assert.equal(payloadSizeBucket(10_000), "10kb_to_100kb");
  assert.equal(payloadSizeBucket(100_000), "100kb_to_500kb");
  assert.equal(payloadSizeBucket(500_000), "500kb_to_1mb");
  assert.equal(payloadSizeBucket(1_000_001), "over_1mb");
});

test("failure mappings are stable", () => {
  assert.deepEqual([...FAILURE_CLASSES], [
    "request.validation_failed",
    "request.payload_too_large",
    "request.rate_limited",
    "resource.not_found",
    "operation.cancelled",
    "auth.session_not_ready",
    "auth.session_stale",
    "auth.authorization_denied_unexpected",
    "proxy.upstream_timeout",
    "proxy.upstream_unreachable",
    "proxy.upstream_invalid_response",
    "proxy.upstream_5xx",
    "backend.unhandled_exception",
    "backend.serialization_failed",
    "data.network_failed",
    "data.read_failed",
    "data.write_failed",
    "data.update_failed",
    "data.delete_failed",
    "config.backend_url_missing",
    "config.shared_secret_rejected",
    "config.supabase_unavailable",
    "availability.frontend_down",
    "availability.backend_health_down",
    "availability.analysis_path_sustained_failure",
    "deployment.frontend_failed",
    "deployment.backend_failed",
    "observability.delivery_failed",
    "privacy.redaction_test_failed",
    "privacy.sensitive_data_detected",
    "security.secret_detected",
    "security.identity_collection_detected",
  ]);
});
