export type ExtractedJobMetadata = {
  jobTitle?: string;
  company?: string;
  sourceUrl?: string;
  notes?: string;
};

export const MAX_EXTRACTED_JOB_NOTES_LENGTH = 280;

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Normalize and bound AI-extracted job metadata for safe UI autofill. */
export function normalizeExtractedJobMetadata(
  raw: unknown,
): ExtractedJobMetadata | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const record = raw as Record<string, unknown>;
  const jobTitle = trimOptional(record.jobTitle);
  const company = trimOptional(record.company);
  const sourceUrl = trimOptional(record.sourceUrl);
  let notes = trimOptional(record.notes);

  if (notes && notes.length > MAX_EXTRACTED_JOB_NOTES_LENGTH) {
    notes = `${notes.slice(0, MAX_EXTRACTED_JOB_NOTES_LENGTH - 1).trimEnd()}…`;
  }

  if (!jobTitle && !company && !sourceUrl && !notes) {
    return undefined;
  }

  return { jobTitle, company, sourceUrl, notes };
}

export type JobMetadataFieldValues = {
  jobTitle: string;
  company: string;
  sourceUrl: string;
  notes: string;
};

/** Fill only empty job metadata fields from extracted AI values. */
export function applyExtractedJobMetadataAutofill(
  current: JobMetadataFieldValues,
  extracted: ExtractedJobMetadata | undefined,
): { next: JobMetadataFieldValues; filledAny: boolean } {
  if (!extracted) {
    return { next: current, filledAny: false };
  }

  const next = { ...current };
  let filledAny = false;

  if (!next.jobTitle.trim() && extracted.jobTitle) {
    next.jobTitle = extracted.jobTitle;
    filledAny = true;
  }
  if (!next.company.trim() && extracted.company) {
    next.company = extracted.company;
    filledAny = true;
  }
  if (!next.sourceUrl.trim() && extracted.sourceUrl) {
    next.sourceUrl = extracted.sourceUrl;
    filledAny = true;
  }
  if (!next.notes.trim() && extracted.notes) {
    next.notes = extracted.notes;
    filledAny = true;
  }

  return { next, filledAny };
}
