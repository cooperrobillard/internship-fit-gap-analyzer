import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { captureSafeFailureToSentry } from "@/lib/observability/sentry-server";

import {
  REQUEST_ID_HEADER,
  createSafeAnalysisEvent,
  emitSafeEvent,
  generateRequestId,
  payloadSizeBucket,
  safeDurationMs,
  type FailureClass,
  type SafeSeverity,
} from "@/lib/observability/safe-events";

export const runtime = "nodejs";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";
/** Hosted Render cold starts can be slow; allow time for the backend to wake up. */
const BACKEND_REQUEST_TIMEOUT_MS = 25_000;
const MAX_ANALYSIS_REQUEST_BODY_BYTES = 1_000_000;

type ErrorBody = { detail: string };

const REQUEST_TOO_LARGE_MESSAGE =
  "The analysis request is too large. Shorten the resume or job description and try again.";

function withRequestId<T>(response: NextResponse<T>, requestId: string): NextResponse<T> {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function jsonError(detail: string, status: number, requestId: string): NextResponse<ErrorBody> {
  return withRequestId(NextResponse.json({ detail }, { status }), requestId);
}

function resolveBackendBaseUrl(): string | null {
  const configured = process.env.ANALYSIS_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return null;
}

function safeBackendErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "This feature is temporarily unavailable. Please try again shortly.";
  }
  if (status === 422) {
    return "Resume text and job description text are required.";
  }
  if (status === 429) {
    return "You have run several analyses in a short period. Wait about a minute and try again.";
  }
  if (status >= 500) {
    return "This feature is temporarily unavailable. Please try again shortly.";
  }
  return "We could not complete that action right now. Please try again.";
}

function contentLengthExceedsLimit(request: Request): boolean {
  const value = request.headers.get("content-length");
  if (value === null) {
    return false;
  }

  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return false;
  }

  return Number(trimmed) > MAX_ANALYSIS_REQUEST_BODY_BYTES;
}

function clientStatusForBackendError(status: number): number {
  if (status === 422) {
    return 422;
  }
  if (status === 429) {
    return 429;
  }
  if (status === 401 || status === 403) {
    return 502;
  }
  if (status >= 500) {
    return 503;
  }
  return 502;
}

export type AnalyzeRouteTestDeps = {
  protect?: () => Promise<void>;
  fetchImpl?: typeof fetch;
  generateRequestIdImpl?: () => string;
  captureSafeFailureToSentryImpl?: typeof captureSafeFailureToSentry;
};

let analyzeRouteTestDeps: AnalyzeRouteTestDeps | undefined;

/** Test-only seam; production POST ignores this when unset. */
export function __setAnalyzeRouteTestDeps(deps: AnalyzeRouteTestDeps | undefined): void {
  analyzeRouteTestDeps = deps;
}

function emitAnalysisFailureEvent(options: {
  requestId: string;
  startedAtMs: number;
  httpStatus: number;
  failureClass: FailureClass;
  severity: SafeSeverity;
  upstreamStatusClass?: "4xx" | "5xx" | "unknown";
  bodyByteLength?: number;
}): void {
  try {
    const event = createSafeAnalysisEvent({
      request_id: options.requestId,
      service: "nextjs_analysis_proxy",
      outcome: "failure",
      severity: options.severity,
      route_template: "/api/analyze",
      http_method: "POST",
      http_status: options.httpStatus,
      duration_ms: safeDurationMs(options.startedAtMs),
      failure_class: options.failureClass,
      upstream_status_class: options.upstreamStatusClass,
      payload_size_bucket: payloadSizeBucket(options.bodyByteLength),
      environment: process.env.NODE_ENV,
    });
    emitSafeEvent(event);
    (analyzeRouteTestDeps?.captureSafeFailureToSentryImpl ?? captureSafeFailureToSentry)(event);
  } catch {
    // Best effort only. Observability must never affect application behavior.
  }
}

function emitAnalysisSuccessEvent(requestId: string, startedAtMs: number, bodyByteLength: number): void {
  try {
    emitSafeEvent(createSafeAnalysisEvent({
      request_id: requestId,
      service: "nextjs_analysis_proxy",
      outcome: "success",
      severity: "info",
      route_template: "/api/analyze",
      http_method: "POST",
      http_status: 200,
      duration_ms: safeDurationMs(startedAtMs),
      payload_size_bucket: payloadSizeBucket(bodyByteLength),
      environment: process.env.NODE_ENV,
    }));
  } catch {
    // Best effort only. Observability must never affect application behavior.
  }
}

