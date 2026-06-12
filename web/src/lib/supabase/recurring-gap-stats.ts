import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
  type AccessTokenGetter,
} from "@/lib/supabase/client";
import {
  getSafeSavedAnalysisErrorMessage,
  isMissingSupabaseConfigError,
} from "@/lib/supabase/supabase-errors";

const SKILL_GAP_FIELDS = "skill, category, job_analysis_id";

export type SkillGapRow = {
  skill: string;
  category: string;
  job_analysis_id: string;
};

export type RecurringGapStat = {
  skill: string;
  category: string;
  analysisCount: number;
  percentage: number;
};

export type RecurringGapStatsResult =
  | {
      status: "success";
      stats: RecurringGapStat[];
      totalSavedAnalyses: number;
    }
  | { status: "not_configured" }
  | { status: "error"; message: string };

/** Normalize skill names for grouping (case-insensitive). */
export function normalizeSkillName(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Aggregate missing-skill rows into recurring gap stats for the dashboard.
 * Pure function — safe to unit test without Supabase.
 */
export function buildRecurringGapStats(
  gaps: SkillGapRow[],
  totalSavedAnalyses: number,
): RecurringGapStat[] {
  const grouped = new Map<
    string,
    { skill: string; category: string; jobAnalysisIds: Set<string> }
  >();

  for (const row of gaps) {
    const key = normalizeSkillName(row.skill);
    if (!key) {
      continue;
    }

    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        skill: row.skill.trim(),
        category: row.category,
        jobAnalysisIds: new Set<string>(),
      };
      grouped.set(key, entry);
    }

    entry.jobAnalysisIds.add(row.job_analysis_id);
  }

  const denominator = Math.max(totalSavedAnalyses, 0);

  const stats = Array.from(grouped.values()).map((entry) => {
    const analysisCount = entry.jobAnalysisIds.size;
    const percentage =
      denominator > 0 ? Math.round((analysisCount / denominator) * 100) : 0;

    return {
      skill: entry.skill,
      category: entry.category,
      analysisCount,
      percentage,
    };
  });

  return stats.sort((left, right) => {
    if (right.analysisCount !== left.analysisCount) {
      return right.analysisCount - left.analysisCount;
    }
    return left.skill.localeCompare(right.skill);
  });
}

/**
 * Read recurring missing-skill stats for the signed-in user (RLS-scoped).
 * Uses normalized skill_gaps rows — no raw resume or job text.
 */
export async function fetchRecurringGapStats(
  getAccessToken: AccessTokenGetter,
): Promise<RecurringGapStatsResult> {
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

    const [gapsResponse, countResponse] = await Promise.all([
      supabase.from("skill_gaps").select(SKILL_GAP_FIELDS),
      supabase
        .from("job_analyses")
        .select("id", { count: "exact", head: true }),
    ]);

    if (gapsResponse.error) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", gapsResponse.error),
      };
    }

    if (countResponse.error) {
      return {
        status: "error",
        message: getSafeSavedAnalysisErrorMessage("read", countResponse.error),
      };
    }

    const totalSavedAnalyses = countResponse.count ?? 0;
    const gaps = (gapsResponse.data ?? []) as SkillGapRow[];

    return {
      status: "success",
      stats: buildRecurringGapStats(gaps, totalSavedAnalyses),
      totalSavedAnalyses,
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

/** User-facing line for how often a skill recurs across saved analyses. */
export function formatRecurringGapFrequency(
  stat: RecurringGapStat,
  totalSavedAnalyses: number,
): string {
  const analysisLabel = stat.analysisCount === 1 ? "analysis" : "analyses";
  const base = `Appears in ${stat.analysisCount} saved ${analysisLabel}`;

  if (totalSavedAnalyses <= 0) {
    return base;
  }

  return `${base} (${stat.percentage}% of ${totalSavedAnalyses})`;
}
