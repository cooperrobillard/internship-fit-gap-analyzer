"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  ExportDownloadButton,
  ExportDownloadGroup,
} from "@/app/dashboard/export-download-button";
import {
  downloadSavedAnalysisCsv,
  downloadSavedAnalysisMarkdown,
} from "@/lib/saved-analysis-exports";
import {
  deleteSavedAnalysis,
  fetchSavedAnalysisDetail,
  formatOptionalMetadata,
  formatSavedAnalysisDate,
  formatSourceUrl,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  normalizeOptionalMetadata,
  type SavedAnalysisDetail,
  type SavedAnalysisDetailResult,
  type SavedAnalysisSkill,
} from "@/lib/supabase/saved-analyses";

const surfaceClass = "text-sm leading-relaxed text-zinc-800";

function SkillList({ title, skills, emptyMessage }: { title: string; skills: SavedAnalysisSkill[]; emptyMessage: string }) {
  return (
    <section>
      <h4 className="font-medium text-zinc-950">{title} <span className="text-zinc-500">({skills.length})</span></h4>
      {skills.length === 0 ? <p className="mt-2 text-zinc-600">{emptyMessage}</p> : (
        <ul className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200">
          {skills.map((item) => (
            <li key={`${item.skill}-${item.category}`} className="flex gap-3 py-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
              <span className="min-w-0"><span className="block break-words font-medium text-zinc-900">{item.skill}</span><span className="block break-words text-xs text-zinc-500">{item.category}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type DeleteUiState = { kind: "idle" } | { kind: "confirming" } | { kind: "deleting" } | { kind: "error"; message: string };

function getSavedAnalysisDeleteLabel(analysis: SavedAnalysisDetail): string {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const company = normalizeOptionalMetadata(analysis.company);
  return company ? `${title} · ${company}` : title;
}

type SavedAnalysisDetailPanelProps = { analysisId: string | null; refreshKey?: number; onDeleted?: (deletedLabel: string) => void; onBackToList?: () => void; showBackLink?: boolean };

export function SavedAnalysisDetailPanel({ analysisId, refreshKey = 0, onDeleted, onBackToList, showBackLink = false }: SavedAnalysisDetailPanelProps) {
  const { session } = useSession();
  const [loadResult, setLoadResult] = useState<SavedAnalysisDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteUiState, setDeleteUiState] = useState<DeleteUiState>({ kind: "idle" });
  const completedFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!analysisId || !session) return;
    const activeSession = session;
    const activeAnalysisId = analysisId;
    const fetchKey = `${activeAnalysisId}:${refreshKey}`;
    if (completedFetchKeyRef.current === fetchKey) return;
    let cancelled = false;
    async function runLoad() {
      setIsLoading(true); setLoadResult(null); setDeleteUiState({ kind: "idle" });
      const result = await fetchSavedAnalysisDetail(() => activeSession.getToken(), activeAnalysisId);
      if (cancelled) return;
      completedFetchKeyRef.current = fetchKey; setLoadResult(result); setIsLoading(false);
    }
    void runLoad();
    return () => { cancelled = true; };
  }, [analysisId, refreshKey, session]);

  if (!analysisId || !session) return <p className="py-6 text-sm text-zinc-600">Select an analysis to review its skills and details.</p>;

  if (isLoading || loadResult === null) return <div className={`${surfaceClass} rounded-md border border-zinc-200 bg-white/70 p-4`} role="status" aria-live="polite" aria-busy={isLoading}><p className="font-medium text-zinc-900">Loading detail…</p></div>;

  if (loadResult.status === "not_found") return <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Analysis not found</p><p className="mt-1">Select another saved analysis.</p></div>;
  if (loadResult.status === "error") return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950" role="alert"><p className="font-medium">Could not load analysis detail</p><p className="mt-1">{loadResult.message}</p></div>;
  if (loadResult.status !== "success") return null;

  const { analysis } = loadResult;
  const title = getSavedAnalysisDisplayTitle(analysis);
  const companyLabel = getSavedAnalysisCompanyLabel(analysis);
  const sourceUrl = formatSourceUrl(analysis.source_url);
  const notesText = normalizeOptionalMetadata(analysis.notes);
  const deleteLabel = getSavedAnalysisDeleteLabel(analysis);
  const isDeleting = deleteUiState.kind === "deleting";

  async function handleConfirmDelete() {
    if (!session || !analysisId || isDeleting) return;
    setDeleteUiState({ kind: "deleting" });
    const result = await deleteSavedAnalysis(() => session.getToken(), analysisId);
    if (result.status === "success" || result.status === "not_found") { onDeleted?.(deleteLabel); return; }
    setDeleteUiState({ kind: "error", message: result.status === "error" ? result.message : "Could not delete this analysis right now. Please try again in a moment." });
  }

  return (
    <article className={`${surfaceClass} min-w-0`} aria-busy={isDeleting}>
      {showBackLink ? <button type="button" onClick={onBackToList} className="mb-4 min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Back to saved analyses</button> : null}
      <header className="border-b border-zinc-200 pb-4">
        <h2 className="break-words text-xl font-semibold text-zinc-950">{title}</h2>
        <p className={`mt-1 break-words ${analysis.company?.trim() ? "text-zinc-700" : "text-zinc-500 italic"}`}>{companyLabel}</p>
        <p className="mt-2 text-xs text-zinc-600">Saved {formatSavedAnalysisDate(analysis.created_at)} · Matched {analysis.matched_skills_count} · Missing {analysis.missing_skills_count}</p>
      </header>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <SkillList title="Matched skills" skills={analysis.matchedSkills} emptyMessage="No matched skills stored for this analysis." />
        <SkillList title="Missing skills" skills={analysis.missingSkills} emptyMessage="No missing skills stored for this analysis." />
      </div>

      <details className="mt-5 rounded-md border border-zinc-200 bg-zinc-50/70 px-3 py-2">
        <summary className="min-h-10 cursor-pointer font-medium text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Job details{notesText ? " · Notes included" : ""}</summary>
        <dl className="mt-2 grid gap-3 text-sm">
          <div><dt className="text-zinc-500">Source URL</dt><dd className="min-w-0 text-zinc-900">{sourceUrl.kind === "link" ? <a href={sourceUrl.href} target="_blank" rel="noopener noreferrer" className="break-all text-sky-800 underline" title={sourceUrl.href}>{sourceUrl.label}</a> : null}{sourceUrl.kind === "text" ? <span className="break-all text-zinc-700" title={analysis.source_url ?? undefined}>{sourceUrl.label}</span> : null}{sourceUrl.kind === "missing" ? <span className="text-zinc-500">Not provided</span> : null}</dd></div>
          <div><dt className="text-zinc-500">Notes</dt><dd className="min-w-0 text-zinc-900">{notesText ? <p className="whitespace-pre-wrap break-words">{notesText}</p> : <span className="text-zinc-500">{formatOptionalMetadata(analysis.notes)}</span>}</dd></div>
        </dl>
      </details>

      <div className="mt-5 border-t border-zinc-200 pt-4"><ExportDownloadGroup title="Export result" description="Metadata and skill rows only."><ExportDownloadButton label="Markdown" onClick={() => downloadSavedAnalysisMarkdown(analysis)} /><ExportDownloadButton label="CSV" onClick={() => downloadSavedAnalysisCsv(analysis)} /></ExportDownloadGroup></div>

      <div className="mt-5 border-t border-zinc-200 pt-4">
        {deleteUiState.kind === "confirming" ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950" aria-busy={isDeleting}><p className="font-medium">Delete this saved analysis?</p><p className="mt-1 text-sm"><span className="font-medium">{deleteLabel}</span> will be removed from your account, including its skill results and metadata. This cannot be undone.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void handleConfirmDelete()} disabled={isDeleting} className="min-h-10 rounded-md bg-red-800 px-3 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60">{isDeleting ? "Deleting…" : "Yes, delete"}</button><button type="button" onClick={() => setDeleteUiState({ kind: "idle" })} disabled={isDeleting} className="min-h-10 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button></div></div> : <button type="button" onClick={() => setDeleteUiState({ kind: "confirming" })} disabled={isDeleting} className="min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">Delete saved analysis</button>}
        {deleteUiState.kind === "error" ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert"><p className="font-medium">Could not delete analysis</p><p className="mt-1">{deleteUiState.message}</p></div> : null}
      </div>
    </article>
  );
}
