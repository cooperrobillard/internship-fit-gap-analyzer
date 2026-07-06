/**
 * Browser client for transient document extraction via the Next.js route handler.
 *
 * - Calls POST /api/extract-document (server forwards to FastAPI with a shared secret)
 * - Does not persist uploads, extracted text, or filenames
 */

export const EXTRACT_DOCUMENT_API_ROUTE = "/api/extract-document";

export const SUPPORTED_DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;

export type SupportedDocumentExtension = (typeof SUPPORTED_DOCUMENT_EXTENSIONS)[number];

export const DOCUMENT_UPLOAD_ACCEPT =
  ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

/** Maximum upload size aligned with backend (5 MiB). */
export const MAX_DOCUMENT_FILE_BYTES = 5 * 1024 * 1024;

export type DocumentSourceKind = "pdf" | "docx" | "txt" | "md" | "pasted";

export type DocumentExtractionSuccess = {
  status: "success";
  text: string;
  suggestedName: string;
  skills: string[];
  sourceKind: DocumentSourceKind;
};

export type DocumentExtractionErrorCategory =
  | "unsupported"
  | "oversized"
  | "unreadable"
  | "validation"
  | "authentication"
  | "timeout"
  | "unavailable"
  | "generic";

export type DocumentExtractionResult =
  | DocumentExtractionSuccess
  | {
      status: "error";
      message: string;
      category: DocumentExtractionErrorCategory;
      retryable: boolean;
    };

type ApiExtractResponse = {
  text: string;
  suggestedName: string;
  skills: string[];
  sourceKind: string;
};

type RouteErrorBody = {
  detail?: unknown;
};

const SOURCE_KINDS = new Set<DocumentSourceKind>([
  "pdf",
  "docx",
  "txt",
  "md",
  "pasted",
]);

const EXTENSION_TO_KIND: Record<string, SupportedDocumentExtension> = {
  ".pdf": ".pdf",
  ".docx": ".docx",
  ".txt": ".txt",
  ".md": ".md",
};

function extensionFromFilename(filename: string): SupportedDocumentExtension | null {
  const lower = filename.trim().toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) {
    return null;
  }
  const ext = lower.slice(dot) as SupportedDocumentExtension;
  return EXTENSION_TO_KIND[ext] ?? null;
}

export function isSupportedDocumentFile(file: File): boolean {
  const byName = extensionFromFilename(file.name);
  if (byName) {
    return true;
  }
  const type = file.type.toLowerCase();
  return (
    type === "application/pdf" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "text/plain" ||
    type === "text/markdown"
  );
}

export function validateDocumentFile(file: File): DocumentExtractionResult | null {
  if (file.size === 0) {
    return {
      status: "error",
      message:
        "That file is empty. Choose a document with content or paste the text instead.",
      category: "unreadable",
      retryable: false,
    };
  }

  if (file.size > MAX_DOCUMENT_FILE_BYTES) {
    return {
      status: "error",
      message:
        "That file is too large (limit 5 MB). Use a smaller file or paste the text instead.",
      category: "oversized",
      retryable: false,
    };
  }

  if (!isSupportedDocumentFile(file)) {
    return {
      status: "error",
      message:
        "Unsupported file type. Upload PDF, DOCX, TXT, or MD, or paste the text instead.",
      category: "unsupported",
      retryable: false,
    };
  }

  return null;
}

function safeDetailMessage(payload: RouteErrorBody | null, fallback: string): string {
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) {
    const trimmed = detail.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.includes("traceback") ||
      lower.includes("exception") ||
      lower.includes("service_role") ||
      lower.includes("private key")
    ) {
      return fallback;
    }
    return trimmed;
  }
  return fallback;
}

function categoryForStatus(status: number): DocumentExtractionErrorCategory {
  if (status === 401 || status === 403) {
    return "authentication";
  }
  if (status === 413) {
    return "oversized";
  }
  if (status === 415) {
    return "unsupported";
  }
  if (status === 422) {
    return "unreadable";
  }
  if (status === 400) {
    return "validation";
  }
  if (status === 504) {
    return "timeout";
  }
  if (status === 502 || status === 503) {
    return "unavailable";
  }
  return "generic";
}

