"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  formatTextStats,
  readTextFile,
} from "@/app/dashboard/analysis-input-helpers";
import { DEMO_ANALYSIS_INPUTS } from "@/lib/demo-inputs";
import { analyzeWithApi } from "@/lib/analysis/api-analysis-client";
import { mapWebAnalysisToCloudSaveInput } from "@/lib/analysis/to-cloud-save-input";
import type { WebAnalysisInput, WebAnalysisResult } from "@/lib/analysis/types";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { saveCloudAnalysis } from "@/lib/supabase/save-analysis";
import {
  listResumeProfiles,
  type ResumeProfile,
  type ResumeProfileSourceType,
} from "@/lib/supabase/resume-profiles";
import { getSafeSavedAnalysisErrorMessage } from "@/lib/supabase/supabase-errors";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

const SOURCE_TYPE_LABELS: Record<ResumeProfileSourceType, string> = {
  manual: "Manual entry",
  pasted: "Pasted text",
  txt_upload: "Plain .txt upload",
  demo: "Demo profile",
  imported: "Imported profile",
};

type ResumeInputMode = "pasted" | "saved_profile";

function formatProfileSkills(skills: string[]): string {
  return skills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(", ");
}

export function buildResumeProfileAnalysisText(profile: ResumeProfile): string {
  const sections = [
    `Saved structured resume profile: ${profile.profileName.trim()}`,
  ];

  const description = profile.profileDescription.trim();
  if (description) {
    sections.push(`Profile notes: ${description}`);
  }

  const extractedSkills = formatProfileSkills(profile.extractedSkills);
  if (extractedSkills) {
    sections.push(`Extracted skills: ${extractedSkills}`);
  }

  const userAddedSkills = formatProfileSkills(profile.userAddedSkills);
  if (userAddedSkills) {
    sections.push(`User-added skills: ${userAddedSkills}`);
  }

  sections.push(
    "Source: saved structured resume profile. This is not raw resume text or a full parsed resume.",
  );

  return sections.join("\n");
}

function ResumeProfileSkillPreview({
  title,
  skills,
}: {
  title: string;
  skills: string[];
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-violet-800/80">
        {title}
      </p>
      {skills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={`${title}-${skill}`}
              className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-950"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-violet-800/70">
          No skills saved in this section.
        </p>
      )}
    </div>
  );
}

