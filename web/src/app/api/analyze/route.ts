import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";
/** Hosted Render cold starts can be slow; allow time for the backend to wake up. */
const BACKEND_REQUEST_TIMEOUT_MS = 25_000;
const MAX_ANALYSIS_REQUEST_BODY_BYTES = 1_000_000;

type ErrorBody = { detail: string };

const REQUEST_TOO_LARGE_MESSAGE =
  "The analysis request is too large. Shorten the resume or job description and try again.";

function jsonError(detail: string, status: number): NextResponse<ErrorBody> {
  return NextResponse.json({ detail }, { status });
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
  if (status === 401 || status === 403) {
    return 502;
  }
  if (status >= 500) {
    return 503;
  }
  return 502;
}

export async function POST(request: Request) {
  await auth.protect();

  if (contentLengthExceedsLimit(request)) {
    return jsonError(REQUEST_TOO_LARGE_MESSAGE, 413);
  }

  let requestText: string;
  try {
    requestText = await request.text();
  } catch {
    return jsonError("The request could not be read. Check the inputs and try again.", 400);
  }

  if (new TextEncoder().encode(requestText).length > MAX_ANALYSIS_REQUEST_BODY_BYTES) {
    return jsonError(REQUEST_TOO_LARGE_MESSAGE, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(requestText);
  } catch {
    return jsonError("The request could not be read. Check the inputs and try again.", 400);
  }

  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return jsonError(
      "This feature is temporarily unavailable. Please try again shortly.",
      500,
    );
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/analyze`, {
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
      return jsonError("This feature is temporarily unavailable. Please try again shortly.", 502);
    }

    if (response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    if (response.status === 422 && payload !== null) {
      return NextResponse.json(payload, { status: 422 });
    }

    return jsonError(
      safeBackendErrorMessage(response.status),
      clientStatusForBackendError(response.status),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(
        "The analysis service is taking longer than expected. Please try again shortly.",
        504,
      );
    }

    return jsonError(
      "This feature is temporarily unavailable. Please try again shortly.",
      503,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
