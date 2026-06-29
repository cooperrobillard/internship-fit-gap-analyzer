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
const SAFE_SERVICES = new Set(["nextjs_analysis_proxy", "fastapi_analysis_service"]);
const SAFE_OUTCOMES = new Set(["success", "failure"]);
const SAFE_SEVERITIES = new Set(["info", "warning", "error", "critical"]);
const SAFE_ROUTES = new Set(["/api/analyze", "/analyze"]);
const SAFE_METHODS = new Set(["POST"]);
const UPSTREAM_STATUS_CLASSES = new Set(["4xx", "5xx", "unknown"]);
const RATE_LIMIT_RESULTS = new Set(["allowed", "limited", "unknown"]);
const PAYLOAD_SIZE_BUCKETS = new Set(["under_10kb", "10kb_to_100kb", "100kb_to_500kb", "500kb_to_1mb", "over_1mb", "unknown"]);
const SENTINEL_PATTERN = /SENSITIVE_[A-Z_]+_SENTINEL_DO_NOT_CAPTURE/;

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

export function optionalSafeToken(value: string | undefined): string | undefined {
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


function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSentinel(value: unknown): boolean {
  if (typeof value === "string") return SENTINEL_PATTERN.test(value);
  return false;
}

function safeString(value: unknown, allowed?: Set<string>): string | undefined {
  if (typeof value !== "string" || hasSentinel(value)) return undefined;
  if (allowed && !allowed.has(value)) return undefined;
  return value;
}

function safeInteger(value: unknown, min: number, max: number): number | undefined {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) return undefined;
  return value as number;
}

export function validateSafeAnalysisEvent(value: unknown): SafeAnalysisEvent | null {
  if (!isPlainObject(value) || !assertSafeEventKeys(value)) return null;
  if (Object.values(value).some(hasSentinel)) return null;
  if (value.schema_version !== SAFE_EVENT_SCHEMA_VERSION || value.event_name !== ANALYSIS_EVENT_NAME) return null;
  if (!isCanonicalUuidV4(value.event_id) || !isCanonicalUuidV4(value.request_id)) return null;
  const service = safeString(value.service, SAFE_SERVICES) as SafeService | undefined;
  const outcome = safeString(value.outcome, SAFE_OUTCOMES) as SafeOutcome | undefined;
  const severity = safeString(value.severity, SAFE_SEVERITIES) as SafeSeverity | undefined;
  const route = safeString(value.route_template, SAFE_ROUTES) as "/api/analyze" | "/analyze" | undefined;
  const method = safeString(value.http_method, SAFE_METHODS) as "POST" | undefined;
  const status = safeInteger(value.http_status, 100, 599);
  const duration = safeInteger(value.duration_ms, 0, MAX_DURATION_MS);
  if (!service || !outcome || !severity || !route || !method || status === undefined || duration === undefined) return null;
  if (value.operation !== ANALYZE_OPERATION) return null;
  if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp)) || hasSentinel(value.timestamp)) return null;
  const failureClass = value.failure_class;
  if (outcome === "success" && failureClass !== undefined) return null;
  if (outcome === "failure" && !isRecognizedFailureClass(failureClass)) return null;

  const rebuilt: SafeAnalysisEvent = {
    schema_version: "1", event_name: "analysis_request", event_id: value.event_id, request_id: value.request_id,
    timestamp: value.timestamp, service, operation: "analyze", outcome, severity, route_template: route, http_method: method,
    http_status: status, duration_ms: duration,
  };
  if (outcome === "failure") rebuilt.failure_class = failureClass as FailureClass;
  if (value.upstream_status_class !== undefined) {
    const v = safeString(value.upstream_status_class, UPSTREAM_STATUS_CLASSES) as "4xx" | "5xx" | "unknown" | undefined;
    if (!v) return null; rebuilt.upstream_status_class = v;
  }
  if (value.retry_count !== undefined) { const v = safeInteger(value.retry_count, 0, 10); if (v === undefined) return null; rebuilt.retry_count = v; }
  if (value.rate_limit_result !== undefined) { const v = safeString(value.rate_limit_result, RATE_LIMIT_RESULTS) as "allowed" | "limited" | "unknown" | undefined; if (!v) return null; rebuilt.rate_limit_result = v; }
  if (value.payload_size_bucket !== undefined) { const v = safeString(value.payload_size_bucket, PAYLOAD_SIZE_BUCKETS) as PayloadSizeBucket | undefined; if (!v) return null; rebuilt.payload_size_bucket = v; }
  for (const key of ["environment", "release", "runtime_name", "runtime_version"] as const) {
    if (value[key] !== undefined) { const v = optionalSafeToken(value[key] as string | undefined); if (!v) return null; (rebuilt as Record<string, unknown>)[key] = v; }
  }
  return rebuilt;
}
