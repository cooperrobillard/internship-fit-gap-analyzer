"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRecurringGapStats,
  formatRecurringGapFrequency,
  type RecurringGapStatsResult,
} from "@/lib/supabase/recurring-gap-stats";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";
const DEFAULT_VISIBLE_ROWS = 12;

type RecurringGapStatsPanelProps = {
  refreshKey?: number;
};

export function RecurringGapStatsPanel({
  refreshKey = 0,
}: RecurringGapStatsPanelProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<RecurringGapStatsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const completedFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!configured || !isLoaded || !sessionId || !session) {
      return;
    }

    const fetchKey = `${sessionId}:${refreshKey}:${retryNonce}`;
    if (completedFetchKeyRef.current === fetchKey) {
      return;
    }

    let cancelled = false;

    async function runLoad() {
      setIsLoading(true);
      setLoadResult(null);

      const result = await fetchRecurringGapStats(() => session!.getToken());

      if (cancelled) {
        return;
      }

      completedFetchKeyRef.current = fetchKey;
      setLoadResult(result);
      setIsLoading(false);
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [configured, isLoaded, sessionId, session, refreshKey, retryNonce]);

  function handleRetry() {
    completedFetchKeyRef.current = null;
    setRetryNonce((nonce) => nonce + 1);
  }

  if (!configured) {
    return null;
  }

  if (!isLoaded) {
    return (
      <div className={`${boxClass} border-teal-200 bg-teal-50 text-teal-950`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-teal-900/80">Loading…</p>
      </div>
    );
  }

  if (!sessionId) {
    return null;
  }

  if (isLoading || loadResult === null) {
    return (
      <div className={`${boxClass} border-teal-200 bg-teal-50 text-teal-950`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-teal-900/80">
          Counting missing skills across your saved analyses…
        </p>
      </div>
    );
  }

  if (loadResult.status === "not_configured") {
    return null;
  }

  if (loadResult.status === "error") {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <div
          className="rounded-md border border-red-200 bg-white/60 px-3 py-2"
          role="alert"
        >
          <p className="font-medium">Could not load recurring skill gaps</p>
          <p className="mt-1">{loadResult.message}</p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const { stats, totalSavedAnalyses } = loadResult;

  if (totalSavedAnalyses === 0) {
    return (
      <div className={`${boxClass} border-teal-200 bg-teal-50 text-teal-950`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-teal-900/90">
          Skills that appear most often as missing across your saved analyses.
        </p>
        <p className="mt-3 text-teal-900/80">
          Save an analysis to start seeing recurring gaps here.
        </p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className={`${boxClass} border-teal-200 bg-teal-50 text-teal-950`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-teal-900/90">
          Skills that appear most often as missing across your saved analyses.
        </p>
        <p className="mt-3 text-teal-900/80">
          Your {totalSavedAnalyses} saved{" "}
          {totalSavedAnalyses === 1 ? "analysis has" : "analyses have"} no missing
          skills recorded. Rule-based matching only—results depend on the skill
          taxonomy.
        </p>
      </div>
    );
  }

  const visibleStats = stats.slice(0, DEFAULT_VISIBLE_ROWS);

  return (
    <div className={`${boxClass} border-teal-200 bg-teal-50 text-teal-950`}>
      <p className="font-medium">Recurring skill gaps</p>
      <p className="mt-2 text-teal-900/90">
        Skills that appear most often as missing across your saved analyses
        (rule-based, from {totalSavedAnalyses} saved{" "}
        {totalSavedAnalyses === 1 ? "analysis" : "analyses"}).
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-teal-200 bg-white">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b border-teal-100 text-xs uppercase tracking-wide text-teal-800/80">
              <th className="px-3 py-2 font-medium">Skill</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {visibleStats.map((stat) => (
              <tr
                key={`${stat.skill}-${stat.category}`}
                className="border-b border-teal-50 last:border-0"
              >
                <td className="px-3 py-2 font-medium text-zinc-900">{stat.skill}</td>
                <td className="px-3 py-2 text-zinc-600">{stat.category}</td>
                <td className="px-3 py-2 text-zinc-700">
                  {formatRecurringGapFrequency(stat, totalSavedAnalyses)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.length > visibleStats.length ? (
        <p className="mt-2 text-xs text-teal-800/80">
          Showing top {visibleStats.length} of {stats.length} recurring gaps.
        </p>
      ) : null}
    </div>
  );
}
