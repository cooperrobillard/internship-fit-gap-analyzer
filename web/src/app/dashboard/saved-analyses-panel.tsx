"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { RecurringGapStatsPanel } from "@/app/dashboard/recurring-gap-stats-panel";
import { RecurringGapExportActions } from "@/app/dashboard/recurring-gap-export-actions";
import { SavedAnalysisComparisonPanel } from "@/app/dashboard/saved-analysis-comparison";
import { SavedAnalysisDetailPanel } from "@/app/dashboard/saved-analysis-detail";
import {
  ExportDownloadButton,
  ExportDownloadGroup,
} from "@/app/dashboard/export-download-button";
import { downloadAllSavedAnalysesCsv } from "@/lib/saved-analysis-exports";
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
    <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white/70 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-[12rem] flex-1 text-sm">
          <span className="break-words font-medium text-zinc-900">
            Search saved analyses
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Job title, company, skills, notes…"
            className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            autoComplete="off"
          />
        </label>
        <label className="text-sm">
          <span className="break-words font-medium text-zinc-900">Filter</span>
          <select
            value={filter}
            onChange={(event) =>
              onFilterChange(event.target.value as SavedAnalysisListFilter)
            }
            className="mt-1 block min-h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 sm:min-w-[11rem]"
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
          Searching job title, company, source URL, notes, and skill names.
          Recurring gap stats still use all saved analyses.
        </p>
        <p className="shrink-0">
          Showing {visibleCount} of {totalCount}
        </p>
      </div>
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
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
        className={`min-h-11 w-full rounded-lg border px-4 py-3 text-left transition-colors ${
          isSelected
            ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="break-words font-medium text-zinc-900">{title}</p>
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
          <p
            className="mt-1 whitespace-pre-wrap break-words text-xs text-zinc-500"
            title={notesPreview}
          >
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
  /** Increment to reload the list after successful real analysis saves. */
  refreshKey?: number;
};

type SavedAnalysesListProps = SavedAnalysesPanelProps & {
  onAnalysisDeleted?: () => void;
};

function SavedAnalysesList({
  refreshKey = 0,
  onAnalysisDeleted,
}: SavedAnalysesListProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<SavedAnalysisListFilter>("all");
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<
    string | null
  >(null);
  const [compareFirstId, setCompareFirstId] = useState<string | null>(null);
  const [compareSecondId, setCompareSecondId] = useState<string | null>(null);
  const completedFetchKeyRef = useRef<string | null>(null);

  const allAnalyses =
    loadResult?.status === "success" ? loadResult.analyses : [];

  const visibleCompareFirstId =
    compareFirstId &&
    allAnalyses.some((analysis) => analysis.id === compareFirstId)
      ? compareFirstId
      : null;
  const visibleCompareSecondId =
    compareSecondId &&
    allAnalyses.some((analysis) => analysis.id === compareSecondId)
      ? compareSecondId
      : null;

  const filteredAnalyses = useMemo(() => {
    const analyses =
      loadResult?.status === "success" ? loadResult.analyses : [];
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
    setDeleteSuccessMessage(null);
  }

  function handleAnalysisDeleted(deletedLabel: string) {
    setSelectedAnalysisId(null);
    setDeleteSuccessMessage(
      `"${deletedLabel}" was deleted from your saved analyses.`,
    );
    completedFetchKeyRef.current = null;
    onAnalysisDeleted?.();
  }

  function handleCompareFirstChange(analysisId: string | null) {
    setCompareFirstId(analysisId);
    if (analysisId && analysisId === compareSecondId) {
      setCompareSecondId(null);
    }
  }

  function handleCompareSecondChange(analysisId: string | null) {
    setCompareSecondId(analysisId);
    if (analysisId && analysisId === compareFirstId) {
      setCompareFirstId(null);
    }
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
        setCompareFirstId((currentId) => {
          if (!currentId) {
            return null;
          }
          return result.analyses.some((analysis) => analysis.id === currentId)
            ? currentId
            : null;
        });
        setCompareSecondId((currentId) => {
          if (!currentId) {
            return null;
          }
          return result.analyses.some((analysis) => analysis.id === currentId)
            ? currentId
            : null;
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
        <p className="break-words font-medium text-zinc-900">
          Your saved analyses
        </p>
        <p className="mt-2">
          Supabase is not configured, so saved analyses cannot load. Add env
          vars to <code className="text-xs">web/.env.local</code> (see{" "}
          <code className="text-xs">web/.env.example</code>).
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
      >
        <p className="font-medium">Loading your saved analyses…</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="break-words font-medium text-zinc-900">
          Your saved analyses
        </p>
        <p className="mt-2">Sign in to see analyses you have saved.</p>
      </div>
    );
  }

  if (isLoading || loadResult === null) {
    return (
      <div
        className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
      >
        <p className="font-medium">Loading your saved analyses…</p>
        <p className="mt-2 text-sm text-sky-800/90">
          Showing job title, company, skill counts, and dates—not full resume or
          job text.
        </p>
      </div>
    );
  }

  if (loadResult.status === "not_configured") {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium">Supabase is not configured</p>
        <p className="mt-2">
          Saved analyses cannot load without Supabase env vars.
        </p>
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
        <p className="break-words font-medium text-zinc-900">
          Your saved analyses
        </p>
        <p className="mt-2">
          Nothing saved yet. Run an analysis in the Analyze section and click{" "}
          <strong>Save analysis</strong> after results appear to add structured
          results to this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
      <p className="break-words font-medium text-zinc-900">
        Your saved analyses
      </p>
      <p className="mt-2 text-zinc-600">
        Select a row to view full metadata and skill lists (
        {loadResult.analyses.length} most recent, newest first).
      </p>

      <SavedAnalysesSearchControls
        searchQuery={searchQuery}
        filter={listFilter}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setDeleteSuccessMessage(null);
        }}
        onFilterChange={(value) => {
          setListFilter(value);
          setDeleteSuccessMessage(null);
        }}
        onClear={handleClearSearch}
        showClear={searchIsActive}
        totalCount={loadResult.analyses.length}
        visibleCount={filteredAnalyses.length}
      />

      <ExportDownloadGroup description="One CSV row per saved analysis with metadata and joined skill lists.">
        <ExportDownloadButton
          label="All saved analyses (CSV)"
          onClick={() => downloadAllSavedAnalysesCsv(allAnalyses)}
        />
      </ExportDownloadGroup>

      {deleteSuccessMessage ? (
        <div
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium">Analysis deleted</p>
          <p className="mt-1">{deleteSuccessMessage}</p>
        </div>
      ) : null}

      {filteredAnalyses.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5 text-zinc-700">
          <p className="break-words font-medium text-zinc-900">
            No saved analyses match this search.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Try a different keyword or filter, or clear the search to see
            everything.
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

      <SavedAnalysisComparisonPanel
        analyses={allAnalyses}
        firstAnalysisId={visibleCompareFirstId}
        secondAnalysisId={visibleCompareSecondId}
        onFirstAnalysisIdChange={handleCompareFirstChange}
        onSecondAnalysisIdChange={handleCompareSecondChange}
      />

      <SavedAnalysisDetailPanel
        analysisId={visibleSelectedAnalysisId}
        refreshKey={refreshKey}
        onDeleted={handleAnalysisDeleted}
      />
    </div>
  );
}

/** Saved list plus recurring gap stats; shares refreshKey after real analysis saves. */
export function SavedAnalysesPanel({
  refreshKey = 0,
}: SavedAnalysesPanelProps) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const effectiveRefreshKey = refreshKey + reloadNonce;

  function handleAnalysisDeleted() {
    setReloadNonce((nonce) => nonce + 1);
  }

  return (
    <section
      id="saved-analyses"
      className="scroll-mt-24"
      aria-labelledby="saved-analyses-heading"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Saved analyses
        </p>
        <h2
          id="saved-analyses-heading"
          className="mt-1 text-xl font-semibold text-zinc-950"
        >
          Saved analyses and insights
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          Revisit structured analysis results, review recurring gaps, compare
          two saved roles, export results, and delete entries you no longer
          need.
        </p>

        <RecurringGapStatsPanel refreshKey={effectiveRefreshKey} />
        <div className="mt-3">
          <RecurringGapExportActions />
        </div>
        <SavedAnalysesList
          refreshKey={effectiveRefreshKey}
          onAnalysisDeleted={handleAnalysisDeleted}
        />
      </div>
    </section>
  );
}
