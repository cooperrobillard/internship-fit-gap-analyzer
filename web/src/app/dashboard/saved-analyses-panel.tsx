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

export function SavedAnalysesPanel() {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(null);
  const completedSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!configured || !isLoaded || !sessionId || !session) {
      return;
    }

    if (completedSessionIdRef.current === sessionId) {
      return;
    }

    const activeSession = session;
    let cancelled = false;

    async function loadSavedAnalyses() {
      const result = await fetchRecentSavedAnalyses(() =>
        activeSession.getToken(),
      );

      if (cancelled) {
        return;
      }

      completedSessionIdRef.current = sessionId;
      setLoadResult(result);
    }

    void loadSavedAnalyses();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, isLoaded, sessionId]);

  if (!configured) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium text-zinc-900">Saved cloud analyses</p>
        <p className="mt-2">
          Supabase is not configured. Add env vars to{" "}
          <code className="text-xs">web/.env.local</code> to list saved rows from{" "}
          <code className="text-xs">job_analyses</code>. Creating or saving analyses
          from this app is not implemented yet.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Loading saved cloud analyses…</p>
        <p className="mt-2 text-sky-800/90">
          Waiting for Clerk session before the read-only list query.
        </p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <p className="font-medium">Saved cloud analyses unavailable</p>
        <p className="mt-2">Sign in to load your saved analysis list.</p>
      </div>
    );
  }

  if (loadResult === null) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Loading saved cloud analyses…</p>
        <p className="mt-2 text-sky-800/90">
          Read-only list from <code className="text-xs">job_analyses</code> (metadata
          and counts only—no job body text). Cloud saving is not implemented yet.
        </p>
      </div>
    );
  }

  if (loadResult.status === "not_configured") {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium">Supabase is not configured</p>
        <p className="mt-2">Cannot load saved cloud analyses without Supabase env vars.</p>
      </div>
    );
  }

  if (loadResult.status === "error") {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <p className="font-medium">Could not load saved cloud analyses</p>
        <p className="mt-2">{loadResult.message}</p>
        <p className="mt-3 text-red-900/80">
          This is read-model scaffolding only. Creating or saving analyses from the
          web app is not implemented yet.
        </p>
      </div>
    );
  }

  if (loadResult.analyses.length === 0) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
        <p className="font-medium text-zinc-900">Saved cloud analyses (read model)</p>
        <p className="mt-2">
          No saved cloud analyses yet for your account. Rows appear here only after a
          future cloud save path writes to <code className="text-xs">job_analyses</code>
          —this dashboard does not create or save analyses yet.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Use the Python CLI or local Streamlit app for analyses today. The Python
          analysis service is not connected to this dashboard yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
      <p className="font-medium text-zinc-900">Saved cloud analyses (read model)</p>
      <p className="mt-2 text-zinc-600">
        Showing your {loadResult.analyses.length} most recent rows from{" "}
        <code className="text-xs">job_analyses</code> (metadata and skill counts
        only). Creating or saving analyses from this app is not implemented yet.
      </p>
      <ul className="mt-4 space-y-3">
        {loadResult.analyses.map((analysis) => (
          <AnalysisRow key={analysis.id} analysis={analysis} />
        ))}
      </ul>
    </div>
  );
}
