"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  fetchSavedAnalysisDetail,
  formatOptionalMetadata,
  formatSavedAnalysisDate,
  getSavedAnalysisDisplayTitle,
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

type SavedAnalysisDetailPanelProps = {
  analysisId: string | null;
  refreshKey?: number;
};

export function SavedAnalysisDetailPanel({
  analysisId,
  refreshKey = 0,
}: SavedAnalysisDetailPanelProps) {
  const { session } = useSession();
  const [loadResult, setLoadResult] = useState<SavedAnalysisDetailResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className={`${boxClass} border-sky-200 bg-sky-50/50 text-zinc-800`}>
      <p className="text-xs font-medium uppercase tracking-wide text-sky-800">
        Selected analysis
      </p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600">
        Saved {formatSavedAnalysisDate(analysis.created_at)} · Rule-based skill
        comparison (structured results only)
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Job title</dt>
          <dd className="font-medium text-zinc-900">
            {formatOptionalMetadata(analysis.job_title)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Company</dt>
          <dd className="font-medium text-zinc-900">
            {formatOptionalMetadata(analysis.company)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Source URL</dt>
          <dd className="text-zinc-900">
            {analysis.source_url?.trim() ? (
              <a
                href={analysis.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-800 underline break-all"
              >
                {analysis.source_url.trim()}
              </a>
            ) : (
              "Not provided"
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500">Notes</dt>
          <dd className="text-zinc-900">{formatOptionalMetadata(analysis.notes)}</dd>
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
    </div>
  );
}
