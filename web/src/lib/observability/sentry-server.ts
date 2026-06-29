if (process.env.NODE_ENV !== "test" && process.env.NEXT_RUNTIME) {
  void import("server-only");
}

import { createRequire } from "node:module";

import { optionalSafeToken, validateSafeAnalysisEvent, type SafeAnalysisEvent } from "./safe-events";

const loadSdk = createRequire(import.meta.url);

type Sdk = { init: (options: Record<string, unknown>) => void; captureEvent: (event: Record<string, unknown>) => unknown; captureException?: unknown };
type Config = Record<string, string | undefined>;
export type CaptureStatus = "disabled" | "dropped" | "queued" | "failed";

let initialized = false;
let initFailed = false;
let activeSdk: Sdk | null = null;

export function __resetSentryServerForTests(): void { initialized = false; initFailed = false; activeSdk = null; }

function isEnabled(config: Config): boolean { return (config.OBSERVABILITY_TELEMETRY_ENABLED ?? "").trim().toLowerCase() === "true" && !!config.SENTRY_DSN?.trim(); }

function severityLevel(severity: string): "warning" | "error" | "fatal" | null {
  if (severity === "warning") return "warning";
  if (severity === "error") return "error";
  if (severity === "critical") return "fatal";
  return null;
}

function providerId(value: unknown): string | undefined { return typeof value === "string" && /^[a-f0-9]{32}$/.test(value) ? value : undefined; }
function providerTimestamp(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }

export function reconstructSentryEvent(incoming: Record<string, unknown>): Record<string, unknown> | null {
  const safe = validateSafeAnalysisEvent((incoming.extra as Record<string, unknown> | undefined)?.safe_event);
  if (!safe || safe.outcome !== "failure" || !safe.failure_class) return null;
  const level = severityLevel(safe.severity);
  if (!level) return null;
  const tags: Record<string, string> = {
    schema_version: safe.schema_version,
    event_name: safe.event_name,
    service: safe.service,
    operation: safe.operation,
    outcome: safe.outcome,
    severity: safe.severity,
    failure_class: safe.failure_class,
    route_template: safe.route_template,
    http_method: safe.http_method,
    http_status: String(safe.http_status),
  };
  for (const key of ["upstream_status_class", "payload_size_bucket", "environment", "release"] as const) {
    const value = safe[key]; if (value) tags[key] = String(value);
  }
  const event: Record<string, unknown> = {
    message: `${safe.service}:${safe.failure_class}`,
    level,
    fingerprint: [safe.service, safe.failure_class],
    tags,
    extra: { safe_event: safe },
    breadcrumbs: [],
  };
  const event_id = providerId(incoming.event_id); if (event_id) event.event_id = event_id;
  const timestamp = providerTimestamp(incoming.timestamp); if (timestamp) event.timestamp = timestamp;
  return event;
}

function initIfNeeded(config: Config, sdk: Sdk): boolean {
  if (!isEnabled(config)) return false;
  if (initialized) return !initFailed;
  try {
    sdk.init({
      dsn: config.SENTRY_DSN?.trim(),
      environment: optionalSafeToken(config.SENTRY_ENVIRONMENT),
      release: optionalSafeToken(config.SENTRY_RELEASE),
      sendDefaultPii: false,
      defaultIntegrations: false,
      integrations: [],
      maxBreadcrumbs: 0,
      attachStacktrace: false,
      enableLogs: false,
      sendClientReports: false,
      tracePropagationTargets: [],
      beforeBreadcrumb: () => null,
      beforeSend: (event: unknown) => reconstructSentryEvent((event ?? {}) as Record<string, unknown>) as never,
    });
    initialized = true; activeSdk = sdk; return true;
  } catch { initialized = true; initFailed = true; return false; }
}

export function captureSafeFailureToSentry(event: SafeAnalysisEvent, deps?: { sdk?: Sdk; config?: Config }): CaptureStatus {
  try {
    const safe = validateSafeAnalysisEvent(event);
    if (!safe || safe.outcome !== "failure" || !safe.failure_class) return "dropped";
    const config = deps?.config ?? process.env;
    if (!isEnabled(config)) return "disabled";
    const sdk = deps?.sdk ?? (loadSdk("@sentry/node") as Sdk);
    if (!initIfNeeded(config, sdk)) return "disabled";
    (activeSdk ?? sdk).captureEvent({ extra: { safe_event: safe } } as never);
    return "queued";
  } catch { return "failed"; }
}
