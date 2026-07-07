/**
 * Maps web analysis prototype output into the cloud save contract.
 *
 * Privacy: intentionally excludes `resumeText` and `jobText` from the payload.
 * Raw pasted resume and job description text must not reach Supabase on the
 * first hosted write path. Metadata notes come only from the user's optional
 * notes field — never from pasted body text.
 */

import type { WebAnalysisInput, WebAnalysisResult } from "./types";
import type { CloudAnalysisSaveInput } from "@/lib/supabase/save-analysis-contract";

const DEFAULT_RUN_LABEL = "Web analysis prototype";

/** Trim optional metadata; blank strings become undefined for the contract. */
function trimOptional(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/** Prefer job title and/or company for the run label; otherwise use a default. */
function buildRunLabel(jobTitle?: string, company?: string): string {
  if (jobTitle && company) {
    return `${jobTitle} @ ${company}`;
  }
  if (jobTitle) {
    return jobTitle;
  }
  if (company) {
    return company;
  }
  return DEFAULT_RUN_LABEL;
}

/**
 * Convert web analysis input + result into `CloudAnalysisSaveInput`.
 *
 * Skill rows pass through as-is; `buildCloudAnalysisWritePlan` trims and filters
 * them at insert time. Optional metadata strings are trimmed here; blanks become
 * undefined so the write plan can normalize them to `null`.
 */
export function mapWebAnalysisToCloudSaveInput(
  input: WebAnalysisInput,
  result: WebAnalysisResult,
): CloudAnalysisSaveInput {
  const jobTitle = trimOptional(input.jobTitle);
  const company = trimOptional(input.company);
  const sourceUrl = trimOptional(input.sourceUrl);
  const notes = trimOptional(input.notes);

  return {
    metadata: {
      runLabel: buildRunLabel(jobTitle, company),
      jobTitle,
      company,
      sourceUrl,
      notes,
    },
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
  };
}

/**
 * Merge current metadata field state onto the last analyzed input so saves
 * use what the user currently sees, while keeping analyzed resume/job text.
 */
export function withCurrentMetadataForSave(
  lastAnalyzedInput: WebAnalysisInput,
  currentMetadata: Pick<WebAnalysisInput, "jobTitle" | "company" | "sourceUrl" | "notes">,
): WebAnalysisInput {
  return {
    ...lastAnalyzedInput,
    jobTitle: trimOptional(currentMetadata.jobTitle),
    company: trimOptional(currentMetadata.company),
    sourceUrl: trimOptional(currentMetadata.sourceUrl),
    notes: trimOptional(currentMetadata.notes),
  };
}
