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

const boxClass = "mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm";

function SkillList({
  title,
  skills,
  emptyMessage,
}: {
  title: string;
  skills: SavedAnalysisSkill[];
  emptyMessage: string;
}) {
  if (skills.length === 0) {
    return (
      <div>
        <h4 className="font-medium text-zinc-900">{title}</h4>
        <p className="mt-2 text-zinc-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-zinc-900">
        {title} ({skills.length})
      </h4>
      <ul className="mt-2 space-y-1">
        {skills.map((item) => (
          <li
            key={`${item.skill}-${item.category}`}
            className="rounded-md bg-white px-3 py-2 text-zinc-800"
          >
            <span className="font-medium">{item.skill}</span>
            <span className="text-zinc-500"> · {item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type DeleteUiState =
  | { kind: "idle" }
  | { kind: "confirming" }
  | { kind: "deleting" }
  | { kind: "error"; message: string };

function getSavedAnalysisDeleteLabel(analysis: SavedAnalysisDetail): string {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const company = normalizeOptionalMetadata(analysis.company);
  if (company) {
    return `${title} · ${company}`;
  }
  return title;
}

type SavedAnalysisDetailPanelProps = {
  analysisId: string | null;
  refreshKey?: number;
  onDeleted?: (deletedLabel: string) => void;
};

export function SavedAnalysisDetailPanel({
  analysisId,
  refreshKey = 0,
  onDeleted,
}: SavedAnalysisDetailPanelProps) {
  const { session } = useSession();
  const [loadResult, setLoadResult] = useState<SavedAnalysisDetailResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleteUiState, setDeleteUiState] = useState<DeleteUiState>({
    kind: "idle",
  });
  const completedFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!analysisId || !session) {
      return;
    }

    const fetchKey = `${analysisId}:${refreshKey}`;
    if (completedFetchKeyRef.current === fetchKey) {
      return;
    }

    let cancelled = false;
    const activeSession = session;
    const activeAnalysisId = analysisId;

    async function runLoad() {
      setIsLoading(true);
      setLoadResult(null);
      setDeleteUiState({ kind: "idle" });

      const result = await fetchSavedAnalysisDetail(
        () => activeSession.getToken(),
        activeAnalysisId,
      );

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
  }, [analysisId, refreshKey, session]);

  if (!analysisId || !session) {
    return (
      <div className={`${boxClass} text-zinc-600`}>
        <p className="font-medium text-zinc-900">Saved analysis detail</p>
        <p className="mt-2">
          Select a saved analysis above to review its metadata and skill lists.
        </p>
      </div>
    );
  }

  if (isLoading || loadResult === null) {
    return (
      <div className={`${boxClass} text-zinc-600`}>
        <p className="font-medium text-zinc-900">Loading analysis detail…</p>
      </div>
    );
  }

  if (loadResult.status === "not_found") {
    return (
      <div className={`${boxClass} border-amber-200 bg-amber-50 text-amber-950`}>
        <p className="font-medium">Analysis not found</p>
        <p className="mt-2">
          This saved analysis is no longer available. Select another row from the
          list.
        </p>
      </div>
    );
  }

  if (loadResult.status === "error") {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`} role="alert">
        <p className="font-medium">Could not load analysis detail</p>
        <p className="mt-1">{loadResult.message}</p>
      </div>
    );
  }

  if (loadResult.status !== "success") {
    return null;
  }

  const { analysis } = loadResult;
  const title = getSavedAnalysisDisplayTitle(analysis);
  const companyLabel = getSavedAnalysisCompanyLabel(analysis);
  const sourceUrl = formatSourceUrl(analysis.source_url);
  const notesText = normalizeOptionalMetadata(analysis.notes);
  const deleteLabel = getSavedAnalysisDeleteLabel(analysis);
  const isDeleting = deleteUiState.kind === "deleting";

  async function handleConfirmDelete() {
    if (!session || !analysisId || isDeleting) {
      return;
    }

    setDeleteUiState({ kind: "deleting" });

    const result = await deleteSavedAnalysis(() => session.getToken(), analysisId);

    if (result.status === "success") {
      onDeleted?.(deleteLabel);
      return;
    }

    if (result.status === "not_found") {
      onDeleted?.(deleteLabel);
      return;
    }

    setDeleteUiState({
      kind: "error",
      message:
        result.status === "error"
          ? result.message
          : "Could not delete this analysis right now. Please try again in a moment.",
    });
  }

  return (
    <div className={`${boxClass} border-sky-200 bg-sky-50/50 text-zinc-800`}>
      <p className="text-xs font-medium uppercase tracking-wide text-sky-800">
        Selected analysis
      </p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-900">{title}</h3>
      <p
        className={`mt-1 text-sm ${
          analysis.company?.trim() ? "text-zinc-700" : "text-zinc-500 italic"
        }`}
      >
        {companyLabel}
      </p>
      <p className="mt-1 text-xs text-zinc-600">
        Saved {formatSavedAnalysisDate(analysis.created_at)} · Rule-based skill
        comparison (structured results only)
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Job title</dt>
          <dd className="font-medium text-zinc-900">{title}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Company</dt>
          <dd
            className={`font-medium ${
              analysis.company?.trim() ? "text-zinc-900" : "text-zinc-500 italic"
            }`}
          >
            {companyLabel}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Source URL</dt>
          <dd className="min-w-0 text-zinc-900">
            {sourceUrl.kind === "link" ? (
              <a
                href={sourceUrl.href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sky-800 underline"
                title={sourceUrl.href}
              >
                {sourceUrl.label}
              </a>
            ) : null}
            {sourceUrl.kind === "text" ? (
              <span className="break-all text-zinc-700" title={analysis.source_url ?? undefined}>
                {sourceUrl.label}
              </span>
            ) : null}
            {sourceUrl.kind === "missing" ? (
              <span className="text-zinc-500">Not provided</span>
            ) : null}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Notes</dt>
          <dd className="min-w-0 text-zinc-900">
            {notesText ? (
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-white/80 px-3 py-2 text-zinc-800">
                {notesText}
              </p>
            ) : (
              <span className="text-zinc-500">{formatOptionalMetadata(analysis.notes)}</span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-zinc-700">
        Matched: <strong>{analysis.matched_skills_count}</strong> · Missing:{" "}
        <strong>{analysis.missing_skills_count}</strong>
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SkillList
          title="Matched skills"
          skills={analysis.matchedSkills}
          emptyMessage="No matched skills stored for this analysis."
        />
        <SkillList
          title="Missing skills"
          skills={analysis.missingSkills}
          emptyMessage="No missing skills stored for this analysis."
        />
      </div>

      <div className="mt-5 border-t border-sky-200 pt-4">
        <ExportDownloadGroup description="Metadata and skill rows only—not resume or job description text.">
          <ExportDownloadButton
            label="Markdown"
            onClick={() => downloadSavedAnalysisMarkdown(analysis)}
          />
          <ExportDownloadButton
            label="CSV"
            onClick={() => downloadSavedAnalysisCsv(analysis)}
          />
        </ExportDownloadGroup>
      </div>

      <div className="mt-5 border-t border-sky-200 pt-4">
        {deleteUiState.kind === "confirming" ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950">
            <p className="font-medium">Delete this saved analysis?</p>
            <p className="mt-1 text-sm">
              <span className="font-medium">{deleteLabel}</span> will be removed from
              your account, including its skill results and metadata. This cannot be
              undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="rounded-md bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteUiState({ kind: "idle" })}
                disabled={isDeleting}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteUiState({ kind: "confirming" })}
            disabled={isDeleting}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete saved analysis
          </button>
        )}

        {deleteUiState.kind === "error" ? (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            <p className="font-medium">Could not delete analysis</p>
            <p className="mt-1">{deleteUiState.message}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
