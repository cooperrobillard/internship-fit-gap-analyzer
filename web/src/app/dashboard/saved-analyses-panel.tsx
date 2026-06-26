"use client";

import { useSession } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { RecurringGapStatsPanel } from "@/app/dashboard/recurring-gap-stats-panel";
import { RecurringGapExportActions } from "@/app/dashboard/recurring-gap-export-actions";
import { SavedAnalysisComparisonPanel } from "@/app/dashboard/saved-analysis-comparison";
import { SavedAnalysisDetailPanel } from "@/app/dashboard/saved-analysis-detail";
import {
  ExportDownloadButton,
  ExportDownloadGroup,
} from "@/app/dashboard/export-download-button";
import {
  downloadAllSavedAnalysesCsv,
  downloadSelectedSavedAnalysesCsv,
} from "@/lib/saved-analysis-exports";
import {
  filterSavedAnalyses,
  hasActiveSavedAnalysisSearch,
  SAVED_ANALYSIS_FILTER_OPTIONS,
  type SavedAnalysisListFilter,
} from "@/lib/saved-analysis-search";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteSavedAnalyses,
  fetchRecentSavedAnalyses,
  formatSavedAnalysisDate,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  type SavedAnalysesResult,
  type SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";

const boxClass =
  "rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-700 sm:p-5";
type WorkspaceView = "analyses" | "insights" | "compare";
const views: { value: WorkspaceView; label: string }[] = [
  { value: "analyses", label: "Analyses" },
  { value: "insights", label: "Insights" },
  { value: "compare", label: "Compare" },
];

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
    <div className="flex flex-wrap items-end gap-2 border-b border-zinc-200 pb-3">
      <label className="min-w-[14rem] flex-1 text-sm">
        <span className="sr-only">Search saved analyses</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search saved analyses…"
          className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          autoComplete="off"
        />
      </label>
      <label className="text-sm">
        <span className="sr-only">Filter saved analyses</span>
        <select
          value={filter}
          onChange={(event) =>
            onFilterChange(event.target.value as SavedAnalysisListFilter)
          }
          className="min-h-10 w-full min-w-[10rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          {SAVED_ANALYSIS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Clear
        </button>
      ) : null}
      <p
        className="ml-auto min-h-10 self-end whitespace-nowrap py-2 text-xs text-zinc-600"
        aria-live="polite"
      >
        {visibleCount} of {totalCount}
      </p>
    </div>
  );
}

function AnalysisRow({
  analysis,
  isSelected,
  isChecked,
  isCheckboxDisabled,
  onSelect,
  onCheckedChange,
}: {
  analysis: SavedCloudAnalysisListItem;
  isSelected: boolean;
  isChecked: boolean;
  isCheckboxDisabled: boolean;
  onSelect: (analysisId: string) => void;
  onCheckedChange: (analysisId: string, checked: boolean) => void;
}) {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const companyLabel = getSavedAnalysisCompanyLabel(analysis);
  const savedDate = formatSavedAnalysisDate(analysis.created_at);
  const checkboxLabel = `Select saved analysis ${title}, ${companyLabel}, saved ${savedDate}`;
  const openLabel = `Open saved analysis ${title}, ${companyLabel}, saved ${savedDate}`;

  return (
    <li
      className={`border-b border-zinc-200 last:border-b-0 ${isSelected ? "bg-sky-50" : "bg-white"}`}
    >
      <div className="flex items-stretch">
        <div className="flex min-h-11 items-start px-3 py-3">
          <label className="flex min-h-10 min-w-10 cursor-pointer items-start justify-center rounded-md pt-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700">
            <span className="sr-only">{checkboxLabel}</span>
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isCheckboxDisabled}
              onChange={(event) =>
                onCheckedChange(analysis.id, event.target.checked)
              }
              className="mt-1 h-5 w-5 rounded border-zinc-300 text-sky-700 accent-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => onSelect(analysis.id)}
          aria-label={openLabel}
          aria-pressed={isSelected}
          className={`relative min-h-11 min-w-0 flex-1 px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${isSelected ? "bg-sky-50" : "bg-white hover:bg-zinc-50"}`}
        >
          {isSelected ? (
            <span
              className="absolute inset-y-2 left-0 w-1 rounded-full bg-sky-700"
              aria-hidden="true"
            />
          ) : null}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pl-2">
            <p className="break-words font-medium text-zinc-950">{title}</p>
            <p className="shrink-0 text-xs text-zinc-500">{savedDate}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 pl-2 text-xs text-zinc-600">
            <span
              className={
                analysis.company?.trim()
                  ? "break-words"
                  : "break-words italic text-zinc-500"
              }
            >
              {companyLabel}
            </span>
            <span>Matched {analysis.matched_skills_count}</span>
            <span>Missing {analysis.missing_skills_count}</span>
          </div>
        </button>
      </div>
    </li>
  );
}

