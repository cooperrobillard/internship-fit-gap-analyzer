import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";

function getBackendBaseUrl(): string {
  const configured = process.env.ANALYSIS_API_URL?.trim();
  if (!configured) {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return configured.replace(/\/$/, "");
}

export async function POST(request: Request) {
  await auth.protect();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const sharedSecret = process.env.ANALYSIS_API_SHARED_SECRET?.trim();
  if (sharedSecret) {
    headers["X-Analysis-Api-Key"] = sharedSecret;
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => null);
    if (payload === null) {
      return NextResponse.json(
        { detail: "Analysis service returned an invalid response." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Analysis service is unavailable." },
      { status: 503 },
    );
  }
}
