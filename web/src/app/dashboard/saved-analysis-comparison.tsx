"use client";

import { useMemo } from "react";
import {
  ExportDownloadButton,
  ExportDownloadGroup,
} from "@/app/dashboard/export-download-button";
import {
  downloadComparisonCsv,
  downloadComparisonMarkdown,
} from "@/lib/saved-analysis-exports";
import {
  compareSavedAnalyses,
  formatComparisonSkillFrequency,
  type ComparedSkillEntry,
} from "@/lib/saved-analysis-comparison";
import {
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  type SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";

const boxClass = "mt-4 text-sm leading-relaxed";

function analysisOptionLabel(analysis: SavedCloudAnalysisListItem): string {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const company = getSavedAnalysisCompanyLabel(analysis);
  return `${title} · ${company}`;
}

function ComparedSkillGroup({
  title,
  skills,
  totalAnalyses,
  kind,
  emptyMessage,
}: {
  title: string;
  skills: ComparedSkillEntry[];
  totalAnalyses: number;
  kind: "missing" | "matched";
  emptyMessage: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h4 className="font-medium text-zinc-900">
        {title} <span className="text-zinc-500">({skills.length})</span>
      </h4>
      {skills.length === 0 ? (
        <p className="mt-2 text-zinc-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {skills.map((item) => (
            <li
              key={`${kind}-${item.skill}-${item.category}`}
              className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-950">{item.skill}</span>
                <span className="text-xs text-zinc-500">{item.category}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                {formatComparisonSkillFrequency(item, totalAnalyses, kind)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type SavedAnalysisComparisonPanelProps = {
  analyses: SavedCloudAnalysisListItem[];
  firstAnalysisId: string | null;
  secondAnalysisId: string | null;
  onFirstAnalysisIdChange: (analysisId: string | null) => void;
  onSecondAnalysisIdChange: (analysisId: string | null) => void;
};

export function SavedAnalysisComparisonPanel({
  analyses,
  firstAnalysisId,
  secondAnalysisId,
  onFirstAnalysisIdChange,
  onSecondAnalysisIdChange,
}: SavedAnalysisComparisonPanelProps) {
  const firstAnalysis =
    analyses.find((analysis) => analysis.id === firstAnalysisId) ?? null;
  const secondAnalysis =
    analyses.find((analysis) => analysis.id === secondAnalysisId) ?? null;

  const comparison = useMemo(() => {
    if (!firstAnalysis || !secondAnalysis) {
      return null;
    }
    return compareSavedAnalyses(firstAnalysis, secondAnalysis);
  }, [firstAnalysis, secondAnalysis]);

  const firstLabel = firstAnalysis
    ? analysisOptionLabel(firstAnalysis)
    : "First analysis";
  const secondLabel = secondAnalysis
    ? analysisOptionLabel(secondAnalysis)
    : "Second analysis";

  function handleClearComparison() {
    onFirstAnalysisIdChange(null);
    onSecondAnalysisIdChange(null);
  }

  if (analyses.length < 2) {
    return (
      <div className={`${boxClass} text-zinc-900`}>
        <p className="font-medium text-zinc-950">Compare</p>
        <p className="mt-2 text-zinc-700">Save at least two analyses to compare skills.</p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} text-zinc-900`}>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm" htmlFor="compare-first-analysis">
          <span className="font-medium text-zinc-950">First analysis</span>
          <select
            id="compare-first-analysis"
            value={firstAnalysisId ?? ""}
            onChange={(event) =>
              onFirstAnalysisIdChange(event.target.value || null)
            }
            className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <option value="">Select an analysis…</option>
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysisOptionLabel(analysis)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm" htmlFor="compare-second-analysis">
          <span className="font-medium text-zinc-950">Second analysis</span>
          <select
            id="compare-second-analysis"
            value={secondAnalysisId ?? ""}
            onChange={(event) =>
              onSecondAnalysisIdChange(event.target.value || null)
            }
            className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <option value="">Select an analysis…</option>
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysisOptionLabel(analysis)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {firstAnalysisId || secondAnalysisId ? (
        <button
          type="button"
          onClick={handleClearComparison}
          className="mt-3 min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
Clear selection
        </button>
      ) : null}

      {!firstAnalysisId || !secondAnalysisId ? (
        <p className="mt-4 rounded-lg border border-zinc-300/80 bg-white/70 px-3 py-3 text-zinc-700">
Choose two analyses to compare skills.
        </p>
      ) : null}

      {firstAnalysisId &&
      secondAnalysisId &&
      firstAnalysisId === secondAnalysisId ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950">
          Choose two different analyses to compare.
        </p>
      ) : null}

      {comparison && firstAnalysis && secondAnalysis ? (
        <div className="mt-4 space-y-5" aria-live="polite">
          <p className="text-sm text-zinc-700"><span className="font-medium">{firstLabel}</span> ↔ <span className="font-medium">{secondLabel}</span></p>

          <ExportDownloadGroup title="Export comparison" description="Shared and single-analysis skill groups.">
            <ExportDownloadButton
              label="Comparison (Markdown)"
              onClick={() =>
                downloadComparisonMarkdown({
                  firstLabel,
                  secondLabel,
                  comparison,
                })
              }
            />
            <ExportDownloadButton
              label="Comparison (CSV)"
              onClick={() =>
                downloadComparisonCsv({
                  firstLabel,
                  secondLabel,
                  comparison,
                })
              }
            />
          </ExportDownloadGroup>

          <div className="space-y-3">
            <h3 className="font-medium text-zinc-950">Missing skills</h3>
            <ComparedSkillGroup
              title="Shared missing skills"
              skills={comparison.missing.shared}
              totalAnalyses={comparison.missing.totalAnalyses}
              kind="missing"
              emptyMessage="No shared missing skills between these analyses."
            />
            <ComparedSkillGroup
              title="Other missing skills"
              skills={comparison.missing.other}
              totalAnalyses={comparison.missing.totalAnalyses}
              kind="missing"
              emptyMessage="No missing skills unique to a single analysis."
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-zinc-950">Matched skills</h3>
            <ComparedSkillGroup
              title="Shared matched skills"
              skills={comparison.matched.shared}
              totalAnalyses={comparison.matched.totalAnalyses}
              kind="matched"
              emptyMessage="No shared matched skills between these analyses."
            />
            <ComparedSkillGroup
              title="Other matched skills"
              skills={comparison.matched.other}
              totalAnalyses={comparison.matched.totalAnalyses}
              kind="matched"
              emptyMessage="No matched skills unique to a single analysis."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
