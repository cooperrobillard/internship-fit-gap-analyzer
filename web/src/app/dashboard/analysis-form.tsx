"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  formatTextStats,
} from "@/app/dashboard/analysis-input-helpers";
import { DEMO_ANALYSIS_INPUTS } from "@/lib/demo-inputs";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  extractDocumentFromFile,
  formatSourceKindLabel,
} from "@/lib/document-extraction";
import {
  runAnalysisByMode,
  type SmartAnalysisClientResult,
} from "@/lib/analysis/ai-analysis-client";
import { applyExtractedJobMetadataAutofill } from "@/lib/analysis/job-metadata-autofill";
import { ANALYSIS_COMPLETED_EVENT } from "@/components/tip-jar-nudge";
import type { AnalysisErrorCategory } from "@/lib/analysis/api-analysis-client";
import { mapWebAnalysisToCloudSaveInput } from "@/lib/analysis/to-cloud-save-input";
import type {
  AnalysisSkillWithEvidence,
  UserAnalysisModeChoice,
  WebAnalysisInput,
  WebAnalysisResult,
} from "@/lib/analysis/types";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { saveCloudAnalysis } from "@/lib/supabase/save-analysis";
import {
  listResumeProfiles,
  type ResumeProfile,
} from "@/lib/supabase/resume-profiles";
import { getSafeSavedAnalysisErrorMessage } from "@/lib/supabase/supabase-errors";
import { getWorkspaceProfilePreviewSkills } from "@/lib/workspace-profile-preview";

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

  const description = (profile.profileDescription ?? "").trim();
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

