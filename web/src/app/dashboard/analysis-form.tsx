"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  formatTextStats,
  SAMPLE_JOB_TEXT,
  SAMPLE_RESUME_TEXT,
} from "@/app/dashboard/analysis-input-helpers";
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

  const resumeStats = formatTextStats(resumeText);
  const jobStats = formatTextStats(jobText);
  const canRunAnalysis =
    resumeText.trim().length > 0 && jobText.trim().length > 0 && !isAnalyzing;

  function handleFillSampleText() {
    setResumeText(SAMPLE_RESUME_TEXT);
    setJobText(SAMPLE_JOB_TEXT);
    setValidationError(null);
    setAnalysisError(null);
  }

  async function handleAnalyze() {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobText.trim();

    if (!trimmedResume && !trimmedJob) {
      setValidationError(
        "Add resume text and a job description before running analysis.",
      );
      setAnalysisError(null);
      setResult(null);
      setLastInput(null);
      setSaveUiState({ kind: "idle" });
      return;
    }

    if (!trimmedResume) {
      setValidationError("Resume text is required. Paste skills and experience to compare.");
      setAnalysisError(null);
      setResult(null);
      setLastInput(null);
      setSaveUiState({ kind: "idle" });
      return;
    }

    if (!trimmedJob) {
      setValidationError(
        "Job description text is required. Paste the posting requirements to compare.",
      );
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
      <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
        Job Fit &amp; Skill-Gap Analyzer
      </p>
      <h2 className="mt-1 text-lg font-semibold text-violet-950">
        Compare one resume to one job description
      </h2>
      <p className="mt-2 text-violet-900/90">
        Paste resume text and a job posting below. The hosted app sends them for a{" "}
        <strong>one-time rule-based</strong> comparison (keyword taxonomy—not AI).{" "}
        <strong>Running analysis does not save anything</strong> until you choose Save
        later—and save stores <strong>structured skills and metadata only</strong>, not
        the pasted text.
      </p>
      <p className="mt-2 text-sm text-violet-900/80">
        For demos, use generic sample text—not a real private resume or posting.{" "}
        <Link href="/privacy" className="font-medium text-violet-950 underline">
          Privacy &amp; data controls
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleFillSampleText}
          disabled={isAnalyzing}
          className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Fill sample demo text
        </button>
      </div>

      <fieldset className="mt-5 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Resume text (required for analysis)
        </legend>
        <p className="text-sm text-violet-900/80">
          Paste skills, experience, and education from a resume. Used only for this
          comparison run—it is <strong>not saved</strong> to your account when you
          click Save (only matched/missing skills and optional labels are stored).
        </p>
        <label className="mt-3 block text-sm">
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Python, SQL, Git, data analysis, REST APIs, teamwork…"
            aria-describedby="resume-text-stats"
          />
          <span id="resume-text-stats" className="mt-1 block text-xs text-violet-800/70">
            {resumeStats}
          </span>
        </label>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Job description text (required for analysis)
        </legend>
        <p className="text-sm text-violet-900/80">
          Paste the posting requirements or description. Like resume text, this is used
          for analysis in memory and is <strong>not stored</strong> as raw job text when
          you save structured results.
        </p>
        <label className="mt-3 block text-sm">
          <textarea
            value={jobText}
            onChange={(event) => setJobText(event.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Intern role requiring Python, SQL, FastAPI, and communication skills…"
            aria-describedby="job-text-stats"
          />
          <span id="job-text-stats" className="mt-1 block text-xs text-violet-800/70">
            {jobStats}
          </span>
        </label>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Labels for saved results (optional)
        </legend>
        <p className="text-sm text-violet-900/80">
          Optional metadata if you save after analysis. Helps you find this comparison
          in your saved list—job title, company, URL, and notes only; not resume or job
          body text.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-violet-950">Job title</span>
            <input
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
              placeholder="e.g. Software Engineering Intern"
              autoComplete="organization-title"
            />
            <span className="mt-1 block text-xs text-violet-800/70">
              Shown as the main title in your saved list.
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-violet-950">Company</span>
            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
              placeholder="e.g. Acme Corp"
              autoComplete="organization"
            />
            <span className="mt-1 block text-xs text-violet-800/70">
              Helps group postings from the same employer.
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-violet-950">Source URL</span>
            <input
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
              placeholder="https://careers.example.com/jobs/123"
              inputMode="url"
            />
            <span className="mt-1 block text-xs text-violet-800/70">
              Link back to the job posting when you review saved results.
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-violet-950">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
              placeholder="e.g. Referral from Alex · apply by Friday"
            />
            <span className="mt-1 block text-xs text-violet-800/70">
              Short reminders for yourself—deadlines, referrals, or interview stage.
            </span>
          </label>
        </div>
      </fieldset>

      {validationError ? (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          <p className="font-medium">Cannot run analysis yet</p>
          <p className="mt-1">{validationError}</p>
        </div>
      ) : null}

      {analysisError ? (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          <p className="font-medium">Analysis could not be completed</p>
          <p className="mt-1">{analysisError}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={!canRunAnalysis}
        className="mt-4 rounded-md bg-violet-800 px-4 py-2 text-sm font-medium text-white hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing ? "Running analysis…" : "Run analysis (does not save)"}
      </button>

      {!canRunAnalysis && !isAnalyzing && !validationError ? (
        <p className="mt-2 text-xs text-violet-800/80">
          Add both resume and job description text to enable analysis.
        </p>
      ) : null}

      {isAnalyzing ? (
        <p className="mt-2 text-sm text-violet-900" role="status">
          Comparing pasted text with the rule-based analyzer…
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-lg border border-violet-200 bg-white p-4 text-zinc-800">
          <p className="font-medium text-zinc-900">Analysis complete</p>
          <p className="mt-2 text-sm text-zinc-600">{result.summary}</p>
          <p className="mt-3 text-sm text-zinc-700">
            Matched: <strong>{result.matchedSkillsCount}</strong> · Missing:{" "}
            <strong>{result.missingSkillsCount}</strong>
          </p>

          <div className="mt-4 rounded-md border border-sky-100 bg-sky-50/80 px-3 py-3 text-sm text-sky-950">
            <p className="font-medium">What you can do next</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sky-900/90">
              <li>Review matched and missing skills below</li>
              <li>
                Optionally add job title, company, or notes above before saving
              </li>
              <li>
                Click <strong>Save structured results</strong> to store skills and
                metadata—or skip save and run another comparison
              </li>
              <li>
                After saving, use the list below to search, compare, export, or delete
              </li>
            </ul>
          </div>

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
            <p className="text-sm font-medium text-zinc-900">
              Save structured results (optional)
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Stores matched/missing skills plus any labels you entered—not the resume
              or job description you pasted. You can close this page without saving.
            </p>

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
              {saveUiState.kind === "saving" ? "Saving…" : "Save structured results"}
            </button>

            {saveUiState.kind === "success" ? (
              <div
                className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                role="status"
              >
                <p className="font-medium">Structured results saved</p>
                <p className="mt-1">
                  Skills and metadata are in your account. Pasted resume and job text
                  were not stored. Your saved analyses list below should update
                  shortly—you can compare, export, or delete from there.
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
