import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
  type AccessTokenGetter,
} from "@/lib/supabase/client";

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

function classifyReadError(error: {
  message?: string;
  code?: string;
  details?: string;
}): string {
  const code = error.code ?? "";
  const combined = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  if (
    code === "PGRST301" ||
    combined.includes("jwt") ||
    combined.includes("401") ||
    combined.includes("403") ||
    combined.includes("unauthorized") ||
    combined.includes("permission denied") ||
    combined.includes("row-level security")
  ) {
    return (
      "Could not read saved analyses: Clerk ↔ Supabase authentication failed. " +
      "Confirm third-party auth and RLS are configured."
    );
  }

  if (
    combined.includes("relation") &&
    combined.includes("does not exist")
  ) {
    return (
      "Could not read saved analyses: job_analyses table not found. " +
      "Run web/database/schema.sql in Supabase."
    );
  }

  const suffix = code ? ` (${code})` : "";
  return (
    (error.message?.trim() || "Could not load saved cloud analyses.") + suffix
  );
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
    const supabase = createClerkSupabaseClient(getAccessToken);

    const { data, error } = await supabase
      .from("job_analyses")
      .select(SAVED_ANALYSIS_LIST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { status: "error", message: classifyReadError(error) };
    }

    return {
      status: "success",
      analyses: (data ?? []) as SavedCloudAnalysis[],
    };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Unexpected error while loading saved analyses.",
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
