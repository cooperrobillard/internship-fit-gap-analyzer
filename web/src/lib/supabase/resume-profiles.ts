import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSafeSavedAnalysisErrorMessage,
  isMissingSupabaseConfigError,
  type SupabaseErrorLike,
} from "@/lib/supabase/supabase-errors";

/** Allowed values per resume_profiles_source_type_allowed check constraint. */
export const RESUME_PROFILE_SOURCE_TYPES = [
  "manual",
  "pasted",
  "txt_upload",
  "demo",
  "imported",
] as const;

export type ResumeProfileSourceType = (typeof RESUME_PROFILE_SOURCE_TYPES)[number];

const DEFAULT_SOURCE_TYPE: ResumeProfileSourceType = "manual";

/** Safe select list — structured fields only; no resume_text or raw body text. */
export const RESUME_PROFILE_QUERY_FIELDS =
  "id, clerk_user_id, profile_name, profile_description, extracted_skills, user_added_skills, source_type, created_at, updated_at";

const RESUME_PROFILE_FIELDS = RESUME_PROFILE_QUERY_FIELDS;

/** Supabase row shape (snake_case). Not exposed to UI callers. */
export type ResumeProfileRow = {
  id: string;
  clerk_user_id: string;
  profile_name: string;
  profile_description: string | null;
  extracted_skills: unknown;
  user_added_skills: unknown;
  source_type: string;
  created_at: string;
  updated_at: string;
};

/** App-facing resume profile (camelCase). Structured skills only — no raw resume text. */
export type ResumeProfile = {
  id: string;
  clerkUserId: string;
  profileName: string;
  profileDescription: string | null;
  extractedSkills: string[];
  userAddedSkills: string[];
  sourceType: ResumeProfileSourceType;
  createdAt: string;
  updatedAt: string;
};

export type CreateResumeProfileInput = {
  profileName: string;
  profileDescription?: string | null;
  extractedSkills?: string[];
  userAddedSkills?: string[];
  sourceType?: ResumeProfileSourceType;
};

export type UpdateResumeProfileInput = {
  profileName?: string;
  profileDescription?: string | null;
  extractedSkills?: string[];
  userAddedSkills?: string[];
  sourceType?: ResumeProfileSourceType;
};

export type ListResumeProfilesResult =
  | { status: "success"; profiles: ResumeProfile[] }
  | { status: "error"; message: string };

export type ResumeProfileMutationResult =
  | { status: "success"; profile: ResumeProfile }
  | { status: "error"; message: string };

export type UpdateResumeProfileResult =
  | { status: "success"; profile: ResumeProfile }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type DeleteResumeProfileResult =
  | { status: "success" }
  | { status: "not_found" }
  | { status: "error"; message: string };

type ResumeProfileOperation = "read" | "save" | "delete";

function getSafeResumeProfileErrorMessage(
  operation: ResumeProfileOperation,
  error?: SupabaseErrorLike | null,
  context: { reason?: "session" | "config" | "network" } = {},
): string {
  if (context.reason === "session") {
    return "Your sign-in session is not ready yet. Wait a moment and try again.";
  }

  if (context.reason === "config") {
    return "Resume profiles are not available because Supabase is not configured. Check your Supabase environment variables.";
  }

  if (context.reason === "network") {
    return operation === "delete"
      ? "Could not delete this resume profile. Check your connection and try again."
      : operation === "save"
        ? "Could not save your resume profile. Check your connection and try again."
        : "Could not load your resume profiles. Check your connection and try again.";
  }

  const base = getSafeSavedAnalysisErrorMessage(
    operation === "read" ? "read" : operation === "delete" ? "delete" : "save",
    error,
    context,
  );

  return base
    .replaceAll("analysis", "resume profile")
    .replaceAll("analyses", "resume profiles")
    .replaceAll("saved analyses", "resume profiles")
    .replaceAll("saved analysis", "resume profile");
}

function requireClerkUserId(clerkUserId: string):
  | { ok: true; userId: string }
  | { ok: false; message: string } {
  const userId = clerkUserId.trim();
  if (!userId) {
    return {
      ok: false,
      message: getSafeResumeProfileErrorMessage("read", null, { reason: "session" }),
    };
  }

  return { ok: true, userId };
}

function requireProfileId(profileId: string):
  | { ok: true; id: string }
  | { ok: false; message: string } {
  const id = profileId.trim();
  if (!id) {
    return {
      ok: false,
      message: "A resume profile id is required.",
    };
  }

  return { ok: true, id };
}

