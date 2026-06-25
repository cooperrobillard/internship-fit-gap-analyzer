"use client";

import { useSession } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { RecurringGapStatsPanel } from "@/app/dashboard/recurring-gap-stats-panel";
import { RecurringGapExportActions } from "@/app/dashboard/recurring-gap-export-actions";
import { SavedAnalysisComparisonPanel } from "@/app/dashboard/saved-analysis-comparison";
import { SavedAnalysisDetailPanel } from "@/app/dashboard/saved-analysis-detail";
import { ExportDownloadButton, ExportDownloadGroup } from "@/app/dashboard/export-download-button";
import { downloadAllSavedAnalysesCsv } from "@/lib/saved-analysis-exports";
import { filterSavedAnalyses, hasActiveSavedAnalysisSearch, SAVED_ANALYSIS_FILTER_OPTIONS, type SavedAnalysisListFilter } from "@/lib/saved-analysis-search";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchRecentSavedAnalyses, formatSavedAnalysisDate, getSavedAnalysisCompanyLabel, getSavedAnalysisDisplayTitle, type SavedAnalysesResult, type SavedCloudAnalysisListItem } from "@/lib/supabase/saved-analyses";

const boxClass = "rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-700 sm:p-5";
type WorkspaceView = "analyses" | "insights" | "compare";
const views: { value: WorkspaceView; label: string }[] = [{ value: "analyses", label: "Analyses" }, { value: "insights", label: "Insights" }, { value: "compare", label: "Compare" }];

