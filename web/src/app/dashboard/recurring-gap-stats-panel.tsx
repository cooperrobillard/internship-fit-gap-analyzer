"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRecurringGapStats,
  formatRecurringGapFrequency,
  type RecurringGapStatsResult,
} from "@/lib/supabase/recurring-gap-stats";

const boxClass = "rounded-lg border border-zinc-200 bg-white/70 p-4 text-sm leading-relaxed";
const DEFAULT_VISIBLE_ROWS = 5;

type RecurringGapStatsPanelProps = {
  refreshKey?: number;
};

export function RecurringGapStatsPanel({
  refreshKey = 0,
}: RecurringGapStatsPanelProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<RecurringGapStatsResult | null>(
    null,
  );
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
      <div
        className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-900`}
        role="status"
        aria-live="polite"
      >
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-zinc-600">Loading…</p>
      </div>
    );
  }

  if (!sessionId) {
    return null;
  }

  if (isLoading || loadResult === null) {
    return (
      <div
        className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-900`}
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
      >
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-zinc-600">
          Counting missing skills…
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
          className="mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          Try again
        </button>
      </div>
    );
  }

  const { stats, totalSavedAnalyses } = loadResult;

  if (totalSavedAnalyses === 0) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-900`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-zinc-700">
          Save an analysis to start seeing recurring gaps here.
        </p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-900`}>
        <p className="font-medium">Recurring skill gaps</p>
        <p className="mt-2 text-zinc-700">
          Your {totalSavedAnalyses} saved{" "}
          {totalSavedAnalyses === 1 ? "analysis has" : "analyses have"} no
          missing skills recorded.
        </p>
      </div>
    );
  }

  const visibleStats = stats.slice(0, DEFAULT_VISIBLE_ROWS);

  return (
    <div className={`${boxClass} text-zinc-900`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium text-zinc-950">Recurring skill gaps</h2>
        <p className="text-xs text-zinc-600">
          {totalSavedAnalyses} saved {totalSavedAnalyses === 1 ? "analysis" : "analyses"}
        </p>
      </div>
      <ul className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200">
        {visibleStats.map((stat) => (
          <li
            key={`${stat.skill}-${stat.category}`}
            className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.4fr)_auto] sm:items-baseline sm:gap-3"
          >
            <span className="break-words font-medium text-zinc-950">{stat.skill}</span>
            <span className="break-words text-zinc-600">{stat.category}</span>
            <span className="font-medium text-zinc-800">
              {formatRecurringGapFrequency(stat, totalSavedAnalyses)}
            </span>
          </li>
        ))}
      </ul>
      {stats.length > visibleStats.length ? (
        <details className="mt-4 rounded-md border border-zinc-200 bg-zinc-50/80 px-3 py-2">
          <summary className="min-h-10 cursor-pointer font-medium text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
            View full table
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <caption className="sr-only">
                Recurring missing skills across saved analyses
              </caption>
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-600">
                  <th scope="col" className="px-3 py-2 font-medium">Skill</th>
                  <th scope="col" className="px-3 py-2 font-medium">Category</th>
                  <th scope="col" className="px-3 py-2 font-medium">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={`${stat.skill}-${stat.category}`} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-zinc-900">{stat.skill}</td>
                    <td className="px-3 py-2 text-zinc-600">{stat.category}</td>
                    <td className="px-3 py-2 font-medium text-zinc-800">{formatRecurringGapFrequency(stat, totalSavedAnalyses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