function normalizeOptionalDescription(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeProfileName(value: string): string {
  return value.trim();
}

export type ValidateResumeProfileNameResult =
  | { ok: true; profileName: string }
  | { ok: false; error: string };

/** Trim and validate a profile name before create/update. */
export function validateResumeProfileName(name: string): ValidateResumeProfileNameResult {
  const profileName = normalizeProfileName(name);
  if (!profileName) {
    return { ok: false, error: "Profile name cannot be empty." };
  }

  return { ok: true, profileName };
}

/**
 * Normalize skill input to trimmed, de-duplicated strings (case-insensitive).
 * Accepts string arrays or legacy jsonb arrays of { skill, category } objects.
 */
export function normalizeSkillStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Map<string, string>();

  for (const item of value) {
    let skill: string | null = null;

    if (typeof item === "string") {
      skill = item.trim();
    } else if (item && typeof item === "object" && "skill" in item) {
      const raw = (item as { skill: unknown }).skill;
      if (typeof raw === "string") {
        skill = raw.trim();
      }
    }

    if (!skill) {
      continue;
    }

    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, skill);
    }
  }

  return Array.from(seen.values());
}

export function parseResumeProfileSourceType(value: unknown): ResumeProfileSourceType {
  if (typeof value === "string") {
    const normalized = value.trim();
    if ((RESUME_PROFILE_SOURCE_TYPES as readonly string[]).includes(normalized)) {
      return normalized as ResumeProfileSourceType;
    }
  }

  return DEFAULT_SOURCE_TYPE;
}

/** Map a Supabase row to the app-facing ResumeProfile type. */
export function mapResumeProfileRow(row: ResumeProfileRow): ResumeProfile {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    profileName: row.profile_name,
    profileDescription: row.profile_description,
    extractedSkills: normalizeSkillStrings(row.extracted_skills),
    userAddedSkills: normalizeSkillStrings(row.user_added_skills),
    sourceType: parseResumeProfileSourceType(row.source_type),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type BuildResumeProfileInsertRowResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Build the Supabase insert row for createResumeProfile.
 * clerk_user_id always comes from clerkUserId, never from input.
 */
export function buildResumeProfileInsertRow(
  clerkUserId: string,
  input: CreateResumeProfileInput,
): BuildResumeProfileInsertRowResult {
  const nameResult = validateResumeProfileName(input.profileName);
  if (!nameResult.ok) {
    return { ok: false, error: nameResult.error };
  }

  return {
    ok: true,
    row: {
      clerk_user_id: clerkUserId,
      profile_name: nameResult.profileName,
      profile_description: normalizeOptionalDescription(input.profileDescription),
      extracted_skills: normalizeSkillStrings(input.extractedSkills ?? []),
      user_added_skills: normalizeSkillStrings(input.userAddedSkills ?? []),
      source_type: input.sourceType ?? DEFAULT_SOURCE_TYPE,
    },
  };
}

export type BuildResumeProfileUpdatePatchResult =
  | { ok: true; patch: Record<string, unknown> }
  | { ok: false; error: string };

/** Build the Supabase update patch for updateResumeProfile. */
export function buildResumeProfileUpdatePatch(
  input: UpdateResumeProfileInput,
): BuildResumeProfileUpdatePatchResult {
  const patch: Record<string, unknown> = {};

  if (input.profileName !== undefined) {
    const nameResult = validateResumeProfileName(input.profileName);
    if (!nameResult.ok) {
      return { ok: false, error: nameResult.error };
    }

    patch.profile_name = nameResult.profileName;
  }

  if (input.profileDescription !== undefined) {
    patch.profile_description = normalizeOptionalDescription(input.profileDescription);
  }

  if (input.extractedSkills !== undefined) {
    patch.extracted_skills = normalizeSkillStrings(input.extractedSkills);
  }

  if (input.userAddedSkills !== undefined) {
    patch.user_added_skills = normalizeSkillStrings(input.userAddedSkills);
  }

  if (input.sourceType !== undefined) {
    patch.source_type = input.sourceType;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No resume profile fields were provided to update." };
  }

  return { ok: true, patch };
}

/** Alias for normalizeSkillStrings — skill list normalization at the app boundary. */
export const normalizeSkillList = normalizeSkillStrings;

/**
 * List structured resume profiles for the signed-in Clerk user (newest first).
 * Filters by clerk_user_id; RLS also scopes reads on the server.
 */
export async function listResumeProfiles(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<ListResumeProfilesResult> {
  const userResult = requireClerkUserId(clerkUserId);
  if (!userResult.ok) {
    return { status: "error", message: userResult.message };
  }

  try {
    const { data, error } = await supabase
      .from("resume_profiles")
      .select(RESUME_PROFILE_FIELDS)
      .eq("clerk_user_id", userResult.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("read", error),
      };
    }

    return {
      status: "success",
      profiles: ((data ?? []) as ResumeProfileRow[]).map(mapResumeProfileRow),
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("read", null, { reason: "config" }),
      };
    }

    return {
      status: "error",
      message: getSafeResumeProfileErrorMessage("read", null, { reason: "network" }),
    };
  }
}

