import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { REQUEST_ID_HEADER, generateRequestId } from "@/lib/observability/safe-events";

export const runtime = "nodejs";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";
const BACKEND_REQUEST_TIMEOUT_MS = 25_000;
const MAX_EXTRACT_REQUEST_BODY_BYTES = 5 * 1024 * 1024 + 64 * 1024;

type ErrorBody = { detail: string };

const REQUEST_TOO_LARGE_MESSAGE =
  "The upload is too large. Use a file up to 5 MB or paste the text instead.";

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

function contentLengthExceedsLimit(request: Request): boolean {
  const value = request.headers.get("content-length");
  if (value === null) {
    return false;
  }
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return false;
  }
  return Number(trimmed) > MAX_EXTRACT_REQUEST_BODY_BYTES;
}

function preserveBackendStatus(status: number): number {
  if (status === 400 || status === 413 || status === 415 || status === 422) {
    return status;
  }
  if (status === 401 || status === 403) {
    return 502;
  }
  if (status >= 500) {
    return 503;
  }
  return 502;
}

function safeBackendErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "Document extraction is temporarily unavailable. Please try again shortly.";
  }
  if (status >= 500) {
    return "Document extraction is temporarily unavailable. Please try again shortly.";
  }
  return "We could not extract that document right now. Please try again.";
}

export type ExtractDocumentRouteTestDeps = {
  protect?: () => Promise<void>;
  fetchImpl?: typeof fetch;
  generateRequestIdImpl?: () => string;
};

let extractRouteTestDeps: ExtractDocumentRouteTestDeps | undefined;

/** Test-only seam; production POST ignores this when unset. */
export function __setExtractDocumentRouteTestDeps(
  deps: ExtractDocumentRouteTestDeps | undefined,
): void {
  extractRouteTestDeps = deps;
}

export async function POST(request: Request) {
  const protectSession = extractRouteTestDeps?.protect ?? (async () => auth.protect());
  await protectSession();
  const requestId = (extractRouteTestDeps?.generateRequestIdImpl ?? generateRequestId)();

  if (contentLengthExceedsLimit(request)) {
    return jsonError(REQUEST_TOO_LARGE_MESSAGE, 413, requestId);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(
      "The upload could not be read. Try again or paste the text instead.",
      400,
      requestId,
    );
  }

  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return jsonError(
      "Document extraction is temporarily unavailable. Please try again shortly.",
      500,
      requestId,
    );
  }

  const headers: HeadersInit = {
    [REQUEST_ID_HEADER]: requestId,
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const fetchImpl = extractRouteTestDeps?.fetchImpl ?? fetch;
    const response = await fetchImpl(`${baseUrl}/extract-document`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload: unknown;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      return jsonError(
        "Document extraction is temporarily unavailable. Please try again shortly.",
        502,
        requestId,
      );
    }

    if (response.ok) {
      return withRequestId(NextResponse.json(payload, { status: response.status }), requestId);
    }

    const clientStatus = preserveBackendStatus(response.status);
    if (
      clientStatus === 400 ||
      clientStatus === 413 ||
      clientStatus === 415 ||
      clientStatus === 422
    ) {
      const detail =
        payload &&
        typeof payload === "object" &&
        typeof (payload as { detail?: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : safeBackendErrorMessage(response.status);
      return jsonError(detail, clientStatus, requestId);
    }

    return jsonError(safeBackendErrorMessage(response.status), clientStatus, requestId);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(
        "Extraction is taking longer than expected. Please try again shortly.",
        504,
        requestId,
      );
    }
    return jsonError(
      "Document extraction is temporarily unavailable. Please try again shortly.",
      503,
      requestId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
