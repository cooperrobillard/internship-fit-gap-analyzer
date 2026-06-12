"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRecentSavedAnalyses,
  savedAnalysisLabel,
  type SavedAnalysesResult,
  type SavedCloudAnalysis,
} from "@/lib/supabase/saved-analyses";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function AnalysisRow({ analysis }: { analysis: SavedCloudAnalysis }) {
  const label = savedAnalysisLabel(analysis);

  return (
    <li className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500">{formatSavedAt(analysis.created_at)}</p>
      </div>
      {analysis.company && analysis.job_title ? (
        <p className="mt-1 text-zinc-600">{analysis.company}</p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-600">
        Matched: {analysis.matched_skills_count} · Missing:{" "}
        {analysis.missing_skills_count}
      </p>
      {analysis.source_url ? (
        <p className="mt-2 truncate text-xs text-sky-800">
          <a
            href={analysis.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Source link
          </a>
        </p>
      ) : null}
      {analysis.notes ? (
        <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{analysis.notes}</p>
      ) : null}
    </li>
  );
}

type SavedAnalysesPanelProps = {
  /** Increment to reload the list (e.g. after test cloud save). */
  refreshKey?: number;
};

export function SavedAnalysesPanel({ refreshKey = 0 }: SavedAnalysesPanelProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(null);
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

      const result = await fetchRecentSavedAnalyses(() => session!.getToken());

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
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium text-zinc-900">Your saved analyses</p>
        <p className="mt-2">
          Supabase is not configured, so saved analyses cannot load. Add env vars to{" "}
          <code className="text-xs">web/.env.local</code> (see{" "}
          <code className="text-xs">web/.env.example</code>).
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Loading your saved analyses…</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium text-zinc-900">Your saved analyses</p>
        <p className="mt-2">Sign in to see analyses you have saved.</p>
      </div>
    );
  }

  if (isLoading || loadResult === null) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Loading your saved analyses…</p>
        <p className="mt-2 text-sm text-sky-800/90">
          Showing job title, company, skill counts, and dates—not full resume or job
          text.
        </p>
      </div>
    );
  }

  if (loadResult.status === "not_configured") {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium">Supabase is not configured</p>
        <p className="mt-2">Saved analyses cannot load without Supabase env vars.</p>
      </div>
    );
  }

  if (loadResult.status === "error") {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <div
          className="rounded-md border border-red-200 bg-white/60 px-3 py-2"
          role="alert"
        >
          <p className="font-medium">Could not load saved analyses</p>
          <p className="mt-1">{loadResult.message}</p>
        </div>
        <p className="mt-3 text-sm text-red-900/80">
          Check your connection and try again. If this keeps happening, confirm
          Supabase and Clerk are configured correctly.
        </p>
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

  if (loadResult.analyses.length === 0) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
        <p className="font-medium text-zinc-900">Your saved analyses</p>
        <p className="mt-2">
          Nothing saved yet. Run an analysis above and click{" "}
          <strong>Save analysis</strong>, or use <strong>Test Supabase save</strong>{" "}
          to verify cloud storage.
        </p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
      <p className="font-medium text-zinc-900">Your saved analyses</p>
      <p className="mt-2 text-zinc-600">
        Your {loadResult.analyses.length} most recent saved comparison
        {loadResult.analyses.length === 1 ? "" : "s"} (skills and metadata only).
      </p>
      <ul className="mt-4 space-y-3">
        {loadResult.analyses.map((analysis) => (
          <AnalysisRow key={analysis.id} analysis={analysis} />
        ))}
      </ul>
    </div>
  );
}