function SavedAnalysesSearchControls({ searchQuery, filter, onSearchQueryChange, onFilterChange, onClear, showClear, totalCount, visibleCount }: { searchQuery: string; filter: SavedAnalysisListFilter; onSearchQueryChange: (value: string) => void; onFilterChange: (value: SavedAnalysisListFilter) => void; onClear: () => void; showClear: boolean; totalCount: number; visibleCount: number }) {
  return <div className="flex flex-wrap items-end gap-2 border-b border-zinc-200 pb-3">
    <label className="min-w-[14rem] flex-1 text-sm"><span className="sr-only">Search saved analyses</span><input type="search" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search saved analyses…" className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700" autoComplete="off" /></label>
    <label className="text-sm"><span className="sr-only">Filter saved analyses</span><select value={filter} onChange={(event) => onFilterChange(event.target.value as SavedAnalysisListFilter)} className="min-h-10 w-full min-w-[10rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">{SAVED_ANALYSIS_FILTER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {showClear ? <button type="button" onClick={onClear} className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Clear</button> : null}
    <p className="ml-auto min-h-10 self-end whitespace-nowrap py-2 text-xs text-zinc-600" aria-live="polite">{visibleCount} of {totalCount}</p>
  </div>;
}

function AnalysisRow({ analysis, isSelected, isChecked, onSelect, onCheckedChange }: { analysis: SavedCloudAnalysisListItem; isSelected: boolean; isChecked: boolean; onSelect: (analysisId: string) => void; onCheckedChange: (analysisId: string, checked: boolean) => void }) {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const companyLabel = getSavedAnalysisCompanyLabel(analysis);
  const savedDate = formatSavedAnalysisDate(analysis.created_at);
  const checkboxLabel = `Select saved analysis ${title}, ${companyLabel}, saved ${savedDate}`;
  const openLabel = `Open saved analysis ${title}, ${companyLabel}, saved ${savedDate}`;

  return (
    <li className={`border-b border-zinc-200 last:border-b-0 ${isSelected ? "bg-sky-50" : "bg-white"}`}>
      <div className="flex items-stretch">
        <div className="flex min-h-11 items-start px-3 py-3">
          <label className="flex min-h-10 min-w-10 cursor-pointer items-start justify-center rounded-md pt-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700">
            <span className="sr-only">{checkboxLabel}</span>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => onCheckedChange(analysis.id, event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-zinc-300 text-sky-700 accent-sky-700"
            />
          </label>
        </div>
        <button type="button" onClick={() => onSelect(analysis.id)} aria-label={openLabel} aria-pressed={isSelected} className={`relative min-h-11 min-w-0 flex-1 px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${isSelected ? "bg-sky-50" : "bg-white hover:bg-zinc-50"}`}>
          {isSelected ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-sky-700" aria-hidden="true" /> : null}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pl-2"><p className="break-words font-medium text-zinc-950">{title}</p><p className="shrink-0 text-xs text-zinc-500">{savedDate}</p></div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 pl-2 text-xs text-zinc-600"><span className={analysis.company?.trim() ? "break-words" : "break-words italic text-zinc-500"}>{companyLabel}</span><span>Matched {analysis.matched_skills_count}</span><span>Missing {analysis.missing_skills_count}</span></div>
        </button>
      </div>
    </li>
  );
}

type SavedAnalysesPanelProps = { refreshKey?: number };
type SavedAnalysesListProps = SavedAnalysesPanelProps & { onAnalysisDeleted?: () => void };

function SavedAnalysesList({ refreshKey = 0, onAnalysisDeleted }: SavedAnalysesListProps) {
  const configured = isSupabaseConfigured(); const { isLoaded, session } = useSession(); const sessionId = session?.id ?? null;
  const [activeView, setActiveView] = useState<WorkspaceView>("analyses");
  const [loadResult, setLoadResult] = useState<SavedAnalysesResult | null>(null); const [isLoading, setIsLoading] = useState(false); const [retryNonce, setRetryNonce] = useState(0); const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null); const [checkedAnalysisIds, setCheckedAnalysisIds] = useState<Set<string>>(() => new Set()); const [checkedAnalysisSessionId, setCheckedAnalysisSessionId] = useState<string | null>(null); const [searchQuery, setSearchQuery] = useState(""); const [listFilter, setListFilter] = useState<SavedAnalysisListFilter>("all"); const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null); const [compareFirstId, setCompareFirstId] = useState<string | null>(null); const [compareSecondId, setCompareSecondId] = useState<string | null>(null); const completedFetchKeyRef = useRef<string | null>(null); const selectAllVisibleRef = useRef<HTMLInputElement | null>(null); const boundSelectionSessionIdRef = useRef<string | null | undefined>(undefined);
  const allAnalyses = useMemo(() => loadResult?.status === "success" ? loadResult.analyses : [], [loadResult]);
  const effectiveCheckedAnalysisIds = useMemo(() => checkedAnalysisSessionId === sessionId ? checkedAnalysisIds : new Set<string>(), [checkedAnalysisIds, checkedAnalysisSessionId, sessionId]);
  const visibleCompareFirstId = compareFirstId && allAnalyses.some((analysis) => analysis.id === compareFirstId) ? compareFirstId : null; const visibleCompareSecondId = compareSecondId && allAnalyses.some((analysis) => analysis.id === compareSecondId) ? compareSecondId : null;
  const filteredAnalyses = useMemo(() => filterSavedAnalyses(allAnalyses, searchQuery, listFilter), [allAnalyses, searchQuery, listFilter]);
  const visibleAnalysisIds = useMemo(() => filteredAnalyses.map((analysis) => analysis.id), [filteredAnalyses]);
  const visibleCheckedCount = visibleAnalysisIds.filter((id) => effectiveCheckedAnalysisIds.has(id)).length;
  const hiddenCheckedCount = effectiveCheckedAnalysisIds.size - visibleCheckedCount;
  const hasVisibleAnalyses = visibleAnalysisIds.length > 0;
  const allVisibleChecked = hasVisibleAnalyses && visibleCheckedCount === visibleAnalysisIds.length;
  const someVisibleChecked = visibleCheckedCount > 0 && !allVisibleChecked;
  const selectionStatus = effectiveCheckedAnalysisIds.size === 0 ? "No analyses selected." : `${effectiveCheckedAnalysisIds.size} ${effectiveCheckedAnalysisIds.size === 1 ? "analysis" : "analyses"} selected${hiddenCheckedCount > 0 ? `; ${hiddenCheckedCount} ${hiddenCheckedCount === 1 ? "is" : "are"} hidden by the current search or filter` : ""}.`;
  const searchIsActive = hasActiveSavedAnalysisSearch(searchQuery, listFilter);
  const visibleSelectedAnalysisId = selectedAnalysisId && filteredAnalyses.some((analysis) => analysis.id === selectedAnalysisId) ? selectedAnalysisId : null;
  function handleClearSearch() { setSearchQuery(""); setListFilter("all"); setSelectedAnalysisId(null); setDeleteSuccessMessage(null); }
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
    setDeleteSuccessMessage(`"${deletedLabel}" was deleted.`);
    completedFetchKeyRef.current = null;
    onAnalysisDeleted?.();
  }
  function handleAnalysisCheckedChange(analysisId: string, checked: boolean) {
    setCheckedAnalysisSessionId(sessionId);
    setCheckedAnalysisIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (checked) nextIds.add(analysisId); else nextIds.delete(analysisId);
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
  function handleCompareFirstChange(analysisId: string | null) { setCompareFirstId(analysisId); if (analysisId && analysisId === compareSecondId) setCompareSecondId(null); }
  function handleCompareSecondChange(analysisId: string | null) { setCompareSecondId(analysisId); if (analysisId && analysisId === compareFirstId) setCompareFirstId(null); }

  useEffect(() => { if (selectAllVisibleRef.current) selectAllVisibleRef.current.indeterminate = someVisibleChecked; }, [someVisibleChecked]);

  useEffect(() => {
    if (boundSelectionSessionIdRef.current === sessionId) return;
    boundSelectionSessionIdRef.current = sessionId;
    setCheckedAnalysisIds(new Set());
    setCheckedAnalysisSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => { if (!configured || !isLoaded || !sessionId || !session) return; const activeSession = session; const fetchKey = `${sessionId}:${refreshKey}:${retryNonce}`; if (completedFetchKeyRef.current === fetchKey) return; let cancelled = false; async function runLoad() { setIsLoading(true); setLoadResult(null); const result = await fetchRecentSavedAnalyses(() => activeSession.getToken()); if (cancelled) return; completedFetchKeyRef.current = fetchKey; setLoadResult(result); if (result.status === "success") { setSelectedAnalysisId((currentId) => currentId && result.analyses.some((analysis) => analysis.id === currentId) ? currentId : null); setCompareFirstId((currentId) => currentId && result.analyses.some((analysis) => analysis.id === currentId) ? currentId : null); setCompareSecondId((currentId) => currentId && result.analyses.some((analysis) => analysis.id === currentId) ? currentId : null); setCheckedAnalysisIds((currentIds) => { const loadedIds = new Set(result.analyses.map((analysis) => analysis.id)); const nextIds = new Set([...currentIds].filter((id) => loadedIds.has(id))); if (nextIds.size === currentIds.size) return currentIds; return nextIds; }); } setIsLoading(false); } void runLoad(); return () => { cancelled = true; }; }, [configured, isLoaded, sessionId, session, refreshKey, retryNonce]);
  function handleRetry() { completedFetchKeyRef.current = null; setRetryNonce((nonce) => nonce + 1); }

  const loadingMarkup = <div className={`${boxClass} bg-sky-50 text-sky-900`} role="status" aria-live="polite" aria-busy={isLoading}><p className="font-medium">Loading saved analyses…</p></div>;

  if (!configured) return <div className={`${boxClass} bg-zinc-50`}><p className="font-medium text-zinc-900">Saved analyses unavailable</p><p className="mt-2">Supabase is not configured, so saved analyses cannot load locally.</p></div>;
  if (!isLoaded || isLoading) return loadingMarkup;
  if (!sessionId) return <div className={`${boxClass} bg-zinc-50`}><p className="font-medium text-zinc-900">Sign in required</p><p className="mt-2">Sign in to see analyses you have saved.</p></div>;
  if (loadResult === null) return loadingMarkup;
  if (loadResult.status === "not_configured") return <div className={`${boxClass} bg-zinc-50`}><p className="font-medium text-zinc-900">Saved analyses unavailable</p><p className="mt-2">Supabase is not configured.</p></div>;
  if (loadResult.status === "error") return <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}><div role="alert"><p className="font-medium">Could not load saved analyses</p><p className="mt-1">{loadResult.message}</p></div><button type="button" onClick={handleRetry} className="mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100">Try again</button></div>;

  const emptyAnalysesMarkup = <div className="mt-4 text-zinc-700"><p className="text-lg font-semibold text-zinc-950">No saved analyses yet</p><p className="mt-2">Run an analysis and save the result to begin building your history.</p><Link href="/dashboard" className="mt-4 inline-flex min-h-10 items-center rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Analyze a role</Link></div>;

  const listMarkup = <div className="min-w-0"><SavedAnalysesSearchControls searchQuery={searchQuery} filter={listFilter} onSearchQueryChange={(value) => { setSearchQuery(value); setDeleteSuccessMessage(null); }} onFilterChange={(value) => { setListFilter(value); setDeleteSuccessMessage(null); }} onClear={handleClearSearch} showClear={searchIsActive} totalCount={loadResult.analyses.length} visibleCount={filteredAnalyses.length} />
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3" aria-labelledby="saved-analysis-selection-heading">
      <p id="saved-analysis-selection-heading" className="text-sm font-medium text-zinc-900">Selection</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-1 text-sm font-medium text-zinc-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700">
          <input ref={selectAllVisibleRef} type="checkbox" checked={allVisibleChecked} disabled={!hasVisibleAnalyses} onChange={handleSelectAllVisibleChange} className="h-5 w-5 rounded border-zinc-300 text-sky-700 accent-sky-700 disabled:cursor-not-allowed disabled:opacity-60" />
          <span>Select all visible</span>
        </label>
        {effectiveCheckedAnalysisIds.size > 0 ? <button type="button" onClick={() => { setCheckedAnalysisSessionId(sessionId); setCheckedAnalysisIds(new Set()); }} className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Clear selection</button> : null}
      </div>
      <p className="mt-2 text-xs text-zinc-600" role="status" aria-live="polite">{selectionStatus}</p>
    </div>
    {deleteSuccessMessage ? <p className="mt-3 text-sm font-medium text-emerald-800" role="status" aria-live="polite">{deleteSuccessMessage}</p> : null}{filteredAnalyses.length === 0 ? <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-5"><p className="font-medium text-zinc-900">No saved analyses match this search.</p>{searchIsActive ? <button type="button" onClick={handleClearSearch} className="mt-3 min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">Clear</button> : null}</div> : <ul className="mt-3 overflow-hidden rounded-md border border-zinc-200 bg-white">{filteredAnalyses.map((analysis) => <AnalysisRow key={analysis.id} analysis={analysis} isSelected={visibleSelectedAnalysisId === analysis.id} isChecked={effectiveCheckedAnalysisIds.has(analysis.id)} onSelect={setSelectedAnalysisId} onCheckedChange={handleAnalysisCheckedChange} />)}</ul>}<div className="mt-4"><ExportDownloadGroup title="Export loaded analyses" description="Exports every currently loaded analysis, regardless of selection, search, or filter."><ExportDownloadButton label="Loaded analyses (CSV)" onClick={() => downloadAllSavedAnalysesCsv(allAnalyses)} /></ExportDownloadGroup></div></div>;

  return <section className={boxClass}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3"><div className="flex flex-wrap gap-2" aria-label="Saved workspace view">{views.map((view) => <button key={view.value} type="button" aria-pressed={activeView === view.value} onClick={() => setActiveView(view.value)} className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${activeView === view.value ? "border-sky-700 bg-sky-50 text-sky-950 shadow-[inset_0_-2px_0_#0369a1]" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}>{view.label}</button>)}</div><p className="text-xs text-zinc-500">{loadResult.analyses.length} most recent</p></div>
    {activeView === "analyses" ? loadResult.analyses.length === 0 ? emptyAnalysesMarkup : <div className="mt-4 xl:grid xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.35fr)] xl:gap-6"><div className={visibleSelectedAnalysisId ? "hidden xl:block" : "block"}>{listMarkup}</div><div className={visibleSelectedAnalysisId ? "block min-w-0 xl:block" : "hidden min-w-0 xl:block"}><SavedAnalysisDetailPanel analysisId={visibleSelectedAnalysisId} refreshKey={refreshKey} onDeleted={handleAnalysisDeleted} showBackLink={Boolean(visibleSelectedAnalysisId)} onBackToList={() => setSelectedAnalysisId(null)} /></div></div> : null}
    {activeView === "insights" ? <div className="mt-4 space-y-4"><RecurringGapStatsPanel refreshKey={refreshKey} /><RecurringGapExportActions /></div> : null}
    {activeView === "compare" ? <SavedAnalysisComparisonPanel analyses={allAnalyses} firstAnalysisId={visibleCompareFirstId} secondAnalysisId={visibleCompareSecondId} onFirstAnalysisIdChange={handleCompareFirstChange} onSecondAnalysisIdChange={handleCompareSecondChange} /> : null}
  </section>;
}

export function SavedAnalysesPanel({ refreshKey = 0 }: SavedAnalysesPanelProps) {
  const [recurringRefreshKey, setRecurringRefreshKey] = useState(0);
  return <SavedAnalysesList refreshKey={refreshKey + recurringRefreshKey} onAnalysisDeleted={() => setRecurringRefreshKey((key) => key + 1)} />;
}
