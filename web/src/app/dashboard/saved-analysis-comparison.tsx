"use client";

import { useMemo } from "react";
import {
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  type SavedAnalysisSkill,
  type SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";
import { compareSavedAnalyses } from "@/lib/saved-analysis-comparison";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

function analysisOptionLabel(analysis: SavedCloudAnalysisListItem): string {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const company = getSavedAnalysisCompanyLabel(analysis);
  return `${title} · ${company}`;
}

function SkillGroup({
  title,
  skills,
  emptyMessage,
}: {
  title: string;
  skills: SavedAnalysisSkill[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <h4 className="font-medium text-zinc-900">
        {title} <span className="text-zinc-500">({skills.length})</span>
      </h4>
      {skills.length === 0 ? (
        <p className="mt-2 text-zinc-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {skills.map((item) => (
            <li
              key={`${item.skill}-${item.category}`}
              className="rounded-md bg-zinc-50 px-2 py-1.5 text-zinc-800"
            >
              <span className="font-medium">{item.skill}</span>
              <span className="text-zinc-500"> · {item.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const firstAnalysis = analyses.find((analysis) => analysis.id === firstAnalysisId) ?? null;
  const secondAnalysis =
    analyses.find((analysis) => analysis.id === secondAnalysisId) ?? null;

  const comparison = useMemo(() => {
    if (!firstAnalysis || !secondAnalysis) {
      return null;
    }
    return compareSavedAnalyses(firstAnalysis, secondAnalysis);
  }, [firstAnalysis, secondAnalysis]);

  const firstLabel = firstAnalysis ? analysisOptionLabel(firstAnalysis) : "First analysis";
  const secondLabel = secondAnalysis ? analysisOptionLabel(secondAnalysis) : "Second analysis";

  function handleClearComparison() {
    onFirstAnalysisIdChange(null);
    onSecondAnalysisIdChange(null);
  }

  if (analyses.length < 2) {
    return (
      <div className={`${boxClass} border-violet-200 bg-violet-50/60 text-violet-950`}>
        <p className="font-medium text-violet-950">Compare saved analyses</p>
        <p className="mt-2 text-violet-900/90">
          Save at least two analyses to compare missing and matched skills side by side.
        </p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} border-violet-200 bg-violet-50/60 text-violet-950`}>
      <p className="font-medium text-violet-950">Compare saved analyses</p>
      <p className="mt-2 text-violet-900/90">
        Pick two saved analyses to compare structured skill results. Uses saved skill rows
        only—not resume or job description text.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-violet-950">First analysis</span>
          <select
            value={firstAnalysisId ?? ""}
            onChange={(event) =>
              onFirstAnalysisIdChange(event.target.value || null)
            }
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
          >
            <option value="">Select an analysis…</option>
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysisOptionLabel(analysis)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-violet-950">Second analysis</span>
          <select
            value={secondAnalysisId ?? ""}
            onChange={(event) =>
              onSecondAnalysisIdChange(event.target.value || null)
            }
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
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
          className="mt-3 rounded-md border border-violet-200 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 hover:bg-violet-100"
        >
          Clear comparison selection
        </button>
      ) : null}

      {!firstAnalysisId || !secondAnalysisId ? (
        <p className="mt-4 rounded-lg border border-violet-200/80 bg-white/70 px-3 py-3 text-violet-900/90">
          Select two analyses above to see shared and unique missing and matched skills.
        </p>
      ) : null}

      {firstAnalysisId && secondAnalysisId && firstAnalysisId === secondAnalysisId ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950">
          Choose two different analyses to compare.
        </p>
      ) : null}

      {comparison && firstAnalysis && secondAnalysis ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-violet-900/90">
            Comparing <span className="font-medium">{firstLabel}</span> with{" "}
            <span className="font-medium">{secondLabel}</span>.
          </p>

          <div>
            <h3 className="font-medium text-violet-950">Missing skills</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <SkillGroup
                title="Shared missing skills"
                skills={comparison.missing.shared}
                emptyMessage="No shared missing skills between these analyses."
              />
              <SkillGroup
                title={`Missing only in first`}
                skills={comparison.missing.onlyFirst}
                emptyMessage="No missing skills unique to the first analysis."
              />
              <SkillGroup
                title={`Missing only in second`}
                skills={comparison.missing.onlySecond}
                emptyMessage="No missing skills unique to the second analysis."
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-violet-950">Matched skills</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <SkillGroup
                title="Shared matched skills"
                skills={comparison.matched.shared}
                emptyMessage="No shared matched skills between these analyses."
              />
              <SkillGroup
                title={`Matched only in first`}
                skills={comparison.matched.onlyFirst}
                emptyMessage="No matched skills unique to the first analysis."
              />
              <SkillGroup
                title={`Matched only in second`}
                skills={comparison.matched.onlySecond}
                emptyMessage="No matched skills unique to the second analysis."
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
