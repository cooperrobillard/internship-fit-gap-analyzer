"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  extractDocumentFromFile,
  extractDocumentFromPastedText,
  type DocumentSourceKind,
} from "@/lib/document-extraction";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  createResumeProfile,
  deleteResumeProfile,
  listResumeProfiles,
  normalizeSkillStrings,
  RESUME_PROFILE_SOURCE_TYPES,
  updateResumeProfile,
  type ResumeProfile,
  type ResumeProfileSourceType,
} from "@/lib/supabase/resume-profiles";

const boxClass = "rounded-xl border p-5 text-sm leading-relaxed";
const inputClass =
  "mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";
const textareaClass = `${inputClass} min-h-[4.5rem] resize-y`;
const focusVisibleClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700";
const secondaryButtonClass = `min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusVisibleClass}`;
const primaryButtonClass = `min-h-10 rounded-md bg-sky-800 px-4 py-2 text-sm font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60 ${focusVisibleClass}`;
const textLinkButtonClass = `text-sm font-medium text-sky-800 hover:text-sky-950 ${focusVisibleClass}`;

type WorkspaceMode = "browse" | "create" | "edit";
type CreatePhase = "input" | "review";

function mapExtractionSourceToProfileSource(
  sourceKind: DocumentSourceKind,
): ResumeProfileSourceType {
  if (sourceKind === "pasted") {
    return "pasted";
  }
  if (sourceKind === "txt") {
    return "txt_upload";
  }
  return "imported";
}

const SOURCE_TYPE_LABELS: Record<ResumeProfileSourceType, string> = {
  manual: "Manual",
  pasted: "Pasted text",
  txt_upload: ".txt upload",
  demo: "Demo",
  imported: "Imported",
};

const DEFAULT_SOURCE_TYPE: ResumeProfileSourceType = "manual";

function ResumeProfilesSectionShell({ children }: { children: ReactNode }) {
  return (
    <section id="resume-profiles" className="scroll-mt-24" aria-label="Profiles workspace">
      {children}
    </section>
  );
}

type ProfileFormState = {
  profileName: string;
  profileDescription: string;
  extractedSkillsText: string;
  userAddedSkillsText: string;
  sourceType: ResumeProfileSourceType;
};

const emptyCreateForm = (): ProfileFormState => ({
  profileName: "",
  profileDescription: "",
  extractedSkillsText: "",
  userAddedSkillsText: "",
  sourceType: DEFAULT_SOURCE_TYPE,
});

function formatProfileDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatExactProfileDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

/** Parse comma- or newline-separated skill text into normalized string arrays. */
export function parseSkillTextInput(text: string): string[] {
  return normalizeSkillStrings(
    text
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

function skillsToTextInput(skills: string[]): string {
  return skills.join(", ");
}

function profileToFormState(profile: ResumeProfile): ProfileFormState {
  return {
    profileName: profile.profileName,
    profileDescription: profile.profileDescription ?? "",
    extractedSkillsText: skillsToTextInput(profile.extractedSkills),
    userAddedSkillsText: skillsToTextInput(profile.userAddedSkills),
    sourceType: profile.sourceType,
  };
}

function getCombinedProfileSkills(profile: ResumeProfile): string[] {
  const seen = new Set<string>();
  const combined: string[] = [];

  for (const skill of [...profile.extractedSkills, ...profile.userAddedSkills]) {
    const trimmed = skill.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      continue;
    }
    seen.add(key);
    combined.push(trimmed);
  }

  return combined;
}

function SourceTypeSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: ResumeProfileSourceType;
  onChange: (value: ResumeProfileSourceType) => void;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) =>
        onChange(event.target.value as ResumeProfileSourceType)
      }
      disabled={disabled}
      className={inputClass}
    >
      {RESUME_PROFILE_SOURCE_TYPES.map((type) => (
        <option key={type} value={type}>
          {SOURCE_TYPE_LABELS[type]}
        </option>
      ))}
    </select>
  );
}

