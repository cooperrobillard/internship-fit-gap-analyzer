import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import {
  DOCUMENT_UPLOAD_ACCEPT,
  MAX_DOCUMENT_FILE_BYTES,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  buildDocumentExtractionFormData,
  extractDocument,
  extractDocumentFromFile,
  extractDocumentFromPastedText,
  isSupportedDocumentFile,
  validateDocumentFile,
} from "@/lib/document-extraction";

import {
  POST,
  __setExtractDocumentRouteTestDeps,
} from "@/app/api/extract-document/route";

const BACKEND_BASE_URL = "https://analysis-backend.test";
const SHARED_SECRET = "SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE";

type CapturedFetch = {
  url: string;
  init?: RequestInit;
};

let capturedFetches: CapturedFetch[] = [];
let originalEnv: NodeJS.ProcessEnv;

function resetCaptured(): void {
  capturedFetches = [];
}

function createMockFetch(options: {
  status?: number;
  body?: string;
  rejectWith?: Error;
} = {}): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedFetches.push({ url: String(input), init });
    if (options.rejectWith) {
      throw options.rejectWith;
    }
    const status = options.status ?? 200;
    const body =
      options.body ??
      JSON.stringify({
        text: "Python SQL experience",
        suggestedName: "Alex Morgan",
        skills: ["Python", "SQL"],
        sourceKind: "txt",
      });
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

beforeEach(() => {
  resetCaptured();
  originalEnv = { ...process.env };
  process.env.ANALYSIS_API_URL = BACKEND_BASE_URL;
  process.env.ANALYSIS_API_SHARED_SECRET = SHARED_SECRET;
  __setExtractDocumentRouteTestDeps({
    protect: async () => undefined,
    generateRequestIdImpl: () => "123e4567-e89b-42d3-a456-426614174000",
  });
});

afterEach(() => {
  process.env = originalEnv;
  __setExtractDocumentRouteTestDeps(undefined);
});

test("supported extensions and accept string are exposed", () => {
  assert.deepEqual(SUPPORTED_DOCUMENT_EXTENSIONS, [".pdf", ".docx", ".txt", ".md"]);
  assert.match(DOCUMENT_UPLOAD_ACCEPT, /\.pdf/);
});

test("validateDocumentFile rejects oversized files", () => {
  const file = new File(["x"], "big.txt", { type: "text/plain" });
  Object.defineProperty(file, "size", { value: MAX_DOCUMENT_FILE_BYTES + 1 });
  const result = validateDocumentFile(file);
  assert.equal(result?.status, "error");
  assert.equal(result && result.status === "error" ? result.category : "", "oversized");
});

test("isSupportedDocumentFile accepts supported extensions", () => {
  const file = new File(["hello"], "resume.pdf", { type: "application/pdf" });
  assert.equal(isSupportedDocumentFile(file), true);
});

test("extractDocument parses successful responses", async () => {
  const result = await extractDocument(buildDocumentExtractionFormData({ pastedText: "Python SQL" }), {
    fetchImpl: createMockFetch(),
  });
  assert.equal(result.status, "success");
  if (result.status === "success") {
    assert.equal(result.sourceKind, "txt");
    assert.deepEqual(result.skills, ["Python", "SQL"]);
  }
});

test("extractDocument maps backend errors safely", async () => {
  const result = await extractDocument(buildDocumentExtractionFormData({ pastedText: "Python" }), {
    fetchImpl: createMockFetch({
      status: 422,
      body: JSON.stringify({ detail: "No readable text was found." }),
    }),
  });
  assert.equal(result.status, "error");
  if (result.status === "error") {
    assert.equal(result.category, "unreadable");
    assert.match(result.message, /readable text/i);
  }
});

test("extractDocumentFromFile validates before calling the route", async () => {
  const file = new File(["x"], "notes.rtf", { type: "application/rtf" });
  const result = await extractDocumentFromFile(file, { fetchImpl: createMockFetch() });
  assert.equal(result.status, "error");
  assert.equal(capturedFetches.length, 0);
});

test("extractDocumentFromPastedText requires nonblank text", async () => {
  const result = await extractDocumentFromPastedText("   ");
  assert.equal(result.status, "error");
});

test("proxy forwards multipart without setting Content-Type manually", async () => {
  __setExtractDocumentRouteTestDeps({
    protect: async () => undefined,
    fetchImpl: createMockFetch(),
    generateRequestIdImpl: () => "123e4567-e89b-42d3-a456-426614174000",
  });

  const formData = new FormData();
  formData.append("text", "Python SQL");
  const request = new Request("http://localhost/api/extract-document", {
    method: "POST",
    body: formData,
  });

  await POST(request);

  assert.equal(capturedFetches.length, 1);
  assert.equal(capturedFetches[0]?.url, `${BACKEND_BASE_URL}/extract-document`);
  const headers = capturedFetches[0]?.init?.headers as Headers | Record<string, string>;
  const apiKey =
    headers instanceof Headers
      ? headers.get("X-Analysis-Api-Key")
      : (headers as Record<string, string>)["X-Analysis-Api-Key"];
  assert.equal(apiKey, SHARED_SECRET);
  const contentType =
    headers instanceof Headers
      ? headers.get("Content-Type")
      : (headers as Record<string, string>)["Content-Type"];
  assert.equal(contentType ?? null, null);
});

test("proxy maps upstream timeout to 504", async () => {
  __setExtractDocumentRouteTestDeps({
    protect: async () => undefined,
    fetchImpl: createMockFetch({ rejectWith: Object.assign(new Error("aborted"), { name: "AbortError" }) }),
    generateRequestIdImpl: () => "123e4567-e89b-42d3-a456-426614174000",
  });

  const formData = new FormData();
  formData.append("text", "Python");
  const response = await POST(
    new Request("http://localhost/api/extract-document", { method: "POST", body: formData }),
  );
  assert.equal(response.status, 504);
});

test("proxy preserves 415 from backend", async () => {
  __setExtractDocumentRouteTestDeps({
    protect: async () => undefined,
    fetchImpl: createMockFetch({
      status: 415,
      body: JSON.stringify({ detail: "Unsupported file type." }),
    }),
    generateRequestIdImpl: () => "123e4567-e89b-42d3-a456-426614174000",
  });

  const formData = new FormData();
  formData.append("text", "Python");
  const response = await POST(
    new Request("http://localhost/api/extract-document", { method: "POST", body: formData }),
  );
  assert.equal(response.status, 415);
});
