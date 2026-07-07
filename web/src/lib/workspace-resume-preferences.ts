export type ResumeInputModePreference = "pasted" | "saved_profile";

export type WorkspaceResumePreference = {
  inputMode: ResumeInputModePreference;
  selectedProfileId: string | null;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY_PREFIX = "job-fit:workspace:resume-preference";

function normalizeProfileId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeInputMode(value: unknown): ResumeInputModePreference | null {
  if (value === "pasted" || value === "saved_profile") {
    return value;
  }
  return null;
}

export function workspaceResumePreferenceStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export function loadWorkspaceResumePreference(
  storage: StorageLike,
  userId: string,
): WorkspaceResumePreference | null {
  const raw = storage.getItem(workspaceResumePreferenceStorageKey(userId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      inputMode?: unknown;
      selectedProfileId?: unknown;
    };
    const inputMode = normalizeInputMode(parsed.inputMode);
    if (!inputMode) {
      return null;
    }
    return {
      inputMode,
      selectedProfileId: normalizeProfileId(parsed.selectedProfileId),
    };
  } catch {
    return null;
  }
}

export function saveWorkspaceResumePreference(
  storage: StorageLike,
  userId: string,
  preference: WorkspaceResumePreference,
): void {
  storage.setItem(
    workspaceResumePreferenceStorageKey(userId),
    JSON.stringify({
      inputMode: preference.inputMode,
      selectedProfileId:
        preference.inputMode === "saved_profile"
          ? normalizeProfileId(preference.selectedProfileId)
          : null,
    }),
  );
}

export type WorkspaceResumePreferenceSnapshot = {
  inputMode: ResumeInputModePreference;
  selectedProfileId: string;
};

/** Apply stored preference once profiles are available; no-op when nothing changes. */
export function resolveWorkspaceResumePreferenceAfterProfilesLoad(
  preference: WorkspaceResumePreference | null,
  profiles: ReadonlyArray<{ id: string }>,
  current: WorkspaceResumePreferenceSnapshot,
): WorkspaceResumePreferenceSnapshot {
  if (!preference) {
    return current;
  }

  const profileIds = new Set(profiles.map((profile) => profile.id));
  const preferredProfileId = normalizeProfileId(preference.selectedProfileId);
  const hasPreferredProfile =
    preference.inputMode === "saved_profile" &&
    preferredProfileId !== null &&
    profileIds.has(preferredProfileId);

  let inputMode = current.inputMode;
  if (preference.inputMode === "saved_profile") {
    inputMode = hasPreferredProfile ? "saved_profile" : "pasted";
  } else if (preference.inputMode === "pasted") {
    inputMode = "pasted";
  }

  let selectedProfileId = current.selectedProfileId;
  if (hasPreferredProfile && preferredProfileId) {
    selectedProfileId = preferredProfileId;
  } else if (inputMode === "pasted") {
    selectedProfileId = "";
  } else if (inputMode === "saved_profile" && !profileIds.has(selectedProfileId)) {
    selectedProfileId = "";
  }

  return { inputMode, selectedProfileId };
}

export function workspaceResumePreferenceChanged(
  before: WorkspaceResumePreferenceSnapshot,
  after: WorkspaceResumePreferenceSnapshot,
): boolean {
  return (
    before.inputMode !== after.inputMode ||
    before.selectedProfileId !== after.selectedProfileId
  );
}