type SelectedDeleteTarget = { id: string; label: string };
type SavedAnalysisActionNotice = {
  tone: "success" | "warning" | "error";
  message: string;
};
type SavedAnalysesPanelProps = { refreshKey?: number };

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
function formatSelectedDeleteLabel(analysis: SavedCloudAnalysisListItem) {
  return `${getSavedAnalysisDisplayTitle(analysis)} — ${getSavedAnalysisCompanyLabel(analysis)}`;
}
function buildDeleteNotice(
  targetCount: number,
  deletedCount: number,
  unavailableCount: number,
  failureCount: number,
): SavedAnalysisActionNotice {
  const removedCount = deletedCount + unavailableCount;
  if (failureCount === 0 && deletedCount > 0 && unavailableCount === 0)
    return {
      tone: "success",
      message: `${deletedCount} selected ${pluralize(deletedCount, "analysis", "analyses")} ${deletedCount === 1 ? "was" : "were"} deleted.`,
    };
  if (failureCount === 0 && deletedCount > 0 && unavailableCount > 0)
    return {
      tone: "warning",
      message: `${deletedCount} ${pluralize(deletedCount, "analysis", "analyses")} ${deletedCount === 1 ? "was" : "were"} deleted. ${unavailableCount} ${unavailableCount === 1 ? "was" : "were"} already unavailable.`,
    };
  if (failureCount === 0 && deletedCount === 0)
    return {
      tone: "warning",
      message: `${unavailableCount} selected ${pluralize(unavailableCount, "analysis", "analyses")} ${unavailableCount === 1 ? "was" : "were"} already unavailable and ${unavailableCount === 1 ? "was" : "were"} removed from selection.`,
    };
  if (removedCount > 0)
    return {
      tone: "warning",
      message: `${removedCount} of ${targetCount} selected ${pluralize(targetCount, "analysis", "analyses")} ${removedCount === 1 ? "was" : "were"} deleted or already unavailable. ${failureCount} could not be deleted and ${failureCount === 1 ? "remains" : "remain"} selected. Try again.`,
    };
  return {
    tone: "error",
    message: `Could not delete the ${targetCount} selected ${pluralize(targetCount, "analysis", "analyses")}. ${targetCount === 1 ? "It remains" : "They remain"} selected. Try again.`,
  };
}

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
  const [activeView, setActiveView] = useState<WorkspaceView>("analyses");
  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null,
  );
  const [checkedAnalysisIds, setCheckedAnalysisIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [checkedAnalysisSessionId, setCheckedAnalysisSessionId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<SavedAnalysisListFilter>("all");
  const [actionNotice, setActionNotice] =
    useState<SavedAnalysisActionNotice | null>(null);
  const [selectedDeleteTargets, setSelectedDeleteTargets] = useState<
    SelectedDeleteTarget[] | null
  >(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [compareFirstId, setCompareFirstId] = useState<string | null>(null);
  const [compareSecondId, setCompareSecondId] = useState<string | null>(null);
  const completedFetchKeyRef = useRef<string | null>(null);
  const deleteSelectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteConfirmationHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const selectAllVisibleRef = useRef<HTMLInputElement | null>(null);
  const boundSelectionSessionIdRef = useRef<string | null | undefined>(
    undefined,
  );
  const allAnalyses = useMemo(
    () => (loadResult?.status === "success" ? loadResult.analyses : []),
    [loadResult],
  );
  const effectiveCheckedAnalysisIds = useMemo(
    () =>
      checkedAnalysisSessionId === sessionId
        ? checkedAnalysisIds
        : new Set<string>(),
    [checkedAnalysisIds, checkedAnalysisSessionId, sessionId],
  );
  const selectedAnalyses = useMemo(
    () =>
      allAnalyses.filter((analysis) =>
        effectiveCheckedAnalysisIds.has(analysis.id),
      ),
    [allAnalyses, effectiveCheckedAnalysisIds],
  );
  const isDeleteConfirmationOpen = selectedDeleteTargets !== null;
  const isSelectionLocked = isDeleteConfirmationOpen || isDeletingSelected;
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
  const filteredAnalyses = useMemo(
    () => filterSavedAnalyses(allAnalyses, searchQuery, listFilter),
    [allAnalyses, searchQuery, listFilter],
  );
  const visibleAnalysisIds = useMemo(
    () => filteredAnalyses.map((analysis) => analysis.id),
    [filteredAnalyses],
  );
  const visibleCheckedCount = visibleAnalysisIds.filter((id) =>
    effectiveCheckedAnalysisIds.has(id),
  ).length;
  const hiddenCheckedCount =
    effectiveCheckedAnalysisIds.size - visibleCheckedCount;
  const hasVisibleAnalyses = visibleAnalysisIds.length > 0;
  const allVisibleChecked =
    hasVisibleAnalyses && visibleCheckedCount === visibleAnalysisIds.length;
  const someVisibleChecked = visibleCheckedCount > 0 && !allVisibleChecked;
  const selectionStatus =
    effectiveCheckedAnalysisIds.size === 0
      ? "No analyses selected."
      : `${effectiveCheckedAnalysisIds.size} ${effectiveCheckedAnalysisIds.size === 1 ? "analysis" : "analyses"} selected${hiddenCheckedCount > 0 ? `; ${hiddenCheckedCount} ${hiddenCheckedCount === 1 ? "is" : "are"} hidden by the current search or filter` : ""}.`;
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
    setActionNotice(null);
  }
  function handleAnalysisDeleted(deletedLabel: string) {
    const deletedAnalysisId = selectedAnalysisId;
    setSelectedAnalysisId(null);
    if (deletedAnalysisId) {
      setCheckedAnalysisIds((currentIds) => {
        if (!currentIds.has(deletedAnalysisId)) return currentIds;
        const nextIds = new Set(currentIds);
        nextIds.delete(deletedAnalysisId);
        return nextIds;
      });
    }
    setActionNotice({
      tone: "success",
      message: `"${deletedLabel}" was deleted.`,
    });
    completedFetchKeyRef.current = null;
    onAnalysisDeleted?.();
  }
  function handleAnalysisCheckedChange(analysisId: string, checked: boolean) {
    setCheckedAnalysisSessionId(sessionId);
    setCheckedAnalysisIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (checked) nextIds.add(analysisId);
      else nextIds.delete(analysisId);
      return nextIds;
    });
  }
  function handleSelectAllVisibleChange() {
    setCheckedAnalysisSessionId(sessionId);
    setCheckedAnalysisIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (allVisibleChecked) {
        visibleAnalysisIds.forEach((id) => nextIds.delete(id));
      } else {
        visibleAnalysisIds.forEach((id) => nextIds.add(id));
      }
      return nextIds;
    });
  }
  function handleOpenSelectedDeleteConfirmation() {
    if (selectedAnalyses.length === 0 || isSelectionLocked) return;
    setActionNotice(null);
    setSelectedDeleteTargets(
      selectedAnalyses.map((analysis) => ({
        id: analysis.id,
        label: formatSelectedDeleteLabel(analysis),
      })),
    );
  }
  function handleCancelSelectedDelete() {
    if (isDeletingSelected) return;
    setSelectedDeleteTargets(null);
    window.setTimeout(() => deleteSelectedButtonRef.current?.focus(), 0);
  }
  async function handleConfirmSelectedDelete() {
    if (!session || !selectedDeleteTargets || isDeletingSelected) return;
    const targetIds = selectedDeleteTargets.map((target) => target.id);
    if (targetIds.length === 0) {
      setSelectedDeleteTargets(null);
      return;
    }
    setIsDeletingSelected(true);
    const result = await deleteSavedAnalyses(
      () => session.getToken(),
      targetIds,
    );
    const removedIds = new Set([
      ...result.deletedIds,
      ...result.unavailableIds,
    ]);
    const failedIds = new Set(
      result.failures.map((failure) => failure.analysisId),
    );
    setCheckedAnalysisIds((currentIds) => {
      const nextIds = new Set(currentIds);
      removedIds.forEach((id) => nextIds.delete(id));
      failedIds.forEach((id) => nextIds.add(id));
      return nextIds;
    });
    setSelectedAnalysisId((currentId) =>
      currentId && removedIds.has(currentId) ? null : currentId,
    );
    setCompareFirstId((currentId) =>
      currentId && removedIds.has(currentId) ? null : currentId,
    );
    setCompareSecondId((currentId) =>
      currentId && removedIds.has(currentId) ? null : currentId,
    );
    setActionNotice(
      buildDeleteNotice(
        targetIds.length,
        result.deletedIds.length,
        result.unavailableIds.length,
        result.failures.length,
      ),
    );
    setSelectedDeleteTargets(null);
    setIsDeletingSelected(false);
    if (removedIds.size > 0) {
      completedFetchKeyRef.current = null;
      onAnalysisDeleted?.();
    }
  }
  function handleCompareFirstChange(analysisId: string | null) {
    setCompareFirstId(analysisId);
    if (analysisId && analysisId === compareSecondId) setCompareSecondId(null);
  }
  function handleCompareSecondChange(analysisId: string | null) {
    setCompareSecondId(analysisId);
    if (analysisId && analysisId === compareFirstId) setCompareFirstId(null);
  }

  useEffect(() => {
    if (selectAllVisibleRef.current)
      selectAllVisibleRef.current.indeterminate = someVisibleChecked;
  }, [someVisibleChecked]);
  useEffect(() => {
    if (selectedDeleteTargets) deleteConfirmationHeadingRef.current?.focus();
  }, [selectedDeleteTargets]);

  useEffect(() => {
    if (boundSelectionSessionIdRef.current === sessionId) return;
    boundSelectionSessionIdRef.current = sessionId;
    setCheckedAnalysisIds(new Set());
    setCheckedAnalysisSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!configured || !isLoaded || !sessionId || !session) return;
    const activeSession = session;
    const fetchKey = `${sessionId}:${refreshKey}:${retryNonce}`;
    if (completedFetchKeyRef.current === fetchKey) return;
    let cancelled = false;
    async function runLoad() {
      setIsLoading(true);
      setLoadResult(null);
      const result = await fetchRecentSavedAnalyses(() =>
        activeSession.getToken(),
      );
      if (cancelled) return;
      completedFetchKeyRef.current = fetchKey;
      setLoadResult(result);
      if (result.status === "success") {
        setSelectedAnalysisId((currentId) =>
          currentId &&
          result.analyses.some((analysis) => analysis.id === currentId)
            ? currentId
            : null,
        );
        setCompareFirstId((currentId) =>
          currentId &&
          result.analyses.some((analysis) => analysis.id === currentId)
            ? currentId
            : null,
        );
        setCompareSecondId((currentId) =>
          currentId &&
          result.analyses.some((analysis) => analysis.id === currentId)
            ? currentId
            : null,
        );
        setCheckedAnalysisIds((currentIds) => {
          const loadedIds = new Set(
            result.analyses.map((analysis) => analysis.id),
          );
          const nextIds = new Set(
            [...currentIds].filter((id) => loadedIds.has(id)),
          );
          if (nextIds.size === currentIds.size) return currentIds;
          return nextIds;
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

  const loadingMarkup = (
    <div
      className={`${boxClass} bg-sky-50 text-sky-900`}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <p className="font-medium">Loading saved analyses…</p>
    </div>
  );

  if (!configured)
    return (
      <div className={`${boxClass} bg-zinc-50`}>
        <p className="font-medium text-zinc-900">Saved analyses unavailable</p>
        <p className="mt-2">
          Supabase is not configured, so saved analyses cannot load locally.
        </p>
      </div>
    );
  if (!isLoaded || isLoading) return loadingMarkup;
  if (!sessionId)
    return (
      <div className={`${boxClass} bg-zinc-50`}>
        <p className="font-medium text-zinc-900">Sign in required</p>
        <p className="mt-2">Sign in to see analyses you have saved.</p>
      </div>
    );
  if (loadResult === null) return loadingMarkup;
  if (loadResult.status === "not_configured")
    return (
      <div className={`${boxClass} bg-zinc-50`}>
        <p className="font-medium text-zinc-900">Saved analyses unavailable</p>
        <p className="mt-2">Supabase is not configured.</p>
      </div>
    );
  if (loadResult.status === "error")
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <div role="alert">
          <p className="font-medium">Could not load saved analyses</p>
          <p className="mt-1">{loadResult.message}</p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );

  const emptyAnalysesMarkup = (
    <div className="mt-4 text-zinc-700">
      <p className="text-lg font-semibold text-zinc-950">
        No saved analyses yet
      </p>
      <p className="mt-2">
        Run an analysis and save the result to begin building your history.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex min-h-10 items-center rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >
        Analyze a role
      </Link>
    </div>
  );

  const listMarkup = (
    <div className="min-w-0">
      <SavedAnalysesSearchControls
        searchQuery={searchQuery}
        filter={listFilter}
        onSearchQueryChange={(value) => {
          setSearchQuery(value);
          setActionNotice(null);
        }}
        onFilterChange={(value) => {
          setListFilter(value);
          setActionNotice(null);
        }}
        onClear={handleClearSearch}
        showClear={searchIsActive}
        totalCount={loadResult.analyses.length}
        visibleCount={filteredAnalyses.length}
      />
      <div
        className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
        aria-labelledby="saved-analysis-selection-heading"
      >
        <p
          id="saved-analysis-selection-heading"
          className="text-sm font-medium text-zinc-900"
        >
          Selection
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-1 text-sm font-medium text-zinc-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700">
            <input
              ref={selectAllVisibleRef}
              type="checkbox"
              checked={allVisibleChecked}
              disabled={!hasVisibleAnalyses || isSelectionLocked}
              onChange={handleSelectAllVisibleChange}
              className="h-5 w-5 rounded border-zinc-300 text-sky-700 accent-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span>Select all visible</span>
          </label>
          <ExportDownloadButton
            label="Export selected (CSV)"
            onClick={() => downloadSelectedSavedAnalysesCsv(selectedAnalyses)}
            disabled={selectedAnalyses.length === 0 || isDeletingSelected}
          />
          <button
            ref={deleteSelectedButtonRef}
            type="button"
            onClick={handleOpenSelectedDeleteConfirmation}
            disabled={selectedAnalyses.length === 0 || isSelectionLocked}
            aria-expanded={isDeleteConfirmationOpen}
            aria-controls="selected-delete-confirmation"
            className="min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete selected
          </button>
          {effectiveCheckedAnalysisIds.size > 0 ? (
            <button
              type="button"
              disabled={isSelectionLocked}
              onClick={() => {
                setCheckedAnalysisSessionId(sessionId);
                setCheckedAnalysisIds(new Set());
              }}
              className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              Clear selection
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Exports or deletes checked loaded analyses, including selections
          hidden by the current search or filter. No account-wide action is
          performed.
        </p>
        <p
          className="mt-2 text-xs text-zinc-600"
          role="status"
          aria-live="polite"
        >
          {selectionStatus}
        </p>
      </div>
      {selectedDeleteTargets ? (
        <section
          id="selected-delete-confirmation"
          className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
          aria-labelledby="selected-delete-confirmation-heading"
          aria-describedby="selected-delete-irreversible-explanation selected-delete-sequential-notice"
          aria-busy={isDeletingSelected}
        >
          <h3
            id="selected-delete-confirmation-heading"
            ref={deleteConfirmationHeadingRef}
            tabIndex={-1}
            className="font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            Delete {selectedDeleteTargets.length} selected{" "}
            {pluralize(selectedDeleteTargets.length, "analysis", "analyses")}?
          </h3>
          <p id="selected-delete-irreversible-explanation" className="mt-2">
            Only the {selectedDeleteTargets.length} checked loaded{" "}
            {pluralize(selectedDeleteTargets.length, "analysis", "analyses")}{" "}
            listed in this confirmation will be attempted, including checked
            records hidden by the current search or filter. This permanently
            removes the saved analysis records; related structured matched and
            missing skill rows are removed through the existing database cascade
            behavior. There is no undo.
          </p>
          <p id="selected-delete-sequential-notice" className="mt-2">
            Deletion runs sequentially and is not transactional. Successful
            deletions are not rolled back if a later deletion fails. Failed
            analyses remain selected.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {selectedDeleteTargets.slice(0, 5).map((target) => (
              <li key={target.id} className="break-words">
                {target.label}
              </li>
            ))}
          </ul>
          {selectedDeleteTargets.length > 5 ? (
            <p className="mt-2">
              And {selectedDeleteTargets.length - 5} more selected{" "}
              {pluralize(
                selectedDeleteTargets.length - 5,
                "analysis",
                "analyses",
              )}
              .
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCancelSelectedDelete}
              disabled={isDeletingSelected}
              className="min-h-10 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmSelectedDelete()}
              disabled={isDeletingSelected}
              className="min-h-10 rounded-md bg-red-800 px-3 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingSelected
                ? `Deleting ${selectedDeleteTargets.length} ${pluralize(selectedDeleteTargets.length, "analysis", "analyses")}…`
                : `Delete ${selectedDeleteTargets.length} ${pluralize(selectedDeleteTargets.length, "analysis", "analyses")}`}
            </button>
          </div>
        </section>
      ) : null}
      {actionNotice ? (
        <p
          className={`mt-3 text-sm font-medium ${actionNotice.tone === "success" ? "text-emerald-800" : actionNotice.tone === "warning" ? "text-amber-800" : "text-red-800"}`}
          role={actionNotice.tone === "error" ? "alert" : "status"}
          aria-live={actionNotice.tone === "error" ? undefined : "polite"}
        >
          {actionNotice.message}
        </p>
      ) : null}
      {filteredAnalyses.length === 0 ? (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-5">
          <p className="font-medium text-zinc-900">
            No saved analyses match this search.
          </p>
          {searchIsActive ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-3 min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-md border border-zinc-200 bg-white">
          {filteredAnalyses.map((analysis) => (
            <AnalysisRow
              key={analysis.id}
              analysis={analysis}
              isSelected={visibleSelectedAnalysisId === analysis.id}
              isChecked={effectiveCheckedAnalysisIds.has(analysis.id)}
              isCheckboxDisabled={isSelectionLocked}
              onSelect={setSelectedAnalysisId}
              onCheckedChange={handleAnalysisCheckedChange}
            />
          ))}
        </ul>
      )}
      <div className="mt-4">
        <ExportDownloadGroup
          title="Export loaded analyses"
          description="Exports every currently loaded analysis, regardless of selection, search, or filter."
        >
          <ExportDownloadButton
            label="Loaded analyses (CSV)"
            onClick={() => downloadAllSavedAnalysesCsv(allAnalyses)}
          />
        </ExportDownloadGroup>
      </div>
    </div>
  );

  return (
    <section className={boxClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex flex-wrap gap-2" aria-label="Saved workspace view">
          {views.map((view) => (
            <button
              key={view.value}
              type="button"
              aria-pressed={activeView === view.value}
              onClick={() => setActiveView(view.value)}
              className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${activeView === view.value ? "border-sky-700 bg-sky-50 text-sky-950 shadow-[inset_0_-2px_0_#0369a1]" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
            >
              {view.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {loadResult.analyses.length} most recent
        </p>
      </div>
      {activeView === "analyses" ? (
        loadResult.analyses.length === 0 ? (
          emptyAnalysesMarkup
        ) : (
          <div className="mt-4 xl:grid xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.35fr)] xl:gap-6">
            <div
              className={
                visibleSelectedAnalysisId ? "hidden xl:block" : "block"
              }
            >
              {listMarkup}
            </div>
            <div
              className={
                visibleSelectedAnalysisId
                  ? "block min-w-0 xl:block"
                  : "hidden min-w-0 xl:block"
              }
            >
              <SavedAnalysisDetailPanel
                analysisId={visibleSelectedAnalysisId}
                refreshKey={refreshKey}
                onDeleted={handleAnalysisDeleted}
                showBackLink={Boolean(visibleSelectedAnalysisId)}
                onBackToList={() => setSelectedAnalysisId(null)}
              />
            </div>
          </div>
        )
      ) : null}
      {activeView === "insights" ? (
        <div className="mt-4 space-y-4">
          <RecurringGapStatsPanel refreshKey={refreshKey} />
          <RecurringGapExportActions />
        </div>
      ) : null}
      {activeView === "compare" ? (
        <SavedAnalysisComparisonPanel
          analyses={allAnalyses}
          firstAnalysisId={visibleCompareFirstId}
          secondAnalysisId={visibleCompareSecondId}
          onFirstAnalysisIdChange={handleCompareFirstChange}
          onSecondAnalysisIdChange={handleCompareSecondChange}
        />
      ) : null}
    </section>
  );
}

export function SavedAnalysesPanel({
  refreshKey = 0,
}: SavedAnalysesPanelProps) {
  const [recurringRefreshKey, setRecurringRefreshKey] = useState(0);
  return (
    <SavedAnalysesList
      refreshKey={refreshKey + recurringRefreshKey}
      onAnalysisDeleted={() => setRecurringRefreshKey((key) => key + 1)}
    />
  );
}
