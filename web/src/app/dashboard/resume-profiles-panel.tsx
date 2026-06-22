"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";
const inputClass =
  "mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";
const textareaClass = `${inputClass} min-h-[4.5rem] resize-y`;

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
    <section
      id="resume-profiles"
      className="scroll-mt-24"
      aria-labelledby="resume-profiles-heading"
    >
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

function SkillTags({ title, skills }: { title: string; skills: string[] }) {
  if (skills.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-zinc-700">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">None listed</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-zinc-700">
        {title} ({skills.length})
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <li
            key={skill}
            className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-800"
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
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
    <div className="space-y-3">
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
          Description{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </span>
        <textarea
          id={`${formIdPrefix}-description`}
          value={form.profileDescription}
          onChange={(event) =>
            onChange({ ...form, profileDescription: event.target.value })
          }
          disabled={disabled}
          rows={2}
          className={textareaClass}
        />
      </label>

      <label className="block text-sm" htmlFor={`${formIdPrefix}-extracted`}>
        <span className="font-medium text-zinc-900">Extracted skills</span>
        <span className="mt-0.5 block text-xs text-zinc-500">
          Comma- or newline-separated skill names
        </span>
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
        <span className="font-medium text-zinc-900">User-added skills</span>
        <span className="mt-0.5 block text-xs text-zinc-500">
          Comma- or newline-separated skill names
        </span>
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

      <label className="block text-sm" htmlFor={`${formIdPrefix}-source`}>
        <span className="font-medium text-zinc-900">Source type</span>
        <SourceTypeSelect
          id={`${formIdPrefix}-source`}
          value={form.sourceType}
          onChange={(sourceType) => onChange({ ...form, sourceType })}
          disabled={disabled}
        />
      </label>
    </div>
  );
}

type DeleteUiState =
  | { kind: "idle" }
  | { kind: "confirming"; profileId: string; profileName: string }
  | { kind: "deleting"; profileId: string }
  | { kind: "error"; message: string };

export function ResumeProfilesPanel() {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const { userId } = useAuth();

  const [profiles, setProfiles] = useState<ResumeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [createForm, setCreateForm] =
    useState<ProfileFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<
    string | null
  >(null);

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProfileFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteUiState, setDeleteUiState] = useState<DeleteUiState>({
    kind: "idle",
  });

  const reloadList = useCallback(() => {
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  function handleLoadRetry() {
    if (isLoading) {
      return;
    }
    reloadList();
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

  function startEditing(profile: ResumeProfile) {
    setEditingProfileId(profile.id);
    setEditForm(profileToFormState(profile));
    setEditError(null);
    setCreateSuccessMessage(null);
    setDeleteUiState({ kind: "idle" });
  }

  function cancelEditing() {
    setEditingProfileId(null);
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

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccessMessage(null);

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await createResumeProfile(supabase, userId, {
      profileName: trimmedName,
      profileDescription: createForm.profileDescription.trim() || null,
      extractedSkills: parseSkillTextInput(createForm.extractedSkillsText),
      userAddedSkills: parseSkillTextInput(createForm.userAddedSkillsText),
      sourceType: createForm.sourceType,
    });

    setIsCreating(false);

    if (result.status === "error") {
      setCreateError(result.message);
      return;
    }

    setCreateForm(emptyCreateForm());
    setCreateSuccessMessage(`"${result.profile.profileName}" was saved.`);
    reloadList();
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();

    if (!userId || !session || !editingProfileId || !editForm) {
      return;
    }

    const trimmedName = editForm.profileName.trim();
    if (!trimmedName) {
      setEditError("Profile name cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await updateResumeProfile(
      supabase,
      userId,
      editingProfileId,
      {
        profileName: trimmedName,
        profileDescription: editForm.profileDescription.trim() || null,
        extractedSkills: parseSkillTextInput(editForm.extractedSkillsText),
        userAddedSkills: parseSkillTextInput(editForm.userAddedSkillsText),
        sourceType: editForm.sourceType,
      },
    );

    setIsSavingEdit(false);

    if (result.status === "error") {
      setEditError(result.message);
      return;
    }

    if (result.status === "not_found") {
      setEditError(
        "This resume profile could not be found. It may have been deleted.",
      );
      cancelEditing();
      reloadList();
      return;
    }

    cancelEditing();
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
      if (editingProfileId === profileId) {
        cancelEditing();
      }
      setDeleteUiState({ kind: "idle" });
      reloadList();
      return;
    }

    setDeleteUiState({
      kind: "error",
      message: result.message,
    });
  }

  if (!configured) {
    return (
      <ResumeProfilesSectionShell>
        <div
          className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-700`}
        >
          <h2
            id="resume-profiles-heading"
            className="font-medium text-zinc-900"
          >
            Resume profiles
          </h2>
          <p className="mt-2">
            Resume profiles are temporarily unavailable. You can still run
            analysis with pasted/uploaded text.
          </p>
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  if (!isLoaded) {
    return (
      <ResumeProfilesSectionShell>
        <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
          <h2
            id="resume-profiles-heading"
            className="font-medium"
            role="status"
          >
            Loading resume profiles…
          </h2>
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  if (!userId || !session) {
    return (
      <ResumeProfilesSectionShell>
        <div
          className={`${boxClass} border-zinc-200 bg-white/70 text-zinc-700`}
        >
          <h2
            id="resume-profiles-heading"
            className="font-medium text-zinc-900"
          >
            Resume profiles
          </h2>
          <p className="mt-2">Sign in to manage structured resume profiles.</p>
        </div>
      </ResumeProfilesSectionShell>
    );
  }

  const isDeleting =
    deleteUiState.kind === "deleting" || deleteUiState.kind === "confirming";

  return (
    <ResumeProfilesSectionShell>
      <div className={`${boxClass} border-zinc-200 bg-white text-zinc-700`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Resume profiles
        </p>
        <h2
          id="resume-profiles-heading"
          className="mt-1 text-xl font-semibold text-zinc-950"
        >
          Resume profiles
        </h2>
        <p className="mt-2 text-zinc-600">
          Save named structured skill profiles with optional notes instead of
          raw resume body text. Select a saved profile in the Analyze section to
          create temporary structured analysis input for that run; this is not
          full resume parsing, raw resume storage, or AI extraction. Create,
          edit, and delete reusable profiles here.
        </p>

        {isLoading ? (
          <p className="mt-4 text-sm text-sky-800" role="status">
            Loading your resume profiles…
          </p>
        ) : null}

        {loadError ? (
          <div
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            <p className="font-medium">Could not load resume profiles</p>
            <p className="mt-1">{loadError}</p>
            <button
              type="button"
              onClick={handleLoadRetry}
              disabled={isLoading}
              className="mt-3 min-h-10 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        ) : null}

        <form
          onSubmit={(event) => void handleCreate(event)}
          className="mt-5 rounded-lg border border-zinc-200 bg-white/70 p-4"
          aria-busy={isCreating}
        >
          <h3 className="font-medium text-zinc-900">Create profile</h3>
          <p className="mt-1 text-xs text-zinc-600">
            Enter skills manually—no PDF/DOCX parsing or AI extraction.
          </p>

          <div className="mt-4">
            <ProfileFormFields
              formIdPrefix="create-profile"
              form={createForm}
              onChange={setCreateForm}
              disabled={isCreating}
            />
          </div>

          {createError ? (
            <p className="mt-3 text-sm text-red-800" role="alert">
              {createError}
            </p>
          ) : null}

          {createSuccessMessage ? (
            <p className="mt-3 text-sm text-emerald-800" role="status">
              {createSuccessMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isCreating}
            className="mt-4 min-h-10 rounded-md bg-sky-800 px-4 py-2 text-sm font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Saving…" : "Create profile"}
          </button>
        </form>

        {!isLoading && !loadError && profiles.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-zinc-700">
            <p className="font-medium text-zinc-900">No resume profiles yet</p>
            <p className="mt-2 text-sm text-zinc-600">
              Create a profile above to save structured skills and notes, not
              raw resume body text. You can then select it as the resume source
              in the Analyze section for a future run; creating one is optional.
            </p>
          </div>
        ) : null}

        {profiles.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {profiles.map((profile) => {
              const isEditing = editingProfileId === profile.id;
              const isConfirmingDelete =
                deleteUiState.kind === "confirming" &&
                deleteUiState.profileId === profile.id;
              const isDeletingThis =
                deleteUiState.kind === "deleting" &&
                deleteUiState.profileId === profile.id;

              return (
                <li
                  key={profile.id}
                  className="rounded-lg border border-zinc-200 bg-white/70 p-4"
                >
                  {isEditing && editForm ? (
                    <form
                      onSubmit={(event) => void handleSaveEdit(event)}
                      aria-busy={isSavingEdit}
                    >
                      <h3 className="font-medium text-zinc-900">
                        Edit profile
                      </h3>
                      <div className="mt-3">
                        <ProfileFormFields
                          formIdPrefix={`edit-${profile.id}`}
                          form={editForm}
                          onChange={setEditForm}
                          disabled={isSavingEdit}
                        />
                      </div>
                      {editError ? (
                        <p className="mt-3 text-sm text-red-800" role="alert">
                          {editError}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={isSavingEdit}
                          className="min-h-10 rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingEdit ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSavingEdit}
                          className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-zinc-900">
                            {profile.profileName}
                          </h3>
                          {profile.profileDescription ? (
                            <p className="mt-1 text-sm text-zinc-600">
                              {profile.profileDescription}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs text-zinc-500">
                          Updated {formatProfileDate(profile.updatedAt)}
                        </p>
                      </div>

                      <p className="mt-2 text-xs text-zinc-600">
                        Source: {SOURCE_TYPE_LABELS[profile.sourceType]} ·
                        Created {formatProfileDate(profile.createdAt)}
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <SkillTags
                          title="Extracted skills"
                          skills={profile.extractedSkills}
                        />
                        <SkillTags
                          title="User-added skills"
                          skills={profile.userAddedSkills}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
                        <button
                          type="button"
                          onClick={() => startEditing(profile)}
                          disabled={isDeleting}
                          className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Edit
                        </button>

                        {isConfirmingDelete ? (
                          <div
                            className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950"
                            aria-busy={isDeletingThis}
                          >
                            <p className="text-sm font-medium">
                              Remove &ldquo;{profile.profileName}&rdquo;?
                            </p>
                            <p className="mt-1 text-xs">
                              This deletes the structured skill list from your
                              account. Your saved job analyses are not affected.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleConfirmDelete(profile.id)
                                }
                                disabled={isDeletingThis}
                                className="min-h-10 rounded-md bg-red-800 px-3 py-2 text-xs font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isDeletingThis ? "Removing…" : "Yes, remove"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteUiState({ kind: "idle" })
                                }
                                disabled={isDeletingThis}
                                className="min-h-10 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteUiState({
                                kind: "confirming",
                                profileId: profile.id,
                                profileName: profile.profileName,
                              })
                            }
                            disabled={isDeleting}
                            className="min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        {deleteUiState.kind === "error" ? (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            <p className="font-medium">Could not delete resume profile</p>
            <p className="mt-1">{deleteUiState.message}</p>
          </div>
        ) : null}
      </div>
    </ResumeProfilesSectionShell>
  );
}
