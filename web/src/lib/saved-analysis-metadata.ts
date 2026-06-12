/** Trim optional metadata strings; blank values become null. */
export function normalizeOptionalMetadata(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Primary list/detail heading from job title only. */
export function getSavedAnalysisDisplayTitle(
  analysis: { job_title: string | null },
): string {
  return normalizeOptionalMetadata(analysis.job_title) ?? "Untitled job";
}

/** Company line for list rows and detail metadata. */
export function getSavedAnalysisCompanyLabel(
  analysis: { company: string | null },
): string {
  return normalizeOptionalMetadata(analysis.company) ?? "Company not provided";
}

/** Generic fallback for optional metadata fields (e.g. notes). */
export function formatOptionalMetadata(value: string | null | undefined): string {
  return normalizeOptionalMetadata(value) ?? "Not provided";
}

export type SourceUrlDisplay =
  | { kind: "link"; href: string; label: string }
  | { kind: "text"; label: string }
  | { kind: "missing" };

const DEFAULT_URL_DISPLAY_MAX = 64;

function truncateForDisplay(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

/**
 * Format a stored source URL for safe display.
 * Only http/https values become clickable links.
 */
export function formatSourceUrl(
  value: string | null | undefined,
  maxDisplayLength: number = DEFAULT_URL_DISPLAY_MAX,
): SourceUrlDisplay {
  const normalized = normalizeOptionalMetadata(value);
  if (!normalized) {
    return { kind: "missing" };
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      const href = parsed.href;
      return {
        kind: "link",
        href,
        label: truncateForDisplay(href, maxDisplayLength),
      };
    }
  } catch {
    // Stored value is not a valid absolute URL — show as plain text below.
  }

  return {
    kind: "text",
    label: truncateForDisplay(normalized, maxDisplayLength),
  };
}

/** Truncate long notes for compact list hints; full text belongs in detail view. */
export function formatNotesPreview(
  value: string | null | undefined,
  maxLength: number = 80,
): string | null {
  const normalized = normalizeOptionalMetadata(value);
  if (!normalized) {
    return null;
  }
  return truncateForDisplay(normalized, maxLength);
}