function getCombinedProfileSkills(profile: ResumeProfile): string[] {
  return Array.from(
    new Set(
      [...profile.extractedSkills, ...profile.userAddedSkills]
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
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
  const [retryNonce, setRetryNonce] = useState(0);
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
  }, [canUseProfiles, session, userId, retryNonce]);

  const combinedSkills = selectedProfile
    ? getCombinedProfileSkills(selectedProfile)
    : [];
  const profilePreview = getWorkspaceProfilePreviewSkills(combinedSkills);

  return (
    <div className="space-y-3 text-sm text-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">Resume source</p>
        <Link
          href="/dashboard/profiles"
          className="text-sm font-medium text-sky-800 underline underline-offset-4 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
        >
          Manage profiles
        </Link>
      </div>

      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Resume source"
      >
        <label
          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm ${inputMode === "pasted" ? "border-sky-700 bg-sky-50 text-sky-950 ring-1 ring-sky-200" : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"}`}
        >
          <input
            type="radio"
            name="resume-input-mode"
            value="pasted"
            checked={inputMode === "pasted"}
            disabled={disabled}
            onChange={() => onInputModeChange("pasted")}
          />
          <span className="font-medium">Paste or upload</span>
        </label>
        <label
          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm ${inputMode === "saved_profile" ? "border-sky-700 bg-sky-50 text-sky-950 ring-1 ring-sky-200" : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"}`}
        >
          <input
            type="radio"
            name="resume-input-mode"
            value="saved_profile"
            checked={inputMode === "saved_profile"}
            disabled={disabled || !canUseProfiles}
            onChange={() => onInputModeChange("saved_profile")}
          />
          <span className="font-medium">Saved profile</span>
        </label>
      </div>

      {!configured ? (
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
          Resume profiles are unavailable here. Use pasted or uploaded resume text.
        </p>
      ) : null}

      {configured && !isLoaded ? (
        <p className="text-xs text-sky-800" role="status">
          Checking your sign-in session…
        </p>
      ) : null}

      {configured && isLoaded && (!session || !userId) ? (
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
          Sign in to use saved profiles, or continue with paste/upload.
        </p>
      ) : null}

      {canUseProfiles ? (
        <>
          {isLoading ? (
            <p className="text-xs text-sky-800" role="status">
              Loading saved resume profiles…
            </p>
          ) : null}

          {loadError ? (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
              role="alert"
            >
              <p>Could not load resume profiles.</p>
              <button
                type="button"
                onClick={() => setRetryNonce((nonce) => nonce + 1)}
                disabled={isLoading}
                className="mt-2 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
              >
                Try loading profiles again
              </button>
            </div>
          ) : null}

          {!isLoading && !loadError && profiles.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-200 bg-white px-3 py-2 text-xs text-sky-800">
              No saved profiles yet. Create one or use paste/upload.
            </p>
          ) : null}

          {inputMode === "saved_profile" && profiles.length > 0 ? (
            <div>
              <label
                className="block text-sm font-medium text-sky-950"
                htmlFor="resume-profile-preview-select"
              >
                Saved profile
              </label>
              <select
                id="resume-profile-preview-select"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={disabled}
                className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Choose a saved profile…</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.profileName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {inputMode === "saved_profile" &&
          profiles.length > 0 &&
          !selectedProfile ? (
            <p
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              role="alert"
            >
              Choose a saved profile before running analysis.
            </p>
          ) : null}

          {inputMode === "saved_profile" && selectedProfile ? (
            <div className="max-h-40 overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 text-sky-950">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{selectedProfile.profileName}</p>
                <p className="text-xs text-sky-800/75">
                  {combinedSkills.length} {combinedSkills.length === 1 ? "skill" : "skills"}
                </p>
              </div>
              {combinedSkills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profilePreview.visible.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-sky-950"
                    >
                      {skill}
                    </span>
                  ))}
                  {profilePreview.hiddenCount > 0 ? (
                    <span className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-sky-800/80">
                      +{profilePreview.hiddenCount} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-xs text-sky-800/70">No skills saved on this profile.</p>
              )}
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
  showEvidence = false,
}: {
  title: string;
  skills: AnalysisSkillWithEvidence[];
  emptyMessage: string;
  showEvidence?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-2">
        <h4 className="font-semibold text-zinc-950">{title}</h4>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
          {skills.length}
        </span>
      </div>
      {skills.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {skills.map((item) => (
            <li
              key={`${item.skill}-${item.category}`}
              className="flex gap-3 py-3 text-sm text-zinc-800"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full border border-current" />
              <span className="min-w-0">
                <span className="block break-words font-medium text-zinc-950">
                  {item.skill}
                </span>
                <span className="block break-words text-xs text-zinc-500">
                  {item.category}
                </span>
                {showEvidence && item.evidence ? (
                  <span className="mt-1 block break-words text-xs text-zinc-600">
                    {item.evidence}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type SaveUiState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; jobAnalysisId: string }
  | { kind: "error"; message: string };

type FileUploadFeedback =
  | { kind: "success"; sourceLabel: string }
  | { kind: "error"; message: string };

type AnalysisFormProps = {
  onSaveSuccess?: () => void;
};

function formatCooldownSeconds(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}

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
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const jobFileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<{
    message: string;
    category: AnalysisErrorCategory;
    retryable: boolean;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInput, setLastInput] = useState<WebAnalysisInput | null>(null);
  const [result, setResult] = useState<WebAnalysisResult | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>({ kind: "idle" });
  const [sampleInputsLoaded, setSampleInputsLoaded] = useState(false);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<number | null>(null);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);
  const [analysisMode, setAnalysisMode] =
    useState<UserAnalysisModeChoice>("smart_ai");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [jobMetadataAutofillNotice, setJobMetadataAutofillNotice] = useState(false);

  const isRateLimited = cooldownSecondsRemaining > 0;

  useEffect(() => {
    if (rateLimitRetryAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const remaining = Math.ceil((rateLimitRetryAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownSecondsRemaining(0);
        setRateLimitRetryAt(null);
        window.clearInterval(intervalId);
        return;
      }

      setCooldownSecondsRemaining(remaining);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [rateLimitRetryAt]);

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
    !isAnalyzing &&
    !isRateLimited;

  const handleSelectedResumeProfileChange = useCallback(
    (profile: ResumeProfile | null) => {
      setSelectedResumeProfile(profile);
      if (analysisError) {
        setAnalysisError(null);
      }
    },
    [analysisError],
  );

  function clearAnalysisOutput() {
    setResult(null);
    setLastInput(null);
    setFallbackReason(null);
    setSaveUiState({ kind: "idle" });
  }

  function clearStaleAnalysisError() {
    if (analysisError) {
      setAnalysisError(null);
    }
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

    setIsExtractingResume(true);
    setResumeFileFeedback(null);

    const result = await extractDocumentFromFile(file);
    setIsExtractingResume(false);

    if (result.status === "error") {
      setResumeFileFeedback({ kind: "error", message: result.message });
      return;
    }

    setResumeText(result.text);
    setResumeInputMode("pasted");
    setResumeFileFeedback({
      kind: "success",
      sourceLabel: formatSourceKindLabel(result.sourceKind),
    });
    setSampleInputsLoaded(false);
    setValidationError(null);
    setAnalysisError(null);
    clearAnalysisOutput();
  }

  async function handleJobFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    resetFileInput(jobFileInputRef.current);
    if (!file) {
      return;
    }

    setIsExtractingJob(true);
    setJobFileFeedback(null);

    const result = await extractDocumentFromFile(file);
    setIsExtractingJob(false);

    if (result.status === "error") {
      setJobFileFeedback({ kind: "error", message: result.message });
      return;
    }

    setJobText(result.text);
    setJobFileFeedback({
      kind: "success",
      sourceLabel: formatSourceKindLabel(result.sourceKind),
    });
    setSampleInputsLoaded(false);
    setValidationError(null);
    setAnalysisError(null);
    clearAnalysisOutput();
  }

  function notifyAnalysisCompleted() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ANALYSIS_COMPLETED_EVENT));
    }
  }

  async function handleAnalyze() {
    if (isAnalyzing || isRateLimited) {
      return;
    }
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
    setJobMetadataAutofillNotice(false);
    setIsAnalyzing(true);

    const analysisInput: WebAnalysisInput = {
      resumeText: analysisResumeText,
      jobText: trimmedJob,
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const apiResult: SmartAnalysisClientResult = await runAnalysisByMode(
      analysisMode,
      analysisInput,
    );
    setIsAnalyzing(false);

    if (apiResult.status === "error") {
      const category: AnalysisErrorCategory =
        apiResult.category === "validation" ? "validation" : "unavailable";
      if (apiResult.retryAfterSeconds) {
        setRateLimitRetryAt(Date.now() + apiResult.retryAfterSeconds * 1000);
      }
      if (category === "unavailable") {
        setAnalysisError({
          message: apiResult.message,
          category,
          retryable: true,
        });
      } else {
        setAnalysisError({
          message: apiResult.message,
          category,
          retryable: false,
        });
      }
      return;
    }

    setRateLimitRetryAt(null);
    setCooldownSecondsRemaining(0);
    setLastInput(analysisInput);
    if (apiResult.status === "fallback") {
      setFallbackReason(apiResult.fallbackReason);
      setResult({
        ...apiResult.result,
        fallbackReason: apiResult.fallbackReason,
      });
      notifyAnalysisCompleted();
      return;
    }

    setFallbackReason(null);
    const analysisResult = apiResult.result;
    setResult(analysisResult);

    if (analysisMode === "smart_ai" && analysisResult.jobMetadata) {
      const autofill = applyExtractedJobMetadataAutofill(
        {
          jobTitle,
          company,
          sourceUrl,
          notes,
        },
        analysisResult.jobMetadata,
      );
      if (autofill.filledAny) {
        setJobTitle(autofill.next.jobTitle);
        setCompany(autofill.next.company);
        setSourceUrl(autofill.next.sourceUrl);
        setNotes(autofill.next.notes);
        setJobMetadataAutofillNotice(true);
      }
    }

    notifyAnalysisCompleted();
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

  const hasOptionalDetails = Boolean(
    jobTitle.trim() || company.trim() || sourceUrl.trim() || notes.trim(),
  );

  return (
    <section
      id="analyze"
      className="scroll-mt-24 text-sm leading-relaxed text-zinc-950"
      aria-busy={isAnalyzing}
      aria-labelledby="analysis-inputs-heading"
    >
      <div className="flex flex-col gap-3 border-y border-zinc-200 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTrySampleInputs}
            disabled={isAnalyzing || isRateLimited}
            className="min-h-10 rounded-md border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-950 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
          >
            Use sample inputs
          </button>
          <button
            type="button"
            onClick={handleClearInputs}
            disabled={isAnalyzing || isRateLimited}
            className="min-h-10 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-zinc-600">
          Sample data is fictional; loading it does not run or save.
        </p>
        <details className="max-w-xl text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-sky-900">
            How inputs and saves work
          </summary>
          <div className="mt-2 space-y-1 rounded-md border border-zinc-200 bg-white p-3">
            <p>Smart AI (when enabled) sends transient résumé and job text to OpenAI for the current request. Rule-based analysis uses explicit taxonomy phrases and reviewed aliases.</p>
            <p>
              PDF, DOCX, TXT, and MD uploads are processed transiently for this
              workflow. Files are not saved by the application.
            </p>
            <p>Document extraction is deterministic and not AI-based; scanned PDFs may not be readable.</p>
            <p>Neither mode proves proficiency, evidence strength, or unstated skills. Review results before acting.</p>
            <p>Running an analysis does not save anything. Optional saves store structured skills and metadata, not raw resume or job-description body text.</p>
            <Link href="/privacy" className="font-medium text-sky-800 underline underline-offset-4">Full privacy details</Link>
          </div>
        </details>
      </div>

      {sampleInputsLoaded ? (
        <p className="mt-3 text-xs text-emerald-800" role="status">
          Fictional sample inputs loaded. Run analysis when ready; nothing has been saved.
        </p>
      ) : null}

      <h2 id="analysis-inputs-heading" className="sr-only">
        Analysis inputs
      </h2>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start">
        <fieldset className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm shadow-zinc-200/40">
          <legend className="px-1 text-base font-semibold text-zinc-950">
            1. Add your resume
          </legend>
          <div className="mt-3">
            <ResumeProfileAnalysisGuardrail
              disabled={isAnalyzing || isRateLimited}
              inputMode={resumeInputMode}
              onInputModeChange={(mode) => {
                setResumeInputMode(mode);
                setValidationError(null);
                setAnalysisError(null);
                clearAnalysisOutput();
              }}
              onSelectedProfileChange={handleSelectedResumeProfileChange}
            />
          </div>

          {resumeInputMode === "pasted" ? (
            <>
              <label className="mt-4 block text-sm" htmlFor="resume-text">
                <span className="font-medium text-sky-950">Resume information</span>
              </label>
              <textarea
                id="resume-text"
                value={resumeText}
                onChange={(event) => {
                  setResumeText(event.target.value);
                  setResumeInputMode("pasted");
                  clearStaleAnalysisError();
                  setSampleInputsLoaded(false);
                }}
                rows={10}
                className="mt-1 min-h-64 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-inner shadow-zinc-100"
                placeholder="Paste resume skills, experience, and education here."
                aria-describedby="resume-text-stats"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  className={`inline-flex min-h-10 items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-sky-900 ${
                    isAnalyzing || isRateLimited || isExtractingResume
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-sky-50"
                  }`}
                >
                  Upload resume (PDF, DOCX, TXT, MD)
                  <input
                    ref={resumeFileInputRef}
                    type="file"
                    accept={DOCUMENT_UPLOAD_ACCEPT}
                    className="sr-only"
                    disabled={isAnalyzing || isRateLimited || isExtractingResume}
                    onChange={(event) => void handleResumeFileUpload(event)}
                  />
                </label>
                <span id="resume-text-stats" className="text-xs text-sky-800/70">
                  {resumeStats}
                </span>
              </div>
              {isExtractingResume ? (
                <p className="mt-2 text-xs text-sky-800" role="status">
                  Extracting resume text…
                </p>
              ) : null}
              {resumeFileFeedback?.kind === "success" ? (
                <p className="mt-2 text-xs text-emerald-800" role="status">
                  Resume text loaded from {resumeFileFeedback.sourceLabel}.
                </p>
              ) : null}
              {resumeFileFeedback?.kind === "error" ? (
                <p className="mt-2 text-xs text-red-800" role="alert">
                  {resumeFileFeedback.message}
                </p>
              ) : null}
              {resumeText.trim() ? (
                <p className="mt-3 text-xs text-zinc-600">
                  Want a reusable structured profile?{" "}
                  <Link
                    href="/dashboard/profiles"
                    className="font-medium text-sky-800 underline underline-offset-4 hover:text-sky-900"
                  >
                    Create one from your résumé
                  </Link>
                  .
                </p>
              ) : null}
            </>
          ) : null}
        </fieldset>

        <fieldset className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm shadow-zinc-200/40">
          <legend className="px-1 text-base font-semibold text-zinc-950">
            2. Add a job description
          </legend>
          <label className="mt-3 block text-sm" htmlFor="job-text">
            <span className="font-medium text-sky-950">Job description</span>
          </label>
          <textarea
            id="job-text"
            value={jobText}
            onChange={(event) => {
              setJobText(event.target.value);
              clearStaleAnalysisError();
              setSampleInputsLoaded(false);
            }}
            rows={10}
            className="mt-1 min-h-64 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-inner shadow-zinc-100"
            placeholder="Paste the role requirements or posting description here."
            aria-describedby="job-text-stats"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label
              className={`inline-flex min-h-10 items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-sky-900 ${
                isAnalyzing || isRateLimited || isExtractingJob
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-sky-50"
              }`}
            >
              Upload job description (PDF, DOCX, TXT, MD)
              <input
                ref={jobFileInputRef}
                type="file"
                accept={DOCUMENT_UPLOAD_ACCEPT}
                className="sr-only"
                disabled={isAnalyzing || isRateLimited || isExtractingJob}
                onChange={(event) => void handleJobFileUpload(event)}
              />
            </label>
            <span id="job-text-stats" className="text-xs text-sky-800/70">
              {jobStats}
            </span>
          </div>
          {isExtractingJob ? (
            <p className="mt-2 text-xs text-sky-800" role="status">
              Extracting job description text…
            </p>
          ) : null}
          {jobFileFeedback?.kind === "success" ? (
            <p className="mt-2 text-xs text-emerald-800" role="status">
              Job description loaded from {jobFileFeedback.sourceLabel}.
            </p>
          ) : null}
          {jobFileFeedback?.kind === "error" ? (
            <p className="mt-2 text-xs text-red-800" role="alert">
              {jobFileFeedback.message}
            </p>
          ) : null}
        </fieldset>
      </div>

      <details className="mt-4 rounded-lg border border-zinc-200 bg-white/70 p-4">
        <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-sky-950">
          <span>Optional job details</span>
          {hasOptionalDetails ? <span className="text-xs text-emerald-800">Details added</span> : null}
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-sky-950">Job title</span>
            <input type="text" value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); clearStaleAnalysisError(); }} className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900" placeholder="Software Engineering Intern" autoComplete="organization-title" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-sky-950">Company</span>
            <input type="text" value={company} onChange={(event) => { setCompany(event.target.value); clearStaleAnalysisError(); }} className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900" placeholder="Acme Corp" autoComplete="organization" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-sky-950">Source URL</span>
            <input type="url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); clearStaleAnalysisError(); }} className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900" placeholder="https://careers.example.com/jobs/123" inputMode="url" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-sky-950">Notes</span>
            <textarea value={notes} onChange={(event) => { setNotes(event.target.value); clearStaleAnalysisError(); }} rows={2} className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900" placeholder="Deadline, referral, or reminder" />
          </label>
        </div>
      </details>

      {jobMetadataAutofillNotice ? (
        <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900" role="status">
          Smart AI filled optional job details. Review before saving.
        </p>
      ) : null}

      {validationError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          <p className="font-medium">Cannot run analysis yet</p>
          <p className="mt-1">{validationError}</p>
        </div>
      ) : null}

      {analysisError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          <p className="font-medium">{analysisError.category === "validation" ? "Check the analysis inputs" : analysisError.category === "rate_limited" ? "Analysis is cooling down" : "Analysis could not be completed"}</p>
          <p className="mt-1">{analysisError.message}</p>
          {analysisError.retryable && !isRateLimited ? (
            <button type="button" onClick={() => void handleAnalyze()} disabled={isAnalyzing || isRateLimited} className="mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white">
              Try analysis again
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200 pt-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-zinc-900">Analysis mode</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50">
            <input
              type="radio"
              name="analysis-mode"
              value="smart_ai"
              checked={analysisMode === "smart_ai"}
              onChange={() => setAnalysisMode("smart_ai")}
              disabled={isAnalyzing}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Smart AI analysis <span className="font-normal text-sky-800">(recommended)</span>
              </span>
              <span className="block text-xs text-zinc-600">
                Sends transient résumé and job text to OpenAI for richer skill extraction. Falls back to rule-based analysis when unavailable.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50">
            <input
              type="radio"
              name="analysis-mode"
              value="rule_based"
              checked={analysisMode === "rule_based"}
              onChange={() => setAnalysisMode("rule_based")}
              disabled={isAnalyzing}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">Rule-based analysis</span>
              <span className="block text-xs text-zinc-600">
                Deterministic taxonomy matcher only. No OpenAI call.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="button" onClick={() => void handleAnalyze()} disabled={!canRunAnalysis} className="min-h-11 rounded-md bg-sky-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-sky-800 sm:w-auto">
          {isAnalyzing ? "Running analysis…" : isRateLimited ? "Analysis temporarily paused" : "Run analysis"}
        </button>
        <p className="text-xs text-zinc-600">Running analysis does not save anything.</p>
        </div>
      </div>

      {!canRunAnalysis && !isAnalyzing && !validationError && !isRateLimited ? (
        <p className="mt-2 text-xs text-sky-800/80">
          {resumeInputMode === "saved_profile" ? "Choose a saved profile and add a job description to enable analysis." : "Add resume information and a job description to enable analysis."}
        </p>
      ) : null}

      {isRateLimited ? (
        <p className="mt-2 text-sm text-sky-900" role="status">
          You can try running analysis again in about {formatCooldownSeconds(cooldownSecondsRemaining)}. Your inputs are still here.
        </p>
      ) : null}

      {isAnalyzing ? (
        <p className="mt-2 text-sm text-sky-900" role="status">
          {resumeInputMode === "saved_profile" ? "Comparing saved profile skills and job text…" : "Comparing resume and job text…"}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-zinc-800 shadow-sm shadow-zinc-200/50 sm:p-5" role="status" aria-live="polite">
          {result.analysisMode === "rule_based_fallback" || fallbackReason ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
              <p className="font-medium">Rule-based fallback used</p>
              <p className="mt-1">
                {result.fallbackReason ?? fallbackReason ?? "Smart AI was unavailable, so the deterministic analyzer produced this result instead."}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950">
                {result.analysisMode === "ai_smart" ? "Smart AI analysis complete" : "Analysis complete"}
              </h3>
              {jobTitle.trim() || company.trim() ? (
                <p className="mt-1 break-words text-sm font-medium text-zinc-700">{[jobTitle.trim(), company.trim()].filter(Boolean).join(" · ")}</p>
              ) : null}
              {result.analysisMode !== "ai_smart" ? (
                <p className="mt-2 text-sm text-zinc-600">{result.summary}</p>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">
                  Smart AI may make mistakes. Review before acting.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-900">Matched {result.matchedSkillsCount}</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-900">Missing {result.missingSkillsCount}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <SkillList title="Matched skills" skills={result.matchedSkills} emptyMessage="No matched skills found." />
            <SkillList title="Missing skills" skills={result.missingSkills} emptyMessage="No missing skills found." />
          </div>

          <details className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
            <summary className="cursor-pointer font-medium text-sky-900">How this result was generated</summary>
            <p className="mt-2">
              {result.analysisMode === "ai_smart"
                ? "Smart AI analyzed transient résumé and job text, then surfaced matched and missing skills in the same layout as rule-based analysis. This is planning guidance, not a hiring decision."
                : "Results come from explicit taxonomy phrases and reviewed aliases using rule-based matching. The analyzer does not infer proficiency, evidence strength, or unstated skills; this is planning guidance, not a hiring decision."}
            </p>
          </details>

          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-sm font-semibold text-zinc-900">{saveUiState.kind === "success" ? "Structured result saved" : "Not saved"}</p>
            <p className="mt-1 text-xs text-zinc-600">Save structured skills and metadata when this result is useful. Raw resume and job-description body text are not part of the saved record.</p>

            {!configured ? <p className="mt-2 text-xs text-zinc-500">Saving is temporarily unavailable. You can still review results.</p> : null}
            {!isLoaded ? <p className="mt-2 text-xs text-zinc-500">Checking your sign-in session…</p> : null}
            {isLoaded && !userId ? <p className="mt-2 text-xs text-zinc-500">Sign in to save this analysis.</p> : null}
            {saveUiState.kind === "saving" ? <p className="mt-3 rounded-md border border-zinc-200 bg-sky-50 px-3 py-2 text-sm text-sky-900" role="status">Saving to your account…</p> : null}

            <button type="button" onClick={() => void handleSavePrototype()} disabled={!canAttemptSave || saveUiState.kind === "saving"} className="mt-3 min-h-10 rounded-md border border-sky-800 bg-white px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white">
              {saveUiState.kind === "saving" ? "Saving…" : saveUiState.kind === "error" ? "Try saving again" : "Save result"}
            </button>

            {saveUiState.kind === "success" ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
                <p className="font-medium">Structured result saved</p>
                <p className="mt-1">Skills and metadata are in your account. Pasted resume and job text were not stored.</p>
                <Link href="/dashboard/saved" className="mt-2 inline-flex font-medium text-emerald-950 underline underline-offset-4">View saved analyses</Link>
              </div>
            ) : null}

            {saveUiState.kind === "error" ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                <p className="font-medium">Could not save analysis</p>
                <p className="mt-1">{saveUiState.message}</p>
                <p className="mt-2 text-xs">Your result is still here. Try saving again when ready.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
