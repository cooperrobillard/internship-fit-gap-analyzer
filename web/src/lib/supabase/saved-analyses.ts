import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
  type AccessTokenGetter,
} from "@/lib/supabase/client";
import {
  getSafeSavedAnalysisErrorMessage,
  isMissingSupabaseConfigError,
} from "@/lib/supabase/supabase-errors";

/** Safe list fields from job_analyses — excludes job_text and other sensitive columns. */
const SAVED_ANALYSIS_LIST_FIELDS =
  "id, job_title, company, source_url, notes, matched_skills_count, missing_skills_count, created_at";

const DEFAULT_LIST_LIMIT = 10;

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

export type SavedAnalysesResult =
  | { status: "success"; analyses: SavedCloudAnalysis[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

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
      analyses: (data ?? []) as SavedCloudAnalysis[],
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

/** Short label for dashboard list rows (metadata only, no job body text). */
export function savedAnalysisLabel(analysis: SavedCloudAnalysis): string {
  if (analysis.job_title?.trim()) {
    return analysis.job_title.trim();
  }
  if (analysis.company?.trim()) {
    return analysis.company.trim();
  }
  return "Untitled analysis";
}