function ResumeProfileAnalysisGuardrail({
  disabled,
  inputMode,
  onInputModeChange,
  onSelectedProfileChange,
}: {
  disabled: boolean;
  inputMode: ResumeInputMode;
  onInputModeChange: (mode: ResumeInputMode) => void;
  onSelectedProfileChange: (profile: ResumeProfile | null) => void;
}) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const { userId } = useAuth();
  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const canUseProfiles =
    configured && isLoaded && Boolean(session) && Boolean(userId);
  const selectedProfile = canUseProfiles
    ? (profiles.find((profile) => profile.id === selectedProfileId) ?? null)
    : null;

  useEffect(() => {
    onSelectedProfileChange(selectedProfile);
  }, [onSelectedProfileChange, selectedProfile]);

  useEffect(() => {
    if (!canUseProfiles) {
      return;
    }

    let cancelled = false;

    async function runLoad() {
      setIsLoading(true);
      setLoadError(null);

      const supabase = createClerkSupabaseClient(() => session!.getToken());
      const result = await listResumeProfiles(supabase, userId!);

      if (cancelled) {
        return;
      }

      if (result.status === "success") {
        setProfiles(result.profiles);
        setSelectedProfileId((currentId) =>
          result.profiles.some((profile) => profile.id === currentId)
            ? currentId
            : "",
        );
      } else {
        setProfiles([]);
        setSelectedProfileId("");
        setLoadError(result.message);
      }

      setIsLoading(false);
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [canUseProfiles, session, userId]);

  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">Resume input source</p>
          <p className="mt-1 text-violet-900/85">
            Choose whether this run uses pasted/uploaded transient resume text
            or a saved structured profile. Saved profile analysis uses
            structured skills and notes from your saved profile, not raw resume
            text.
          </p>
        </div>
        <Link
          href="#resume-profiles"
          className="text-xs font-medium text-violet-950 underline"
        >
          Manage profiles
        </Link>
      </div>

      <div
        className="mt-4 grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Resume input source"
      >
        <label className="flex gap-2 rounded-md border border-violet-200 bg-white px-3 py-2 text-sm text-violet-950">
          <input
            type="radio"
            name="resume-input-mode"
            value="pasted"
            checked={inputMode === "pasted"}
            disabled={disabled}
            onChange={() => onInputModeChange("pasted")}
          />
          <span>
            <span className="block font-medium">
              Use pasted/uploaded resume input
            </span>
            <span className="block text-xs text-violet-800/75">
              Default. Uses the text box below for this run.
            </span>
          </span>
        </label>
        <label className="flex gap-2 rounded-md border border-violet-200 bg-white px-3 py-2 text-sm text-violet-950">
          <input
            type="radio"
            name="resume-input-mode"
            value="saved_profile"
            checked={inputMode === "saved_profile"}
            disabled={disabled || !canUseProfiles}
            onChange={() => onInputModeChange("saved_profile")}
          />
          <span>
            <span className="block font-medium">
              Use saved structured resume profile
            </span>
            <span className="block text-xs text-violet-800/75">
              Converts profile name, notes, and saved skills only at analysis
              time.
            </span>
          </span>
        </label>
      </div>

      {!configured ? (
        <p className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
          Resume profiles are unavailable in this environment, so use pasted or
          uploaded resume text for this analysis.
        </p>
      ) : null}

      {configured && !isLoaded ? (
        <p className="mt-3 text-xs text-violet-800" role="status">
          Checking your sign-in session…
        </p>
      ) : null}

      {configured && isLoaded && (!session || !userId) ? (
        <p className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
          Sign in to use saved resume profiles. You can still use the pasted or
          uploaded resume input below.
        </p>
      ) : null}

      {canUseProfiles ? (
        <>
          {isLoading ? (
            <p className="mt-3 text-xs text-violet-800" role="status">
              Loading saved resume profiles…
            </p>
          ) : null}

          {loadError ? (
            <p
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
              role="alert"
            >
              Could not load resume profiles right now. Use pasted or uploaded
              resume text below and try profiles again later.
            </p>
          ) : null}

          {!isLoading && !loadError && profiles.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-violet-200 bg-white px-3 py-2 text-xs text-violet-800">
              No saved resume profiles yet. Create one in the Resume profiles
              section, or use pasted/uploaded resume text for this analysis.
            </p>
          ) : null}

          {profiles.length > 0 ? (
            <div className="mt-4">
              <label
                className="block text-sm font-medium text-violet-950"
                htmlFor="resume-profile-preview-select"
              >
                Saved profile for this analysis
              </label>
              <select
                id="resume-profile-preview-select"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={disabled}
                className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Choose a saved profile…</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.profileName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-violet-800/70">
                Selecting a profile keeps the preview visible and does not
                overwrite the resume text box. It only affects analysis when the
                saved-profile mode is selected.
              </p>
            </div>
          ) : null}

          {inputMode === "saved_profile" &&
          profiles.length > 0 &&
          !selectedProfile ? (
            <p
              className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              role="alert"
            >
              Choose a saved structured resume profile before running
              profile-based analysis.
            </p>
          ) : null}

          {selectedProfile ? (
            <div className="mt-4 rounded-lg border border-violet-200 bg-white p-4 text-violet-950">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{selectedProfile.profileName}</p>
                  {selectedProfile.profileDescription ? (
                    <p className="mt-1 text-sm text-violet-900/80">
                      {selectedProfile.profileDescription}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-900">
                  {SOURCE_TYPE_LABELS[selectedProfile.sourceType]}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ResumeProfileSkillPreview
                  title="Extracted skills"
                  skills={selectedProfile.extractedSkills}
                />
                <ResumeProfileSkillPreview
                  title="User-added skills"
                  skills={selectedProfile.userAddedSkills}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

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

type FileUploadFeedback =
  | { kind: "success" }
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
  const [resumeInputMode, setResumeInputMode] =
    useState<ResumeInputMode>("pasted");
  const [selectedResumeProfile, setSelectedResumeProfile] =
    useState<ResumeProfile | null>(null);
  const [jobText, setJobText] = useState("");
  const [resumeFileFeedback, setResumeFileFeedback] =
    useState<FileUploadFeedback | null>(null);
  const [jobFileFeedback, setJobFileFeedback] =
    useState<FileUploadFeedback | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const jobFileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInput, setLastInput] = useState<WebAnalysisInput | null>(null);
  const [result, setResult] = useState<WebAnalysisResult | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>({ kind: "idle" });
  const [sampleInputsLoaded, setSampleInputsLoaded] = useState(false);

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
    jobText.trim().length > 0 &&
    (resumeInputMode === "saved_profile"
      ? Boolean(selectedResumeProfile)
      : resumeText.trim().length > 0) &&
    !isAnalyzing;

  const handleSelectedResumeProfileChange = useCallback(
    (profile: ResumeProfile | null) => {
      setSelectedResumeProfile(profile);
    },
    [],
  );

  function clearAnalysisOutput() {
    setResult(null);
    setLastInput(null);
    setSaveUiState({ kind: "idle" });
  }

  function handleTrySampleInputs() {
    setResumeText(DEMO_ANALYSIS_INPUTS.resumeText);
    setJobText(DEMO_ANALYSIS_INPUTS.jobText);
    setJobTitle(DEMO_ANALYSIS_INPUTS.jobTitle);
    setCompany(DEMO_ANALYSIS_INPUTS.company);
    setSourceUrl(DEMO_ANALYSIS_INPUTS.sourceUrl);
    setNotes(DEMO_ANALYSIS_INPUTS.notes);
    setResumeFileFeedback(null);
    setJobFileFeedback(null);
    resetFileInput(resumeFileInputRef.current);
    resetFileInput(jobFileInputRef.current);
    setResumeInputMode("pasted");
    setSampleInputsLoaded(true);
    setValidationError(null);
    setAnalysisError(null);
    clearAnalysisOutput();
  }

  function handleClearInputs() {
    setResumeText("");
    setResumeInputMode("pasted");
    setJobText("");
    setJobTitle("");
    setCompany("");
    setSourceUrl("");
    setNotes("");
    setResumeFileFeedback(null);
    setJobFileFeedback(null);
    resetFileInput(resumeFileInputRef.current);
    resetFileInput(jobFileInputRef.current);
    setSampleInputsLoaded(false);
    setValidationError(null);
    setAnalysisError(null);
    clearAnalysisOutput();
  }

  function resetFileInput(input: HTMLInputElement | null) {
    if (input) {
      input.value = "";
    }
  }

  async function handleResumeFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    resetFileInput(resumeFileInputRef.current);
    if (!file) {
      return;
    }

    const result = await readTextFile(file);
    if (!result.ok) {
      setResumeFileFeedback({ kind: "error", message: result.message });
      return;
    }

    setResumeText(result.text);
    setResumeInputMode("pasted");
    setResumeFileFeedback({ kind: "success" });
    setSampleInputsLoaded(false);
    setValidationError(null);
    setAnalysisError(null);
  }

  async function handleJobFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    resetFileInput(jobFileInputRef.current);
    if (!file) {
      return;
    }

    const result = await readTextFile(file);
    if (!result.ok) {
      setJobFileFeedback({ kind: "error", message: result.message });
      return;
    }

    setJobText(result.text);
    setJobFileFeedback({ kind: "success" });
    setSampleInputsLoaded(false);
    setValidationError(null);
    setAnalysisError(null);
  }

  async function handleAnalyze() {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobText.trim();
    const profileResumeText = selectedResumeProfile
      ? buildResumeProfileAnalysisText(selectedResumeProfile).trim()
      : "";
    const analysisResumeText =
      resumeInputMode === "saved_profile" ? profileResumeText : trimmedResume;

    if (!analysisResumeText && !trimmedJob) {
      setValidationError(
        resumeInputMode === "saved_profile"
          ? "Choose a saved structured resume profile and add a job description before running analysis."
          : "Add resume text and a job description before running analysis.",
      );
      setAnalysisError(null);
      setResult(null);
      setLastInput(null);
      setSaveUiState({ kind: "idle" });
      return;
    }

    if (!analysisResumeText) {
      setValidationError(
        resumeInputMode === "saved_profile"
          ? "Choose a saved structured resume profile before running analysis."
          : "Resume text is required. Paste skills and experience to compare.",
      );
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
      resumeText: analysisResumeText,
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
    <div
      className={`${boxClass} border-violet-200 bg-violet-50 text-violet-950`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
        Job Fit &amp; Skill-Gap Analyzer
      </p>
      <h2 className="mt-1 text-lg font-semibold text-violet-950">
        Compare one resume to one job description
      </h2>
      <p className="mt-2 text-violet-900/90">
        Paste or upload plain <code className="text-xs">.txt</code> resume and
        job text below. The hosted app sends them for a{" "}
        <strong>one-time rule-based</strong> comparison (keyword taxonomy—not
        AI). <strong>Running analysis does not save anything</strong> until you
        choose Save later—and save stores{" "}
        <strong>structured skills and metadata only</strong>, not the resume or
        job body text. Uploaded files are read in your browser only—not stored
        as files or profiles.
      </p>
      <p className="mt-2 text-sm text-violet-900/80">
        New here? Use <strong>Try sample inputs</strong> for a fictional demo
        resume and job posting—then replace with your own paste or{" "}
        <code className="text-xs">.txt</code> upload when ready.{" "}
        <Link href="/privacy" className="font-medium text-violet-950 underline">
          Privacy &amp; data controls
        </Link>
      </p>

      <div className="mt-4 rounded-md border border-sky-200 bg-sky-50/80 px-3 py-3 text-sky-950">
        <p className="font-medium">Quick try without your own resume</p>
        <p className="mt-1 text-sm text-sky-900/90">
          Load fictional demo text for Alex Rivera and a Demo Robotics
          internship posting. All fields are made up for exploration—not real
          people or employers. Loading sample inputs does <strong>not</strong>{" "}
          run or save analysis; click <strong>Run analysis</strong> when you are
          ready. Replace the text anytime with paste or transient{" "}
          <code className="text-xs">.txt</code> upload.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTrySampleInputs}
            disabled={isAnalyzing}
            className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-sm font-medium text-sky-950 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Try sample inputs
          </button>
          <button
            type="button"
            onClick={handleClearInputs}
            disabled={isAnalyzing}
            className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear inputs
          </button>
        </div>
        {sampleInputsLoaded ? (
          <p className="mt-2 text-xs text-emerald-800" role="status">
            Fictional demo resume, job description, and labels loaded. Click Run
            analysis when ready—nothing is saved until you choose Save after
            results appear.
          </p>
        ) : null}
      </div>

      <fieldset className="mt-5 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Resume text (required for analysis)
        </legend>
        <p className="text-sm text-violet-900/80">
          Paste or upload a plain <code className="text-xs">.txt</code> file
          with skills, experience, and education. Used only for this comparison
          run—it is <strong>not saved</strong> to your account when you click
          Save (only matched/missing skills and optional labels are stored). The
          file itself is not kept as a resume profile.
        </p>
        <ResumeProfileAnalysisGuardrail
          disabled={isAnalyzing}
          inputMode={resumeInputMode}
          onInputModeChange={(mode) => {
            setResumeInputMode(mode);
            setValidationError(null);
            setAnalysisError(null);
            clearAnalysisOutput();
          }}
          onSelectedProfileChange={handleSelectedResumeProfileChange}
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label
            className={`inline-flex items-center rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 ${
              isAnalyzing
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-violet-100"
            }`}
          >
            Upload resume .txt
            <input
              ref={resumeFileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="sr-only"
              disabled={isAnalyzing}
              onChange={(event) => void handleResumeFileUpload(event)}
            />
          </label>
          <span className="text-xs text-violet-800/70">
            Convenience only—read in your browser, not uploaded to cloud
            storage.
          </span>
        </div>
        {resumeFileFeedback?.kind === "success" ? (
          <p className="mt-2 text-xs text-emerald-800" role="status">
            Loaded resume text from file. The file is not saved as a file or
            resume profile.
          </p>
        ) : null}
        {resumeFileFeedback?.kind === "error" ? (
          <p className="mt-2 text-xs text-red-800" role="alert">
            {resumeFileFeedback.message}
          </p>
        ) : null}
        <label className="mt-3 block text-sm">
          <textarea
            value={resumeText}
            onChange={(event) => {
              setResumeText(event.target.value);
              setResumeInputMode("pasted");
              setSampleInputsLoaded(false);
            }}
            rows={5}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Python, SQL, Git, data analysis, REST APIs, teamwork…"
            aria-describedby="resume-text-stats"
          />
          <span
            id="resume-text-stats"
            className="mt-1 block text-xs text-violet-800/70"
          >
            {resumeStats}
          </span>
        </label>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Job description text (required for analysis)
        </legend>
        <p className="text-sm text-violet-900/80">
          Paste or upload a plain <code className="text-xs">.txt</code> file
          with posting requirements or description. Like resume text, this is
          used for analysis in memory and is <strong>not stored</strong> as raw
          job text when you save structured results. The file itself is not kept
          as a saved job posting.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label
            className={`inline-flex items-center rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 ${
              isAnalyzing
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-violet-100"
            }`}
          >
            Upload job .txt
            <input
              ref={jobFileInputRef}
              type="file"
              accept=".txt,text/plain"
              className="sr-only"
              disabled={isAnalyzing}
              onChange={(event) => void handleJobFileUpload(event)}
            />
          </label>
          <span className="text-xs text-violet-800/70">
            Convenience only—read in your browser, not uploaded to cloud
            storage.
          </span>
        </div>
        {jobFileFeedback?.kind === "success" ? (
          <p className="mt-2 text-xs text-emerald-800" role="status">
            Loaded job description text from file. The file is not saved as a
            file or raw job posting.
          </p>
        ) : null}
        {jobFileFeedback?.kind === "error" ? (
          <p className="mt-2 text-xs text-red-800" role="alert">
            {jobFileFeedback.message}
          </p>
        ) : null}
        <label className="mt-3 block text-sm">
          <textarea
            value={jobText}
            onChange={(event) => {
              setJobText(event.target.value);
              setSampleInputsLoaded(false);
            }}
            rows={5}
            className="mt-1 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-zinc-900"
            placeholder="e.g. Intern role requiring Python, SQL, FastAPI, and communication skills…"
            aria-describedby="job-text-stats"
          />
          <span
            id="job-text-stats"
            className="mt-1 block text-xs text-violet-800/70"
          >
            {jobStats}
          </span>
        </label>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-violet-200/80 bg-white/60 p-4">
        <legend className="px-1 text-sm font-medium text-violet-950">
          Labels for saved results (optional)
        </legend>
        <p className="text-sm text-violet-900/80">
          Optional metadata if you save after analysis. Helps you find this
          comparison in your saved list—job title, company, URL, and notes only;
          not resume or job body text.
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
              Short reminders for yourself—deadlines, referrals, or interview
              stage.
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
          {resumeInputMode === "saved_profile"
            ? "Choose a saved structured resume profile and add job description text to enable analysis."
            : "Add both resume and job description text to enable analysis."}
        </p>
      ) : null}

      {isAnalyzing ? (
        <p className="mt-2 text-sm text-violet-900" role="status">
          {resumeInputMode === "saved_profile"
            ? "Comparing saved structured profile skills and job text with the rule-based analyzer…"
            : "Comparing resume and job text with the rule-based analyzer…"}
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
                Click <strong>Save structured results</strong> to store skills
                and metadata—or skip save and run another comparison
              </li>
              <li>
                After saving, use the list below to search, compare, export, or
                delete
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
              Stores matched/missing skills plus any labels you entered—not the
              resume or job description you pasted. You can close this page
              without saving.
            </p>

            {!configured ? (
              <p className="mt-2 text-xs text-zinc-500">
                Supabase is not configured. Add env vars to{" "}
                <code className="text-xs">web/.env.local</code> before saving.
              </p>
            ) : null}

            {!isLoaded ? (
              <p className="mt-2 text-xs text-zinc-500">
                Loading Clerk session…
              </p>
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
              {saveUiState.kind === "saving"
                ? "Saving…"
                : "Save structured results"}
            </button>

            {saveUiState.kind === "success" ? (
              <div
                className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                role="status"
              >
                <p className="font-medium">Structured results saved</p>
                <p className="mt-1">
                  Skills and metadata are in your account. Pasted resume and job
                  text were not stored. Your saved analyses list below should
                  update shortly—you can compare, export, or delete from there.
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