function ProfileFormFields({
  formIdPrefix,
  form,
  onChange,
  disabled,
}: {
  formIdPrefix: string;
  form: ProfileFormState;
  onChange: (next: ProfileFormState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm" htmlFor={`${formIdPrefix}-name`}>
        <span className="font-medium text-zinc-900">Profile name</span>
        <input
          id={`${formIdPrefix}-name`}
          type="text"
          value={form.profileName}
          onChange={(event) =>
            onChange({ ...form, profileName: event.target.value })
          }
          disabled={disabled}
          required
          className={inputClass}
          autoComplete="off"
        />
      </label>

      <label className="block text-sm" htmlFor={`${formIdPrefix}-description`}>
        <span className="font-medium text-zinc-900">
          Notes <span className="font-normal text-zinc-500">(optional)</span>
        </span>
        <textarea
          id={`${formIdPrefix}-description`}
          value={form.profileDescription}
          onChange={(event) =>
            onChange({ ...form, profileDescription: event.target.value })
          }
          disabled={disabled}
          rows={3}
          className={textareaClass}
        />
      </label>

      <div>
        <p className="font-medium text-zinc-900">Skills</p>
        <p className="mt-1 text-xs text-zinc-500">
          Separate skills with commas or new lines.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm" htmlFor={`${formIdPrefix}-extracted`}>
            <span className="font-medium text-zinc-800">Skills from the source</span>
            <textarea
              id={`${formIdPrefix}-extracted`}
              value={form.extractedSkillsText}
              onChange={(event) =>
                onChange({ ...form, extractedSkillsText: event.target.value })
              }
              disabled={disabled}
              rows={3}
              className={textareaClass}
              placeholder="Python, SQL, communication"
            />
          </label>

          <label className="block text-sm" htmlFor={`${formIdPrefix}-added`}>
            <span className="font-medium text-zinc-800">Skills you added</span>
            <textarea
              id={`${formIdPrefix}-added`}
              value={form.userAddedSkillsText}
              onChange={(event) =>
                onChange({ ...form, userAddedSkillsText: event.target.value })
              }
              disabled={disabled}
              rows={3}
              className={textareaClass}
              placeholder="Leadership, public speaking"
            />
          </label>
        </div>
      </div>

      <details className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <summary className={`cursor-pointer text-sm font-medium text-zinc-900 ${focusVisibleClass}`}>
          Advanced profile details
        </summary>
        <label className="mt-3 block text-sm" htmlFor={`${formIdPrefix}-source`}>
          <span className="font-medium text-zinc-900">Source type</span>
          <SourceTypeSelect
            id={`${formIdPrefix}-source`}
            value={form.sourceType}
            onChange={(sourceType) => onChange({ ...form, sourceType })}
            disabled={disabled}
          />
        </label>
      </details>
    </div>
  );
}

type DeleteUiState =
  | { kind: "idle" }
  | { kind: "confirming"; profileId: string; profileName: string }
  | { kind: "deleting"; profileId: string }
  | { kind: "error"; message: string };

function ProfileSkillList({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
        No skills have been added to this profile.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {skills.map((skill) => (
        <li
          key={skill}
          className="min-w-0 border-b border-zinc-100 pb-2 text-sm text-zinc-800 before:mr-2 before:text-zinc-400 before:content-['•']"
        >
          <span className="break-words">{skill}</span>
        </li>
      ))}
    </ul>
  );
}

export function ResumeProfilesPanel() {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const { userId } = useAuth();

  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [mode, setMode] = useState<WorkspaceMode>("browse");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<ProfileFormState>(emptyCreateForm);
  const [createPhase, setCreatePhase] = useState<CreatePhase>("input");
  const [createPastedText, setCreatePastedText] = useState("");
  const [createTransientText, setCreateTransientText] = useState<string | null>(null);
  const [createSkillsWarning, setCreateSkillsWarning] = useState<string | null>(null);
  const [isExtractingCreate, setIsExtractingCreate] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editForm, setEditForm] = useState<ProfileFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [deleteUiState, setDeleteUiState] = useState<DeleteUiState>({ kind: "idle" });

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const reloadList = useCallback(() => {
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  function handleLoadRetry() {
    if (!isLoading) {
      reloadList();
    }
  }

  useEffect(() => {
    if (!configured || !isLoaded || !session || !userId) {
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
        setLoadError(null);
        setSelectedProfileId((current) =>
          current && result.profiles.some((profile) => profile.id === current)
            ? current
            : null,
        );
      } else {
        setProfiles([]);
        setLoadError(result.message);
      }

      setIsLoading(false);
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [configured, isLoaded, session, userId, reloadNonce]);

  function resetCreateWorkflow() {
    setCreatePhase("input");
    setCreatePastedText("");
    setCreateTransientText(null);
    setCreateSkillsWarning(null);
    setCreateForm(emptyCreateForm());
    setCreateError(null);
    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }
  }

  function startCreate() {
    setMode("create");
    resetCreateWorkflow();
    setStatusMessage(null);
    setDeleteUiState({ kind: "idle" });
  }

  function cancelCreate() {
    setMode("browse");
    resetCreateWorkflow();
  }

  function beginCreateReview(options: {
    text: string;
    suggestedName: string;
    skills: string[];
    sourceKind: DocumentSourceKind;
  }) {
    setCreateTransientText(options.text);
    setCreateForm({
      profileName: options.suggestedName,
      profileDescription: "",
      extractedSkillsText: skillsToTextInput(options.skills),
      userAddedSkillsText: "",
      sourceType: mapExtractionSourceToProfileSource(options.sourceKind),
    });
    setCreateSkillsWarning(
      options.skills.length === 0
        ? "No taxonomy skills were detected. Add skills manually before saving."
        : null,
    );
    setCreatePhase("review");
    setCreateError(null);
  }

  async function handleCreateFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }
    if (!file) {
      return;
    }

    setCreatePastedText("");
    setIsExtractingCreate(true);
    setCreateError(null);

    const result = await extractDocumentFromFile(file);
    setIsExtractingCreate(false);

    if (result.status === "error") {
      setCreateError(result.message);
      return;
    }

    beginCreateReview({
      text: result.text,
      suggestedName: result.suggestedName,
      skills: result.skills,
      sourceKind: result.sourceKind,
    });
  }

  async function handleExtractCreateFromPaste() {
    setCreateError(null);
    setIsExtractingCreate(true);

    const result = await extractDocumentFromPastedText(createPastedText);
    setIsExtractingCreate(false);

    if (result.status === "error") {
      setCreateError(result.message);
      return;
    }

    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }

    beginCreateReview({
      text: result.text,
      suggestedName: result.suggestedName,
      skills: result.skills,
      sourceKind: result.sourceKind,
    });
  }

  function selectProfile(profileId: string) {
    if (mode === "edit") {
      return;
    }

    setSelectedProfileId(profileId);
    setMode("browse");
    setCreateError(null);
    setEditError(null);
    setStatusMessage(null);
    setDeleteUiState({ kind: "idle" });
  }

  function startEditing(profile: ResumeProfile) {
    setSelectedProfileId(profile.id);
    setMode("edit");
    setEditForm(profileToFormState(profile));
    setEditError(null);
    setStatusMessage(null);
    setDeleteUiState({ kind: "idle" });
  }

  function cancelEditing() {
    setMode("browse");
    setEditForm(null);
    setEditError(null);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    if (!userId || !session) {
      setCreateError("Sign in to create a resume profile.");
      return;
    }

    const trimmedName = createForm.profileName.trim();
    if (!trimmedName) {
      setCreateError("Profile name cannot be empty.");
      return;
    }

    const extractedSkills = parseSkillTextInput(createForm.extractedSkillsText);
    const userAddedSkills = parseSkillTextInput(createForm.userAddedSkillsText);
    if (extractedSkills.length + userAddedSkills.length === 0) {
      setCreateError("Add at least one skill before saving this profile.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setStatusMessage(null);

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await createResumeProfile(supabase, userId, {
      profileName: trimmedName,
      profileDescription: createForm.profileDescription.trim() || null,
      extractedSkills,
      userAddedSkills,
      sourceType: createForm.sourceType,
    });

    setIsCreating(false);

    if (result.status === "error") {
      setCreateError(result.message);
      return;
    }

    resetCreateWorkflow();
    setProfiles((current) => [
      result.profile,
      ...current.filter((profile) => profile.id !== result.profile.id),
    ]);
    setSelectedProfileId(result.profile.id);
    setMode("browse");
    setStatusMessage(`Profile created. “${result.profile.profileName}” is ready to use.`);
    reloadList();
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();

    if (!userId || !session || !selectedProfileId || !editForm) {
      return;
    }

    const trimmedName = editForm.profileName.trim();
    if (!trimmedName) {
      setEditError("Profile name cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    setStatusMessage(null);

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await updateResumeProfile(supabase, userId, selectedProfileId, {
      profileName: trimmedName,
      profileDescription: editForm.profileDescription.trim() || null,
      extractedSkills: parseSkillTextInput(editForm.extractedSkillsText),
      userAddedSkills: parseSkillTextInput(editForm.userAddedSkillsText),
      sourceType: editForm.sourceType,
    });

    setIsSavingEdit(false);

    if (result.status === "error") {
      setEditError(result.message);
      return;
    }

    if (result.status === "not_found") {
      setEditError("This resume profile could not be found. It may have been deleted.");
      cancelEditing();
      reloadList();
      return;
    }

    setProfiles((current) =>
      current.map((profile) => (profile.id === result.profile.id ? result.profile : profile)),
    );
    setSelectedProfileId(result.profile.id);
    setMode("browse");
    setEditForm(null);
    setStatusMessage("Profile updated.");
    reloadList();
  }

  async function handleConfirmDelete(profileId: string) {
    if (!userId || !session) {
      return;
    }

    setDeleteUiState({ kind: "deleting", profileId });

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await deleteResumeProfile(supabase, userId, profileId);

    if (result.status === "success" || result.status === "not_found") {
      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      setSelectedProfileId(null);
      setMode("browse");
      setEditForm(null);
      setEditError(null);
      setDeleteUiState({ kind: "idle" });
      setStatusMessage("Profile deleted.");
      reloadList();
      return;
    }

    setDeleteUiState({ kind: "error", message: result.message });
  }

  if (!configured) {
    return (
      <ResumeProfilesSectionShell>
        <div className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-700`} role="status">
          Resume profiles are temporarily unavailable. You can still run an analysis.
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  if (!isLoaded) {
    return (
      <ResumeProfilesSectionShell>
        <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`} role="status">
          Loading resume profiles…
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  if (!userId || !session) {
    return (
      <ResumeProfilesSectionShell>
        <div className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-700`}>
          Sign in to manage structured resume profiles.
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  const activeProfile = selectedProfile;
  const isFormMode = mode === "create" || mode === "edit";
  const showMobileList = mode === "browse" && !activeProfile;
  const isDeletingSelected =
    deleteUiState.kind === "deleting" && activeProfile?.id === deleteUiState.profileId;
  const showEmptyWorkspaceOnly =
    profiles.length === 0 && !isLoading && !loadError && mode === "browse";

  const profileList = (
    <div className={`${!showMobileList && isFormMode ? "hidden xl:block" : !showMobileList && activeProfile ? "hidden xl:block" : ""}`}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <p className="font-medium text-zinc-950">Your profiles</p>
          <p className="mt-1 text-xs text-zinc-500">
            {profiles.length} reusable {profiles.length === 1 ? "profile" : "profiles"}
          </p>
        </div>
        {mode === "browse" ? (
          <button type="button" onClick={startCreate} className={secondaryButtonClass}>
            New profile
          </button>
        ) : null}
      </div>

      {mode === "edit" ? (
        <p className="mb-3 text-xs text-zinc-600" role="status">
          Save or cancel your changes before choosing another profile.
        </p>
      ) : null}

      {profiles.length > 0 ? (
        <ul className="divide-y divide-zinc-200">
          {profiles.map((profile) => {
            const combinedSkills = getCombinedProfileSkills(profile);
            const isSelected = activeProfile?.id === profile.id;
            const isRowSelectionDisabled = mode === "edit";
            return (
              <li key={profile.id}>
                <button
                  type="button"
                  onClick={() => selectProfile(profile.id)}
                  aria-pressed={isSelected}
                  disabled={isRowSelectionDisabled}
                  aria-disabled={isRowSelectionDisabled}
                  className={`group flex min-h-20 w-full items-stretch gap-3 py-3 text-left disabled:cursor-not-allowed ${
                    isSelected ? "bg-sky-50/70" : "hover:bg-zinc-50"
                  } ${isRowSelectionDisabled && !isSelected ? "disabled:opacity-60" : ""} ${focusVisibleClass}`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-1 shrink-0 rounded-full ${isSelected ? "bg-sky-800" : "bg-transparent group-hover:bg-zinc-300"}`}
                  />
                  <span className="min-w-0 flex-1 pr-3">
                    <span className="block break-words font-medium text-zinc-950">
                      {profile.profileName}
                    </span>
                    {profile.profileDescription ? (
                      <span className="mt-1 line-clamp-1 block break-words text-xs text-zinc-600">
                        {profile.profileDescription}
                      </span>
                    ) : null}
                    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>{combinedSkills.length} {combinedSkills.length === 1 ? "skill" : "skills"}</span>
                      <span>Updated {formatProfileDate(profile.updatedAt)}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : !isLoading && !loadError ? (
        <div className="py-10 text-center">
          <p className="text-base font-semibold text-zinc-950">No profiles yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
            Create a reusable set of skills for future role comparisons. Profiles store structured skills and notes—not raw résumé text.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" onClick={startCreate} className={primaryButtonClass}>
              Create profile
            </button>
            <Link
              href="/dashboard"
              className={`${secondaryButtonClass} inline-flex items-center justify-center`}
            >
              Analyze without a profile
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );

  const createFormView =
    createPhase === "input" ? (
      <div className="space-y-4" aria-busy={isExtractingCreate}>
        <div>
          <button type="button" onClick={cancelCreate} className={`mb-3 xl:hidden ${textLinkButtonClass}`}>
            Back to profiles
          </button>
          <h2 className="text-xl font-semibold text-zinc-950">Create profile from résumé</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Upload or paste a résumé to extract taxonomy skills. The source is processed for this
            request only; saved profiles store structured fields, not the raw résumé.
          </p>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-zinc-900">Upload résumé (PDF, DOCX, TXT, MD)</span>
          <input
            ref={createFileInputRef}
            type="file"
            accept={DOCUMENT_UPLOAD_ACCEPT}
            disabled={isExtractingCreate || isCreating}
            onChange={(event) => void handleCreateFileUpload(event)}
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sky-900`}
          />
        </label>

        {isExtractingCreate ? (
          <p className="text-sm text-sky-800" role="status">
            Extracting résumé text and skills…
          </p>
        ) : null}

        <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
          or paste résumé text
        </p>

        <label className="block text-sm" htmlFor="create-profile-paste">
          <span className="font-medium text-zinc-900">Pasted résumé text</span>
          <textarea
            id="create-profile-paste"
            value={createPastedText}
            onChange={(event) => {
              setCreatePastedText(event.target.value);
              setCreateError(null);
            }}
            disabled={isExtractingCreate || isCreating}
            rows={8}
            className={textareaClass}
            placeholder="Paste skills, experience, and education here."
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleExtractCreateFromPaste()}
            disabled={isExtractingCreate || isCreating || !createPastedText.trim()}
            className={primaryButtonClass}
          >
            {isExtractingCreate ? "Extracting…" : "Review profile"}
          </button>
          <button type="button" onClick={cancelCreate} disabled={isExtractingCreate || isCreating} className={secondaryButtonClass}>
            Cancel
          </button>
        </div>

        {createError ? <p className="text-sm text-red-800" role="alert">{createError}</p> : null}
      </div>
    ) : (
      <form onSubmit={(event) => void handleCreate(event)} aria-busy={isCreating} className="space-y-4">
        <div>
          <button type="button" onClick={cancelCreate} className={`mb-3 xl:hidden ${textLinkButtonClass}`}>
            Back to profiles
          </button>
          <h2 className="text-xl font-semibold text-zinc-950">Review profile</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Edit the suggested name and skills before saving. Only structured profile fields are stored.
          </p>
        </div>

        <label className="block text-sm" htmlFor="create-profile-name">
          <span className="font-medium text-zinc-900">Profile name</span>
          <input
            id="create-profile-name"
            type="text"
            value={createForm.profileName}
            onChange={(event) => setCreateForm({ ...createForm, profileName: event.target.value })}
            disabled={isCreating}
            required
            className={inputClass}
            autoComplete="off"
          />
        </label>

        <label className="block text-sm" htmlFor="create-profile-extracted-skills">
          <span className="font-medium text-zinc-900">Skills found</span>
          <textarea
            id="create-profile-extracted-skills"
            value={createForm.extractedSkillsText}
            onChange={(event) =>
              setCreateForm({ ...createForm, extractedSkillsText: event.target.value })
            }
            disabled={isCreating}
            rows={4}
            className={textareaClass}
            placeholder="Python, SQL, communication"
          />
        </label>

        {createSkillsWarning ? (
          <p className="text-sm text-amber-900" role="status">
            {createSkillsWarning}
          </p>
        ) : null}

        <label className="block text-sm" htmlFor="create-profile-added-skills">
          <span className="font-medium text-zinc-900">
            Additional skills <span className="font-normal text-zinc-500">(optional)</span>
          </span>
          <textarea
            id="create-profile-added-skills"
            value={createForm.userAddedSkillsText}
            onChange={(event) =>
              setCreateForm({ ...createForm, userAddedSkillsText: event.target.value })
            }
            disabled={isCreating}
            rows={3}
            className={textareaClass}
            placeholder="Leadership, public speaking"
          />
        </label>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
          <summary className={`cursor-pointer text-sm font-medium text-zinc-900 ${focusVisibleClass}`}>
            Optional details
          </summary>
          <label className="mt-3 block text-sm" htmlFor="create-profile-description">
            <span className="font-medium text-zinc-900">Notes</span>
            <textarea
              id="create-profile-description"
              value={createForm.profileDescription}
              onChange={(event) =>
                setCreateForm({ ...createForm, profileDescription: event.target.value })
              }
              disabled={isCreating}
              rows={3}
              className={textareaClass}
            />
          </label>
        </details>

        {createTransientText ? (
          <details className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <summary className={`cursor-pointer text-sm font-medium text-zinc-900 ${focusVisibleClass}`}>
              View extracted text
            </summary>
            <p className="mt-2 text-xs text-zinc-600">
              Transient preview only. This text is not saved with the profile.
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-800">
              {createTransientText}
            </pre>
          </details>
        ) : null}

        {createError ? <p className="text-sm text-red-800" role="alert">{createError}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={isCreating} className={primaryButtonClass}>
            {isCreating ? "Saving…" : "Save profile"}
          </button>
          <button type="button" onClick={resetCreateWorkflow} disabled={isCreating} className={secondaryButtonClass}>
            Use a different résumé
          </button>
        </div>
      </form>
    );

  const editFormView = activeProfile && editForm ? (
    <form onSubmit={(event) => void handleSaveEdit(event)} aria-busy={isSavingEdit} className="space-y-4">
      <button type="button" onClick={cancelEditing} className={`xl:hidden ${textLinkButtonClass}`}>
        Back to profiles
      </button>
      <div>
        <h2 className="text-xl font-semibold text-zinc-950">Edit profile</h2>
        <p className="mt-1 break-words text-sm text-zinc-600">{activeProfile.profileName}</p>
      </div>
      <ProfileFormFields formIdPrefix={`edit-${activeProfile.id}`} form={editForm} onChange={setEditForm} disabled={isSavingEdit} />
      {editError ? <p className="text-sm text-red-800" role="alert">{editError}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={isSavingEdit} className={primaryButtonClass}>
          {isSavingEdit ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={cancelEditing} disabled={isSavingEdit} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  ) : null;

  const detailView = activeProfile ? (() => {
    const combinedSkills = getCombinedProfileSkills(activeProfile);
    const isConfirmingDelete =
      deleteUiState.kind === "confirming" && deleteUiState.profileId === activeProfile.id;
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setSelectedProfileId(null)} className={`xl:hidden ${textLinkButtonClass}`}>
          Back to profiles
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold text-zinc-950">{activeProfile.profileName}</h2>
            {activeProfile.profileDescription ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{activeProfile.profileDescription}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-xs text-zinc-500">Updated {formatProfileDate(activeProfile.updatedAt)}</p>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h3 className="font-medium text-zinc-950">Skills</h3>
            <span className="text-xs text-zinc-500">{combinedSkills.length} {combinedSkills.length === 1 ? "skill" : "skills"}</span>
          </div>
          <ProfileSkillList skills={combinedSkills} />
        </div>

        <details className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
          <summary className={`cursor-pointer text-sm font-medium text-zinc-900 ${focusVisibleClass}`}>
            Profile details
          </summary>
          <dl className="mt-3 space-y-2 text-sm text-zinc-700">
            <div className="flex flex-wrap justify-between gap-2"><dt>Source type</dt><dd>{SOURCE_TYPE_LABELS[activeProfile.sourceType]}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>Created</dt><dd>{formatExactProfileDate(activeProfile.createdAt)}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>Updated</dt><dd>{formatExactProfileDate(activeProfile.updatedAt)}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>Skills from the source</dt><dd>{activeProfile.extractedSkills.length}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>Skills you added</dt><dd>{activeProfile.userAddedSkills.length}</dd></div>
          </dl>
        </details>

        <div className="border-t border-zinc-200 pt-4">
          {isConfirmingDelete ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950" aria-busy={isDeletingSelected}>
              <p className="font-medium">Delete “{activeProfile.profileName}”?</p>
              <p className="mt-1 text-sm">This structured skill profile will be removed. Saved job analyses are not affected. This action cannot be undone.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => void handleConfirmDelete(activeProfile.id)} disabled={isDeletingSelected} className={`min-h-10 rounded-md bg-red-800 px-3 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60 ${focusVisibleClass}`}>
                  {isDeletingSelected ? "Deleting…" : "Delete profile"}
                </button>
                <button type="button" onClick={() => setDeleteUiState({ kind: "idle" })} disabled={isDeletingSelected} className={secondaryButtonClass}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => startEditing(activeProfile)} className={secondaryButtonClass}>
                Edit
              </button>
              <button type="button" onClick={() => setDeleteUiState({ kind: "confirming", profileId: activeProfile.id, profileName: activeProfile.profileName })} className={`min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusVisibleClass}`}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  })() : (
    <div className="hidden min-h-64 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 p-6 text-center text-sm text-zinc-500 xl:flex">
      Select a profile to review its skills and details.
    </div>
  );

  return (
    <ResumeProfilesSectionShell>
      <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
        {statusMessage ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}

        {isLoading ? <p className="mb-4 text-sm text-sky-800" role="status">Loading your resume profiles…</p> : null}

        {loadError ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            <p className="font-medium">Could not load resume profiles</p>
            <p className="mt-1">{loadError}</p>
            <button type="button" onClick={handleLoadRetry} disabled={isLoading} className={`mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 ${focusVisibleClass}`}>
              Try again
            </button>
          </div>
        ) : null}

        {deleteUiState.kind === "error" ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            <p className="font-medium">Could not delete resume profile</p>
            <p className="mt-1">{deleteUiState.message}</p>
          </div>
        ) : null}

        {showEmptyWorkspaceOnly ? (
          profileList
        ) : (
          <div className="xl:grid xl:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.35fr)] xl:gap-6">
            {profileList}
            <div className={`${mode === "browse" && !activeProfile ? "hidden xl:block" : ""} min-w-0 xl:border-l xl:border-zinc-200 xl:pl-6`}>
              {mode === "create" ? createFormView : mode === "edit" ? editFormView : detailView}
            </div>
          </div>
        )}
      </div>
    </ResumeProfilesSectionShell>
  );
}
