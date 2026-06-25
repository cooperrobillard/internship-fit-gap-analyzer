import {
  formatOptionalMetadata,
  formatNotesPreview,
  formatSourceUrl,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  normalizeOptionalMetadata,
  type SourceUrlDisplay,
} from "@/lib/saved-analysis-metadata";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
  type AccessTokenGetter,
} from "@/lib/supabase/client";
import {
  getSafeSavedAnalysisErrorMessage,
  isMissingSupabaseConfigError,
} from "@/lib/supabase/supabase-errors";

export {
  formatNotesPreview,
  formatOptionalMetadata,
  formatSourceUrl,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  normalizeOptionalMetadata,
  type SourceUrlDisplay,
};

/** Safe list fields from job_analyses — excludes job_text and other sensitive columns. */
const SAVED_ANALYSIS_LIST_FIELDS =
  "id, job_title, company, source_url, notes, matched_skills_count, missing_skills_count, created_at, matched_skills(skill, category), skill_gaps(skill, category)";

const SAVED_ANALYSIS_DETAIL_FIELDS = SAVED_ANALYSIS_LIST_FIELDS;

const DEFAULT_LIST_LIMIT = 10;

export type SavedAnalysisSkill = {
  skill: string;
  category: string;
};

export type SavedCloudAnalysis = {
  id: string;
  job_title: string | null;
  company: string | null;
  source_url: string | null;
  notes: string | null;
  matched_skills_count: number;
  missing_skills_count: number;
  created_at: string;
};

/** List row with skill names for client-side search (no raw resume/job text). */
export type SavedCloudAnalysisListItem = SavedCloudAnalysis & {
  matchedSkills: SavedAnalysisSkill[];
  missingSkills: SavedAnalysisSkill[];
};

export type SavedAnalysisDetail = SavedCloudAnalysis & {
  matchedSkills: SavedAnalysisSkill[];
  missingSkills: SavedAnalysisSkill[];
};

export type SavedAnalysesResult =
  | { status: "success"; analyses: SavedCloudAnalysisListItem[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export type SavedAnalysisDetailResult =
  | { status: "success"; analysis: SavedAnalysisDetail }
  | { status: "not_found" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export type DeleteSavedAnalysisResult =
  | { status: "success" }
  | { status: "not_found" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

type JobAnalysisListRow = SavedCloudAnalysis & {
  matched_skills: SavedAnalysisSkill[] | null;
  skill_gaps: SavedAnalysisSkill[] | null;
};

type JobAnalysisDetailRow = JobAnalysisListRow;

/** Format a saved-analysis timestamp for display. */
export function formatSavedAnalysisDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

/** @deprecated Use getSavedAnalysisDisplayTitle */
export function savedAnalysisLabel(analysis: SavedCloudAnalysis): string {
  return getSavedAnalysisDisplayTitle(analysis);
}

function sortSkills(skills: SavedAnalysisSkill[]): SavedAnalysisSkill[] {
  return [...skills].sort((left, right) => {
    const bySkill = left.skill.localeCompare(right.skill);
    if (bySkill !== 0) {
      return bySkill;
    }
    return left.category.localeCompare(right.category);
  });
}

function mapListRow(row: JobAnalysisListRow): SavedCloudAnalysisListItem {
  return {
    id: row.id,
    job_title: row.job_title,
    company: row.company,
    source_url: row.source_url,
    notes: row.notes,
    matched_skills_count: row.matched_skills_count,
    missing_skills_count: row.missing_skills_count,
    created_at: row.created_at,
    matchedSkills: sortSkills(row.matched_skills ?? []),
    missingSkills: sortSkills(row.skill_gaps ?? []),
  };
}

function mapDetailRow(row: JobAnalysisDetailRow): SavedAnalysisDetail {
  return mapListRow(row);
}

/**
 * Read the signed-in user's recent saved job analyses from Supabase (read-only).
 * Uses the Clerk-aware browser client from Step 4.
 */
export async function fetchRecentSavedAnalyses(
  getAccessToken: AccessTokenGetter,
  limit: number = DEFAULT_LIST_LIMIT,
): Promise<SavedAnalysesResult> {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", null, {
          reason: "session",
        }),
      };
    }

    const supabase = createClerkSupabaseClient(getAccessToken);

    const { data, error } = await supabase
      .from("job_analyses")
      .select(SAVED_ANALYSIS_LIST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", error),
      };
    }

    return {
      status: "success",
      analyses: ((data ?? []) as JobAnalysisListRow[]).map(mapListRow),
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", null, {
          reason: "config",
        }),
      };
    }

    return {
      status: "error",
      message: getSafeSavedAnalysisErrorMessage("read", null, {
        reason: "network",
      }),
    };
  }
}

/**
 * Read one saved analysis with matched and missing skill rows (RLS-scoped).
 * Does not load raw resume or job body text.
 */
export async function fetchSavedAnalysisDetail(
  getAccessToken: AccessTokenGetter,
  analysisId: string,
): Promise<SavedAnalysisDetailResult> {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" };
  }

  const trimmedId = analysisId.trim();
  if (!trimmedId) {
    return { status: "not_found" };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", null, {
          reason: "session",
        }),
      };
    }

    const supabase = createClerkSupabaseClient(getAccessToken);

    const { data, error } = await supabase
      .from("job_analyses")
      .select(SAVED_ANALYSIS_DETAIL_FIELDS)
      .eq("id", trimmedId)
      .maybeSingle();

    if (error) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", error),
      };
    }

    if (!data) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      analysis: mapDetailRow(data as JobAnalysisDetailRow),
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", null, {
          reason: "config",
        }),
      };
    }

    return {
      status: "error",
      message: getSafeSavedAnalysisErrorMessage("read", null, {
        reason: "network",
      }),
    };
  }
}

/**
 * Delete one saved job analysis owned by the signed-in user (RLS-scoped).
 *
 * Deletes the job_analyses row; matched_skills and skill_gaps cascade per
 * schema.sql. Does not load or return raw resume or job body text.
 */
export async function deleteSavedAnalysis(
  getAccessToken: AccessTokenGetter,
  analysisId: string,
): Promise<DeleteSavedAnalysisResult> {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" };
  }

  const trimmedId = analysisId.trim();
  if (!trimmedId) {
    return { status: "not_found" };
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("delete", null, {
          reason: "session",
        }),
      };
    }

    const supabase = createClerkSupabaseClient(getAccessToken);

    const { data: existingRow, error: lookupError } = await supabase
      .from("job_analyses")
      .select("id")
      .eq("id", trimmedId)
      .maybeSingle();

    if (lookupError) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("delete", lookupError),
      };
    }

    if (!existingRow) {
      return { status: "not_found" };
    }

    const { error: deleteError } = await supabase
      .from("job_analyses")
      .delete()
      .eq("id", trimmedId);

    if (deleteError) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("delete", deleteError),
      };
    }

    return { status: "success" };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("delete", null, {
          reason: "config",
        }),
      };
    }

    return {
      status: "error",
      message: getSafeSavedAnalysisErrorMessage("delete", null, {
        reason: "network",
      }),
    };
  }
}

