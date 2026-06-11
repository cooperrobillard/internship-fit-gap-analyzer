import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCloudAnalysisWritePlan,
  type CloudAnalysisSaveInput,
} from "@/lib/supabase/save-analysis-contract";

export type SaveCloudAnalysisResult =
  | { status: "success"; analysisRunId: string; jobAnalysisId: string }
  | { status: "error"; message: string };

function classifySaveError(error: {
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
      "Could not save analysis: Clerk ↔ Supabase authentication or RLS blocked " +
      "the insert. Confirm third-party auth and insert policies."
    );
  }

  if (
    combined.includes("relation") &&
    combined.includes("does not exist")
  ) {
    return (
      "Could not save analysis: a required table was not found. " +
      "Run web/database/schema.sql in Supabase."
    );
  }

  const suffix = code ? ` (${code})` : "";
  return (error.message?.trim() || "Could not save cloud analysis.") + suffix;
}

/**
 * Best-effort rollback: delete the parent analysis_runs row so CASCADE removes
 * child job_analyses / skill rows per schema.sql.
 */
async function cleanupAnalysisRun(
  supabase: SupabaseClient,
  analysisRunId: string,
  clerkUserId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("analysis_runs")
    .delete()
    .eq("id", analysisRunId)
    .eq("clerk_user_id", clerkUserId);

  return !error;
}

/**
 * Save one structured cloud analysis to Supabase (first real insert helper).
 *
 * - Expects a Clerk-authenticated Supabase client from createClerkSupabaseClient().
 * - Does not insert raw resume or job body text (no resume_text, no job_text).
 * - Not wired to dashboard UI yet; caller must pass clerkUserId from Clerk session.
 * - Assumes RLS policies in schema.sql are applied.
 */
export async function saveCloudAnalysis(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: CloudAnalysisSaveInput,
): Promise<SaveCloudAnalysisResult> {
  const userId = clerkUserId.trim();
  if (!userId) {
    return { status: "error", message: "A signed-in Clerk user ID is required." };
  }

  const plan = buildCloudAnalysisWritePlan(input);

  // 1. analysis_runs
  const { data: runRow, error: runError } = await supabase
    .from("analysis_runs")
    .insert({
      clerk_user_id: userId,
      run_label: plan.analysisRun.run_label,
      resume_profile_id: plan.analysisRun.resume_profile_id,
    })
    .select("id")
    .single();

  if (runError || !runRow?.id) {
    return {
      status: "error",
      message: classifySaveError(runError ?? { message: "Failed to create analysis run." }),
    };
  }

  const analysisRunId = runRow.id as string;

  // 2. job_analyses (job_text omitted — not stored on first write path)
  const { data: jobRow, error: jobError } = await supabase
    .from("job_analyses")
    .insert({
      analysis_run_id: analysisRunId,
      clerk_user_id: userId,
      job_title: plan.jobAnalysis.job_title,
      company: plan.jobAnalysis.company,
      source_url: plan.jobAnalysis.source_url,
      notes: plan.jobAnalysis.notes,
      matched_skills_count: plan.jobAnalysis.matched_skills_count,
      missing_skills_count: plan.jobAnalysis.missing_skills_count,
    })
    .select("id")
    .single();

  if (jobError || !jobRow?.id) {
    const cleaned = await cleanupAnalysisRun(supabase, analysisRunId, userId);
    const base = classifySaveError(jobError ?? { message: "Failed to create job analysis." });
    return {
      status: "error",
      message: cleaned
        ? base
        : `${base} The save may be incomplete; check analysis_runs in Supabase.`,
    };
  }

  const jobAnalysisId = jobRow.id as string;

  // 3. matched_skills
  if (plan.matchedSkills.length > 0) {
    const { error: matchedError } = await supabase.from("matched_skills").insert(
      plan.matchedSkills.map((row) => ({
        job_analysis_id: jobAnalysisId,
        clerk_user_id: userId,
        skill: row.skill,
        category: row.category,
      })),
    );

    if (matchedError) {
      const cleaned = await cleanupAnalysisRun(supabase, analysisRunId, userId);
      const base = classifySaveError(matchedError);
      return {
        status: "error",
        message: cleaned
          ? base
          : `${base} The save may be incomplete; check Supabase for partial rows.`,
      };
    }
  }

  // 4. skill_gaps
  if (plan.skillGaps.length > 0) {
    const { error: gapsError } = await supabase.from("skill_gaps").insert(
      plan.skillGaps.map((row) => ({
        job_analysis_id: jobAnalysisId,
        clerk_user_id: userId,
        skill: row.skill,
        category: row.category,
      })),
    );

    if (gapsError) {
      const cleaned = await cleanupAnalysisRun(supabase, analysisRunId, userId);
      const base = classifySaveError(gapsError);
      return {
        status: "error",
        message: cleaned
          ? base
          : `${base} The save may be incomplete; check Supabase for partial rows.`,
      };
    }
  }

  return {
    status: "success",
    analysisRunId,
    jobAnalysisId,
  };
}
