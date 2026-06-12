import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCloudAnalysisWritePlan,
  type CloudAnalysisSaveInput,
} from "@/lib/supabase/save-analysis-contract";
import {
  getSafeSavedAnalysisErrorMessage,
  isMissingSupabaseConfigError,
} from "@/lib/supabase/supabase-errors";

export type SaveCloudAnalysisResult =
  | { status: "success"; analysisRunId: string; jobAnalysisId: string }
  | { status: "error"; message: string };

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
 * - Assumes RLS policies in schema.sql are applied.
 */
export async function saveCloudAnalysis(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: CloudAnalysisSaveInput,
): Promise<SaveCloudAnalysisResult> {
  try {
    const userId = clerkUserId.trim();
    if (!userId) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("save", null, {
          reason: "session",
        }),
      };
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
        message: getSafeSavedAnalysisErrorMessage("save", runError ?? undefined),
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
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("save", jobError ?? undefined, {
          partialSave: !cleaned,
        }),
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
        return {
          status: "error",
          message: getSafeSavedAnalysisErrorMessage("save", matchedError, {
            partialSave: !cleaned,
          }),
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
        return {
          status: "error",
          message: getSafeSavedAnalysisErrorMessage("save", gapsError, {
            partialSave: !cleaned,
          }),
        };
      }
    }

    return {
      status: "success",
      analysisRunId,
      jobAnalysisId,
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("save", null, {
          reason: "config",
        }),
      };
    }

    return {
      status: "error",
      message: getSafeSavedAnalysisErrorMessage("save", null, {
        reason: "network",
      }),
    };
  }
}