/**
 * Create a structured resume profile for the signed-in Clerk user.
 * clerk_user_id is always taken from the passed Clerk user id, not from input.
 */
export async function createResumeProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: CreateResumeProfileInput,
): Promise<ResumeProfileMutationResult> {
  const userResult = requireClerkUserId(clerkUserId);
  if (!userResult.ok) {
    return { status: "error", message: userResult.message };
  }

  const rowResult = buildResumeProfileInsertRow(userResult.userId, input);
  if (!rowResult.ok) {
    return { status: "error", message: rowResult.error };
  }

  try {
    const { data, error } = await supabase
      .from("resume_profiles")
      .insert(rowResult.row)
      .select(RESUME_PROFILE_FIELDS)
      .single();

    if (error || !data) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("save", error ?? undefined),
      };
    }

    return {
      status: "success",
      profile: mapResumeProfileRow(data as ResumeProfileRow),
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("save", null, { reason: "config" }),
      };
    }

    return {
      status: "error",
      message: getSafeResumeProfileErrorMessage("save", null, { reason: "network" }),
    };
  }
}

/**
 * Update one structured resume profile owned by the signed-in Clerk user.
 * Matches both id and clerk_user_id; does not allow changing ownership or raw text.
 */
export async function updateResumeProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  profileId: string,
  input: UpdateResumeProfileInput,
): Promise<UpdateResumeProfileResult> {
  const userResult = requireClerkUserId(clerkUserId);
  if (!userResult.ok) {
    return { status: "error", message: userResult.message };
  }

  const idResult = requireProfileId(profileId);
  if (!idResult.ok) {
    return { status: "error", message: idResult.message };
  }

  const patchResult = buildResumeProfileUpdatePatch(input);
  if (!patchResult.ok) {
    return { status: "error", message: patchResult.error };
  }

  try {
    const { data, error } = await supabase
      .from("resume_profiles")
      .update(patchResult.patch)
      .eq("id", idResult.id)
      .eq("clerk_user_id", userResult.userId)
      .select(RESUME_PROFILE_FIELDS)
      .maybeSingle();

    if (error) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("save", error),
      };
    }

    if (!data) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      profile: mapResumeProfileRow(data as ResumeProfileRow),
    };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("save", null, { reason: "config" }),
      };
    }

    return {
      status: "error",
      message: getSafeResumeProfileErrorMessage("save", null, { reason: "network" }),
    };
  }
}

/**
 * Delete one structured resume profile owned by the signed-in Clerk user.
 * Matches both id and clerk_user_id before delete.
 */
export async function deleteResumeProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  profileId: string,
): Promise<DeleteResumeProfileResult> {
  const userResult = requireClerkUserId(clerkUserId);
  if (!userResult.ok) {
    return { status: "error", message: userResult.message };
  }

  const idResult = requireProfileId(profileId);
  if (!idResult.ok) {
    return { status: "not_found" };
  }

  try {
    const { data: existingRow, error: lookupError } = await supabase
      .from("resume_profiles")
      .select("id")
      .eq("id", idResult.id)
      .eq("clerk_user_id", userResult.userId)
      .maybeSingle();

    if (lookupError) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("delete", lookupError),
      };
    }

    if (!existingRow) {
      return { status: "not_found" };
    }

    const { error: deleteError } = await supabase
      .from("resume_profiles")
      .delete()
      .eq("id", idResult.id)
      .eq("clerk_user_id", userResult.userId);

    if (deleteError) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("delete", deleteError),
      };
    }

    return { status: "success" };
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      return {
        status: "error",
        message: getSafeResumeProfileErrorMessage("delete", null, { reason: "config" }),
      };
    }

    return {
      status: "error",
      message: getSafeResumeProfileErrorMessage("delete", null, { reason: "network" }),
    };
  }
}
