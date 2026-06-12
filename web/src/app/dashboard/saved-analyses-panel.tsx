"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { RecurringGapStatsPanel } from "@/app/dashboard/recurring-gap-stats-panel";
import { SavedAnalysisDetailPanel } from "@/app/dashboard/saved-analysis-detail";
import {
  filterSavedAnalyses,
  hasActiveSavedAnalysisSearch,
  SAVED_ANALYSIS_FILTER_OPTIONS,
  type SavedAnalysisListFilter,
} from "@/lib/saved-analysis-search";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRecentSavedAnalyses,
  formatNotesPreview,
  formatSavedAnalysisDate,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  type SavedAnalysesResult,
  type SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

function SavedAnalysesSearchControls({
  searchQuery,
  filter,
  onSearchQueryChange,
  onFilterChange,
  onClear,
  showClear,
  totalCount,
  visibleCount,
}: {
  searchQuery: string;
  filter: SavedAnalysisListFilter;
  onSearchQueryChange: (value: string) => void;
  onFilterChange: (value: SavedAnalysisListFilter) => void;
  onClear: () => void;
  showClear: boolean;
  totalCount: number;
  visibleCount: number;
}) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-[12rem] flex-1 text-sm">
          <span className="font-medium text-zinc-900">Search saved analyses</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Job title, company, skills, notes…"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            autoComplete="off"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-zinc-900">Filter</span>
          <select
            value={filter}
            onChange={(event) =>
              onFilterChange(event.target.value as SavedAnalysisListFilter)
            }
            className="mt-1 block w-full min-w-[11rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          >
            {SAVED_ANALYSIS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
        <p>
          Searching job title, company, source URL, notes, and skill names. Recurring
          gap stats still use all saved analyses.
        </p>
        <p className="shrink-0">
          Showing {visibleCount} of {totalCount}
        </p>
      </div>
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Clear search and filter
        </button>
      ) : null}
    </div>
  );
}

function AnalysisRow({
  analysis,
  isSelected,
  onSelect,
}: {
  analysis: SavedCloudAnalysisListItem;
  isSelected: boolean;
  onSelect: (analysisId: string) => void;
}) {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const companyLabel = getSavedAnalysisCompanyLabel(analysis);
  const notesPreview = formatNotesPreview(analysis.notes);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(analysis.id)}
        aria-pressed={isSelected}
        className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
          isSelected
            ? "border-sky-400 bg-sky-50 ring-1 ring-sky-300"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium text-zinc-900">{title}</p>
          <p className="shrink-0 text-xs text-zinc-500">
            {formatSavedAnalysisDate(analysis.created_at)}
          </p>
        </div>
        <p
          className={`mt-1 text-sm ${
            analysis.company?.trim() ? "text-zinc-600" : "text-zinc-500 italic"
          }`}
        >
          {companyLabel}
        </p>
        {notesPreview ? (
          <p className="mt-1 truncate text-xs text-zinc-500" title={notesPreview}>
            {notesPreview}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-600">
          Matched: {analysis.matched_skills_count} · Missing:{" "}
          {analysis.missing_skills_count}
        </p>
      </button>
    </li>
  );
}

type SavedAnalysesPanelProps = {
  /** Increment to reload the list (e.g. after test cloud save). */
  refreshKey?: number;
};

function SavedAnalysesList({ refreshKey = 0 }: SavedAnalysesPanelProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<SavedAnalysisListFilter>("all");
  const completedFetchKeyRef = useRef<string | null>(null);

  const filteredAnalyses = useMemo(() => {
    const analyses = loadResult?.status === "success" ? loadResult.analyses : [];
    return filterSavedAnalyses(analyses, searchQuery, listFilter);
  }, [loadResult, searchQuery, listFilter]);

  const searchIsActive = hasActiveSavedAnalysisSearch(searchQuery, listFilter);

  const visibleSelectedAnalysisId =
    selectedAnalysisId &&
    filteredAnalyses.some((analysis) => analysis.id === selectedAnalysisId)
      ? selectedAnalysisId
      : null;

  function handleClearSearch() {
    setSearchQuery("");
    setListFilter("all");
    setSelectedAnalysisId(null);
  }

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

      if (result.status === "success") {
        setSelectedAnalysisId((currentId) => {
          if (!currentId) {
            return null;
          }
          const stillExists = result.analyses.some(
            (analysis) => analysis.id === currentId,
          );
          return stillExists ? currentId : null;
        });
      }

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
        Select a row to view full metadata and skill lists ({loadResult.analyses.length}{" "}
        most recent, newest first).
      </p>

      <SavedAnalysesSearchControls
        searchQuery={searchQuery}
        filter={listFilter}
        onSearchQueryChange={setSearchQuery}
        onFilterChange={setListFilter}
        onClear={handleClearSearch}
        showClear={searchIsActive}
        totalCount={loadResult.analyses.length}
        visibleCount={filteredAnalyses.length}
      />

      {filteredAnalyses.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5 text-zinc-700">
          <p className="font-medium text-zinc-900">No saved analyses match this search.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Try a different keyword or filter, or clear the search to see everything.
          </p>
          {searchIsActive ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-3 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Clear search and filter
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredAnalyses.map((analysis) => (
            <AnalysisRow
              key={analysis.id}
              analysis={analysis}
              isSelected={visibleSelectedAnalysisId === analysis.id}
              onSelect={setSelectedAnalysisId}
            />
          ))}
        </ul>
      )}

      <SavedAnalysisDetailPanel
        analysisId={visibleSelectedAnalysisId}
        refreshKey={refreshKey}
      />
    </div>
  );
}

/** Saved list plus recurring gap stats; shares refreshKey after cloud saves. */
export function SavedAnalysesPanel({ refreshKey = 0 }: SavedAnalysesPanelProps) {
  return (
    <>
      <RecurringGapStatsPanel refreshKey={refreshKey} />
      <SavedAnalysesList refreshKey={refreshKey} />
    </>
  );
}
