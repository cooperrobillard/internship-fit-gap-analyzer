"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";
import { analyzeWithApi } from "@/lib/analysis/api-analysis-client";
import { mapWebAnalysisToCloudSaveInput } from "@/lib/analysis/to-cloud-save-input";
import type { WebAnalysisInput, WebAnalysisResult } from "@/lib/analysis/types";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { saveCloudAnalysis } from "@/lib/supabase/save-analysis";
import { getSafeSavedAnalysisErrorMessage } from "@/lib/supabase/supabase-errors";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

function SkillList({
  title,
  skills,
  emptyMessage,
}: {
  title: string;
  skills: { skill: string; category: string }[];
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
      <h4 className="font-medium text-zinc-900">{title}</h4>
      <ul className="mt-2 space-y-1">
        {skills.map((item) => (
          <li
            key={`${item.skill}-${item.category}`}
            className="rounded-md bg-zinc-50 px-3 py-2 text-zinc-800"
          >
            <span className="font-medium">{item.skill}</span>
            <span className="text-zinc-500"> · {item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SaveUiState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; jobAnalysisId: string }
  | { kind: "error"; message: string };

type AnalysisFormProps = {
  onSaveSuccess?: () => void;
};

export function AnalysisForm({ onSaveSuccess }: AnalysisFormProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const { userId } = useAuth();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInput, setLastInput] = useState<WebAnalysisInput | null>(null);
  const [result, setResult] = useState<WebAnalysisResult | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>({ kind: "idle" });

  const canAttemptSave =
    configured &&
    isLoaded &&
    Boolean(session) &&
    Boolean(userId) &&
    Boolean(lastInput) &&
    Boolean(result);

  async function handleAnalyze() {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobText.trim();

    if (!trimmedResume || !trimmedJob) {
      setValidationError("Resume text and job description text are required.");
      setAnalysisError(null);
      setResult(null);
      setLastInput(null);
      setSaveUiState({ kind: "idle" });
      return;
    }

    setValidationError(null);
    setAnalysisError(null);
    setSaveUiState({ kind: "idle" });
    setIsAnalyzing(true);
    setResult(null);
    setLastInput(null);

    const analysisInput: WebAnalysisInput = {
      resumeText: trimmedResume,
      jobText: trimmedJob,
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const apiResult = await analyzeWithApi(analysisInput);
    setIsAnalyzing(false);

    if (apiResult.status === "error") {
      setAnalysisError(apiResult.message);
      return;
    }

    setLastInput(analysisInput);
    setResult(apiResult.result);
  }

  async function handleSavePrototype() {
    if (
      !canAttemptSave ||
      !session ||
      !userId ||
      !lastInput ||
      !result ||
      saveUiState.kind === "saving"
    ) {
      return;
    }

    setSaveUiState({ kind: "saving" });

    try {
      const token = await session.getToken();
      if (!token) {
        setSaveUiState({
          kind: "error",
          message: getSafeSavedAnalysisErrorMessage("save", null, {
            reason: "session",
          }),
        });
        return;
      }

      const saveInput = mapWebAnalysisToCloudSaveInput(lastInput, result);
      const supabase = createClerkSupabaseClient(() => session.getToken());
      const saveResult = await saveCloudAnalysis(supabase, userId, saveInput);

      if (saveResult.status === "error") {
        setSaveUiState({ kind: "error", message: saveResult.message });
        return;
      }

      setSaveUiState({
        kind: "success",
        jobAnalysisId: saveResult.jobAnalysisId,
      });
      onSaveSuccess?.();
    } catch {
      setSaveUiState({
        kind: "error",
        message: getSafeSavedAnalysisErrorMessage("save", null, {
          reason: "network",
        }),
      });
    }
  }

  return (
    <div className={`${boxClass} border-violet-200 bg-violet-50 text-violet-950`}>
      <p className="font-medium text-violet-950">Run analysis</p>
      <p className="mt-2 text-violet-900/90">
        Paste <strong>generic sample text</strong> for now—not a real private
        resume or job posting. The rule-based Python analyzer returns matched and
        missing skills. You can optionally save skills and metadata afterward.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-violet-950">Job title (optional)</span>
          <input
            type="text"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Software Engineering Intern"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-violet-950">Company (optional)</span>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Demo Company"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-violet-950">Source URL (optional)</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="https://example.com/posting"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-violet-950">Notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="Optional reminder for yourself"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-violet-950">Resume text (required)</span>
        <textarea
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          rows={5}
          className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
          placeholder="e.g. Python SQL Git data analysis"
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-violet-950">
          Job description text (required)
        </span>
        <textarea
          value={jobText}
          onChange={(event) => setJobText(event.target.value)}
          rows={5}
          className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
          placeholder="e.g. Intern role requiring Python, SQL, and FastAPI experience"
        />
      </label>

      {validationError ? (
        <p className="mt-3 text-sm text-red-800">{validationError}</p>
      ) : null}

      {analysisError ? (
        <div
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          <p className="font-medium">Analysis could not be completed</p>
          <p className="mt-1">{analysisError}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={isAnalyzing}
        className="mt-4 rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing ? "Running analysis…" : "Run analysis"}
      </button>

      {result ? (
        <div className="mt-6 rounded-lg border border-violet-200 bg-white p-4 text-zinc-800">
          <p className="font-medium text-zinc-900">Analysis result</p>
          <p className="mt-2 text-sm text-zinc-600">{result.summary}</p>
          <p className="mt-3 text-sm text-zinc-700">
            Matched: <strong>{result.matchedSkillsCount}</strong> · Missing:{" "}
            <strong>{result.missingSkillsCount}</strong>
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SkillList
              title="Matched skills"
              skills={result.matchedSkills}
              emptyMessage="No matched skills found."
            />
            <SkillList
              title="Missing skills"
              skills={result.missingSkills}
              emptyMessage="No missing skills found."
            />
          </div>
          <div className="mt-5 border-t border-violet-100 pt-4">
            {!configured ? (
              <p className="mt-2 text-xs text-zinc-500">
                Supabase is not configured. Add env vars to{" "}
                <code className="text-xs">web/.env.local</code> before saving.
              </p>
            ) : null}

            {!isLoaded ? (
              <p className="mt-2 text-xs text-zinc-500">Loading Clerk session…</p>
            ) : null}

            {isLoaded && !userId ? (
              <p className="mt-2 text-xs text-zinc-500">
                Sign in to save this analysis.
              </p>
            ) : null}

            {saveUiState.kind === "saving" ? (
              <p className="mt-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                Saving to your account…
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSavePrototype()}
              disabled={!canAttemptSave || saveUiState.kind === "saving"}
              className="mt-3 rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveUiState.kind === "saving" ? "Saving…" : "Save analysis"}
            </button>

            {saveUiState.kind === "success" ? (
              <div
                className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                role="status"
              >
                <p className="font-medium">Analysis saved</p>
                <p className="mt-1">
                  Your saved analyses list below should update shortly.
                </p>
              </div>
            ) : null}

            {saveUiState.kind === "error" ? (
              <div
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                role="alert"
              >
                <p className="font-medium">Could not save analysis</p>
                <p className="mt-1">{saveUiState.message}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Shares a refresh key between prototype save and the saved-analyses panel. */
export function DashboardAnalysisWithRefresh({
  children,
}: {
  children: (props: {
    refreshKey: number;
    onSaveSuccess: () => void;
  }) => ReactNode;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const onSaveSuccess = () => setRefreshKey((key) => key + 1);

  return (
    <>
      <AnalysisForm onSaveSuccess={onSaveSuccess} />
      {children({ refreshKey, onSaveSuccess })}
    </>
  );
}