export async function POST(request: Request) {
  const protectSession = analyzeRouteTestDeps?.protect ?? (async () => auth.protect());
  await protectSession();
  const requestId = (analyzeRouteTestDeps?.generateRequestIdImpl ?? generateRequestId)();
  const startedAtMs = Date.now();
  if (contentLengthExceedsLimit(request)) {
    return jsonError(REQUEST_TOO_LARGE_MESSAGE, 413, requestId);
  }

  let requestText: string;
  try {
    requestText = await request.text();
  } catch {
    return jsonError("The request could not be read. Check the inputs and try again.", 400, requestId);
  }

  const bodyByteLength = new TextEncoder().encode(requestText).length;
  if (bodyByteLength > MAX_ANALYSIS_REQUEST_BODY_BYTES) {
    return jsonError(REQUEST_TOO_LARGE_MESSAGE, 413, requestId);
  }

  let body: unknown;
  try {
    body = JSON.parse(requestText);
  } catch {
    return jsonError("The request could not be read. Check the inputs and try again.", 400, requestId);
  }

  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    emitAnalysisFailureEvent({
      requestId,
      startedAtMs,
      httpStatus: 500,
      failureClass: "config.backend_url_missing",
      severity: "critical",
      bodyByteLength,
    });
    return jsonError(
      "This feature is temporarily unavailable. Please try again shortly.",
      500,
      requestId,
    );
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    [REQUEST_ID_HEADER]: requestId,
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const fetchImpl = analyzeRouteTestDeps?.fetchImpl ?? fetch;
    const response = await fetchImpl(`${baseUrl}/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload: unknown;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      emitAnalysisFailureEvent({
        requestId,
        startedAtMs,
        httpStatus: 502,
        failureClass: "proxy.upstream_invalid_response",
        severity: "error",
        upstreamStatusClass: "unknown",
        bodyByteLength,
      });
      return jsonError("This feature is temporarily unavailable. Please try again shortly.", 502, requestId);
    }

    if (response.ok) {
      emitAnalysisSuccessEvent(requestId, startedAtMs, bodyByteLength ?? 0);
      return withRequestId(NextResponse.json(payload, { status: response.status }), requestId);
    }

    if (response.status === 422 && payload !== null) {
      return withRequestId(NextResponse.json(payload, { status: 422 }), requestId);
    }

    if (response.status === 429) {
      return jsonError(safeBackendErrorMessage(429), 429, requestId);
    }

    const clientStatus = clientStatusForBackendError(response.status);
    if (response.status === 401 || response.status === 403) {
      emitAnalysisFailureEvent({ requestId, startedAtMs, httpStatus: clientStatus, failureClass: "config.shared_secret_rejected", severity: "critical", upstreamStatusClass: "4xx", bodyByteLength });
    } else if (response.status >= 500) {
      emitAnalysisFailureEvent({ requestId, startedAtMs, httpStatus: clientStatus, failureClass: "proxy.upstream_5xx", severity: "error", upstreamStatusClass: "5xx", bodyByteLength });
    } else if (response.status !== 422) {
      emitAnalysisFailureEvent({ requestId, startedAtMs, httpStatus: clientStatus, failureClass: "proxy.upstream_invalid_response", severity: "error", upstreamStatusClass: "4xx", bodyByteLength });
    }
    return jsonError(
      safeBackendErrorMessage(response.status),
      clientStatus,
      requestId,
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      emitAnalysisFailureEvent({ requestId, startedAtMs, httpStatus: 504, failureClass: "proxy.upstream_timeout", severity: "warning", bodyByteLength });
      return jsonError(
        "The analysis service is taking longer than expected. Please try again shortly.",
        504,
        requestId,
      );
    }

    emitAnalysisFailureEvent({ requestId, startedAtMs, httpStatus: 503, failureClass: "proxy.upstream_unreachable", severity: "error", bodyByteLength });
    return jsonError(
      "This feature is temporarily unavailable. Please try again shortly.",
      503,
      requestId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