function parseExtractResponse(payload: unknown): DocumentExtractionSuccess | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const body = payload as Partial<ApiExtractResponse>;
  if (
    typeof body.text !== "string" ||
    typeof body.suggestedName !== "string" ||
    !Array.isArray(body.skills) ||
    typeof body.sourceKind !== "string"
  ) {
    return null;
  }
  if (!SOURCE_KINDS.has(body.sourceKind as DocumentSourceKind)) {
    return null;
  }
  const skills = body.skills.filter((skill): skill is string => typeof skill === "string");
  return {
    status: "success",
    text: body.text,
    suggestedName: body.suggestedName,
    skills,
    sourceKind: body.sourceKind as DocumentSourceKind,
  };
}

export function buildDocumentExtractionFormData(options: {
  file?: File;
  pastedText?: string;
  filename?: string;
}): FormData {
  const formData = new FormData();
  if (options.file) {
    formData.append("file", options.file, options.file.name);
  }
  if (options.pastedText !== undefined) {
    formData.append("text", options.pastedText);
  }
  if (options.filename) {
    formData.append("filename", options.filename);
  }
  return formData;
}

export type ExtractDocumentClientOptions = {
  fetchImpl?: typeof fetch;
  route?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 25_000;

export async function extractDocument(
  formData: FormData,
  options: ExtractDocumentClientOptions = {},
): Promise<DocumentExtractionResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const route = options.route ?? EXTRACT_DOCUMENT_API_ROUTE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(route, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    let payload: unknown = null;
    try {
      const responseText = await response.text();
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    if (response.ok) {
      const parsed = parseExtractResponse(payload);
      if (!parsed) {
        return {
          status: "error",
          message: "Document extraction returned an unexpected response. Please try again.",
          category: "unavailable",
          retryable: true,
        };
      }
      if (!parsed.text.trim()) {
        return {
          status: "error",
          message:
            "No readable text was found. Paste the content or try a different file.",
          category: "unreadable",
          retryable: false,
        };
      }
      return parsed;
    }

    const category = categoryForStatus(response.status);
    const retryable =
      category === "timeout" || category === "unavailable" || category === "authentication";

    return {
      status: "error",
      message: safeDetailMessage(
        payload as RouteErrorBody | null,
        category === "timeout"
          ? "Extraction is taking longer than expected. Please try again shortly."
          : category === "unavailable"
            ? "Document extraction is temporarily unavailable. Please try again shortly."
            : "We could not extract that document right now. Please try again.",
      ),
      category,
      retryable,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "error",
        message: "Extraction is taking longer than expected. Please try again shortly.",
        category: "timeout",
        retryable: true,
      };
    }
    return {
      status: "error",
      message: "Document extraction is temporarily unavailable. Please try again shortly.",
      category: "unavailable",
      retryable: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function extractDocumentFromFile(
  file: File,
  options?: ExtractDocumentClientOptions,
): Promise<DocumentExtractionResult> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    return validationError;
  }
  return extractDocument(buildDocumentExtractionFormData({ file }), options);
}

export async function extractDocumentFromPastedText(
  pastedText: string,
  options?: ExtractDocumentClientOptions & { filename?: string },
): Promise<DocumentExtractionResult> {
  const trimmed = pastedText.trim();
  if (!trimmed) {
    return {
      status: "error",
      message: "Paste résumé text before extracting.",
      category: "validation",
      retryable: false,
    };
  }
  return extractDocument(
    buildDocumentExtractionFormData({
      pastedText: trimmed,
      filename: options?.filename,
    }),
    options,
  );
}

export function formatSourceKindLabel(sourceKind: DocumentSourceKind): string {
  switch (sourceKind) {
    case "pdf":
      return "PDF";
    case "docx":
      return "DOCX";
    case "txt":
      return "TXT";
    case "md":
      return "Markdown";
    case "pasted":
      return "pasted text";
    default:
      return "document";
  }
}
