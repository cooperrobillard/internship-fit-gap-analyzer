/**
 * Design contract for the future cloud saved-analysis write path.
 *
 * This module does NOT call Supabase, persist data, or require Clerk/env vars.
 * Step 7 will implement the actual insert helper using a plan from here.
 *
 * Privacy: the first hosted write path intentionally excludes raw resume text
 * and raw job posting text (no resume_text, no job_text).
 */

/** One skill name plus taxonomy category from the analyzer result. */
export type SkillResult = {
  skill: string;
  category: string;
};

/** Optional labels and metadata for a saved cloud analysis (no body text). */
export type CloudAnalysisMetadata = {
  runLabel?: string;
  jobTitle?: string;
  company?: string;
  sourceUrl?: string;
  notes?: string;
};

/**
 * Input for a future cloud save — structured analysis output only.
 * Does not include raw resume or job description text.
 */
export type CloudAnalysisSaveInput = {
  metadata: CloudAnalysisMetadata;
  matchedSkills: SkillResult[];
  missingSkills: SkillResult[];
};

/** Planned row for analysis_runs (clerk_user_id added at insert time from Clerk). */
export type PlannedAnalysisRunRow = {
  run_label: string | null;
  resume_profile_id: null;
};

/**
 * Planned row for job_analyses (analysis_run_id and clerk_user_id added at insert).
 * job_text is intentionally omitted from the first write path.
 */
export type PlannedJobAnalysisRow = {
  job_title: string | null;
  company: string | null;
  source_url: string | null;
  notes: string | null;
  matched_skills_count: number;
  missing_skills_count: number;
};

/** Planned row for matched_skills (job_analysis_id and clerk_user_id added at insert). */
export type PlannedMatchedSkillRow = {
  skill: string;
  category: string;
};

/** Planned row for skill_gaps (job_analysis_id and clerk_user_id added at insert). */
export type PlannedSkillGapRow = {
  skill: string;
  category: string;
};

/**
 * Pure representation of the rows a future save helper will insert, in order.
 *
 * Future insert order (Step 7):
 * 1. analysis_runs — parent session row
 * 2. job_analyses — one job result linked to the run
 * 3. matched_skills — one row per matched skill linked to the job analysis
 * 4. skill_gaps — one row per missing skill linked to the job analysis
 */
export type CloudAnalysisWritePlan = {
  analysisRun: PlannedAnalysisRunRow;
  jobAnalysis: PlannedJobAnalysisRow;
  matchedSkills: PlannedMatchedSkillRow[];
  skillGaps: PlannedSkillGapRow[];
};

function normalizeOptionalString(value?: string): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeSkillResult(skill: SkillResult): SkillResult {
  return {
    skill: skill.skill.trim(),
    category: skill.category.trim(),
  };
}

/**
 * Build a write plan from analyzer output. Pure function — no I/O.
 * Use this in Step 7 before issuing Supabase inserts inside a transaction.
 */
export function buildCloudAnalysisWritePlan(
  input: CloudAnalysisSaveInput,
): CloudAnalysisWritePlan {
  const matchedSkills = input.matchedSkills
    .map(normalizeSkillResult)
    .filter((row) => row.skill.length > 0 && row.category.length > 0);

  const skillGaps = input.missingSkills
    .map(normalizeSkillResult)
    .filter((row) => row.skill.length > 0 && row.category.length > 0);

  const metadata = input.metadata;

  return {
    analysisRun: {
      run_label: normalizeOptionalString(metadata.runLabel),
      resume_profile_id: null,
    },
    jobAnalysis: {
      job_title: normalizeOptionalString(metadata.jobTitle),
      company: normalizeOptionalString(metadata.company),
      source_url: normalizeOptionalString(metadata.sourceUrl),
      notes: normalizeOptionalString(metadata.notes),
      matched_skills_count: matchedSkills.length,
      missing_skills_count: skillGaps.length,
    },
    matchedSkills,
    skillGaps,
  };
}
