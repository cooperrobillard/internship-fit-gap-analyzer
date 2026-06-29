import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "X-Request-ID";
export const SAFE_EVENT_SCHEMA_VERSION = "1";
export const ANALYSIS_EVENT_NAME = "analysis_request";
export const ANALYZE_OPERATION = "analyze";

export const FAILURE_CLASSES = [
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
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];
export type SafeOutcome = "success" | "failure";
export type SafeSeverity = "info" | "warning" | "error" | "critical";
export type SafeService = "nextjs_analysis_proxy" | "fastapi_analysis_service";
export type PayloadSizeBucket =
  | "under_10kb"
  | "10kb_to_100kb"
  | "100kb_to_500kb"
  | "500kb_to_1mb"
  | "over_1mb"
  | "unknown";

export const SAFE_EVENT_KEYS = [
  "schema_version",
  "event_name",
  "event_id",
  "request_id",
  "timestamp",
  "service",
  "operation",
  "outcome",
  "severity",
  "environment",
  "release",
  "route_template",
  "http_method",
  "http_status",
  "duration_ms",
  "failure_class",
  "upstream_status_class",
  "retry_count",
  "rate_limit_result",
  "payload_size_bucket",
  "runtime_name",
  "runtime_version",
] as const;

const FAILURE_CLASS_SET = new Set<string>(FAILURE_CLASSES);
const SAFE_EVENT_KEY_SET = new Set<string>(SAFE_EVENT_KEYS);
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_DURATION_MS = 3_600_000;

export type SafeAnalysisEventInput = {
  request_id: string;
  service: SafeService;
  outcome: SafeOutcome;
  severity: SafeSeverity;
  route_template: "/api/analyze" | "/analyze";
  http_method: "POST";
  http_status: number;
  duration_ms: number;
  failure_class?: FailureClass;
  upstream_status_class?: "4xx" | "5xx" | "unknown";
  retry_count?: number;
  rate_limit_result?: "allowed" | "limited" | "unknown";
  payload_size_bucket?: PayloadSizeBucket;
  environment?: string;
  release?: string;
  runtime_name?: string;
  runtime_version?: string;
};

export type SafeAnalysisEvent = {
  schema_version: "1";
  event_name: "analysis_request";
  event_id: string;
  request_id: string;
  timestamp: string;
  service: SafeService;
  operation: "analyze";
  outcome: SafeOutcome;
  severity: SafeSeverity;
  route_template: "/api/analyze" | "/analyze";
  http_method: "POST";
  http_status: number;
  duration_ms: number;
  failure_class?: FailureClass;
  upstream_status_class?: "4xx" | "5xx" | "unknown";
  retry_count?: number;
  rate_limit_result?: "allowed" | "limited" | "unknown";
  payload_size_bucket?: PayloadSizeBucket;
  environment?: string;
  release?: string;
  runtime_name?: string;
  runtime_version?: string;
};

export function generateRequestId(): string {
  return randomUUID();
}

export function isCanonicalUuidV4(value: unknown): value is string {
  return typeof value === "string" && value.length === 36 && UUID_V4_PATTERN.test(value);
}

export function isRecognizedFailureClass(value: unknown): value is FailureClass {
  return typeof value === "string" && FAILURE_CLASS_SET.has(value);
}

export function safeDurationMs(startedAtMs: number, endedAtMs = Date.now()): number {
  const duration = Math.round(endedAtMs - startedAtMs);
  if (!Number.isFinite(duration) || duration < 0) {
    return 0;
  }
  return Math.min(MAX_DURATION_MS, duration);
}

function safeHttpStatus(value: number): number {
  if (!Number.isSafeInteger(value) || value < 100 || value > 599) {
    return 500;
  }
  return value;
}

function optionalSafeToken(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function optionalRetryCount(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isSafeInteger(value) || value < 0) {
    return undefined;
  }
  return Math.min(10, value);
}

export function payloadSizeBucket(byteLength: number | undefined): PayloadSizeBucket {
  if (byteLength === undefined || !Number.isFinite(byteLength) || byteLength < 0) {
    return "unknown";
  }
  if (byteLength < 10_000) return "under_10kb";
  if (byteLength < 100_000) return "10kb_to_100kb";
  if (byteLength < 500_000) return "100kb_to_500kb";
  if (byteLength <= 1_000_000) return "500kb_to_1mb";
  return "over_1mb";
}

export function createSafeAnalysisEvent(input: SafeAnalysisEventInput): SafeAnalysisEvent {
  if (!isCanonicalUuidV4(input.request_id)) {
    throw new Error("safe event request_id must be a canonical UUIDv4");
  }
  if (input.outcome === "success" && input.failure_class !== undefined) {
    throw new Error("success events must not include failure_class");
  }
  if (input.outcome === "failure" && !isRecognizedFailureClass(input.failure_class)) {
    throw new Error("failure events require a recognized failure_class");
  }

  const event: SafeAnalysisEvent = {
    schema_version: SAFE_EVENT_SCHEMA_VERSION,
    event_name: ANALYSIS_EVENT_NAME,
    event_id: generateRequestId(),
    request_id: input.request_id,
    timestamp: new Date().toISOString(),
    service: input.service,
    operation: ANALYZE_OPERATION,
    outcome: input.outcome,
    severity: input.severity,
    route_template: input.route_template,
    http_method: input.http_method,
    http_status: safeHttpStatus(input.http_status),
    duration_ms: Math.min(MAX_DURATION_MS, Math.max(0, Math.round(input.duration_ms))),
  };

  if (input.outcome === "failure") event.failure_class = input.failure_class;
  if (input.upstream_status_class) event.upstream_status_class = input.upstream_status_class;
  const retryCount = optionalRetryCount(input.retry_count);
  if (retryCount !== undefined) event.retry_count = retryCount;
  if (input.rate_limit_result) event.rate_limit_result = input.rate_limit_result;
  if (input.payload_size_bucket) event.payload_size_bucket = input.payload_size_bucket;
  const environment = optionalSafeToken(input.environment);
  if (environment) event.environment = environment;
  const release = optionalSafeToken(input.release);
  if (release) event.release = release;
  const runtimeName = optionalSafeToken(input.runtime_name);
  if (runtimeName) event.runtime_name = runtimeName;
  const runtimeVersion = optionalSafeToken(input.runtime_version);
  if (runtimeVersion) event.runtime_version = runtimeVersion;

  return event;
}

export function serializeSafeEvent(event: SafeAnalysisEvent): string {
  const output: Partial<SafeAnalysisEvent> = {};
  for (const key of SAFE_EVENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(event, key)) {
      (output as Record<string, unknown>)[key] = event[key as keyof SafeAnalysisEvent];
    }
  }
  return JSON.stringify(output);
}

export function emitSafeEvent(event: SafeAnalysisEvent): void {
  try {
    process.stderr.write(`${serializeSafeEvent(event)}\n`);
  } catch {
    // Best effort only. Observability must never affect application behavior.
  }
}

export function assertSafeEventKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => SAFE_EVENT_KEY_SET.has(key));
}
