import { createClient } from "@supabase/supabase-js";
import type { QaConfig } from "../../version23/helpers/config";
import { resolveClerkUserIds } from "../../version23/helpers/supabase-admin";
import {
  readProfileManifest,
  saveProfileManifest,
  type CreatedProfileRecord,
} from "./profile-manifest";

function adminClient(config: QaConfig) {
  return createClient(config.supabaseUrl, config.supabaseElevatedKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function assertCurrentRunRecord(config: QaConfig, record: CreatedProfileRecord): void {
  if (!record.id || !record.expectedOwnerId || !record.profileName.startsWith(`V25 QA ${config.runId} `)) {
    throw new Error("Refusing to cleanup a profile without exact current-run manifest ownership.");
  }
}

export async function discoverProfileForManifest(input: {
  config: QaConfig;
  manifestPath: string;
  ownerLabel: "A" | "B";
  profileName: string;
}): Promise<CreatedProfileRecord> {
  const ownerIds = await resolveClerkUserIds(input.config);
  const expectedOwnerId = ownerIds[input.ownerLabel];
  const supabase = adminClient(input.config);
  const { data, error } = await supabase
    .from("resume_profiles")
    .select("id, clerk_user_id, profile_name, created_at")
    .eq("profile_name", input.profileName)
    .eq("clerk_user_id", expectedOwnerId)
    .limit(2);
  if (error) throw new Error("Unable to discover structured profile for cleanup manifest.");
  if (!data || data.length !== 1) {
    throw new Error("Expected exactly one current-run structured profile for manifest tracking.");
  }
  const record = {
    id: String(data[0].id),
    ownerLabel: input.ownerLabel,
    expectedOwnerId,
    profileName: String(data[0].profile_name),
    createdAt: String(data[0].created_at),
  } satisfies CreatedProfileRecord;
  assertCurrentRunRecord(input.config, record);
  return record;
}

export async function cleanupVersion25Profiles(
  config: QaConfig,
  manifestPath: string,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  const manifest = readProfileManifest(manifestPath, config.runId);
  if (manifest.records.length === 0) {
    saveProfileManifest(manifestPath, { ...manifest, cleanupStatus: "PASS" });
    return;
  }

  const ownerIds = await resolveClerkUserIds(config);
  const supabase = adminClient(config);
  let ok = true;

  for (const record of manifest.records) {
    assertCurrentRunRecord(config, record);
    const expectedOwnerId = ownerIds[record.ownerLabel];
    if (record.expectedOwnerId !== expectedOwnerId) {
      throw new Error("Profile manifest owner does not match the current Clerk QA owner.");
    }
    const lookup = await supabase
      .from("resume_profiles")
      .select("id, clerk_user_id, profile_name")
      .eq("id", record.id)
      .eq("clerk_user_id", expectedOwnerId)
      .eq("profile_name", record.profileName)
      .maybeSingle();
    if (lookup.error) {
      ok = false;
      continue;
    }
    if (!lookup.data) {
      continue;
    }
    if (options.dryRun) {
      continue;
    }
    const deletion = await supabase
      .from("resume_profiles")
      .delete()
      .eq("id", record.id)
      .eq("clerk_user_id", expectedOwnerId)
      .eq("profile_name", record.profileName);
    if (deletion.error) ok = false;
  }

  for (const record of manifest.records) {
    const { data, error } = await supabase
      .from("resume_profiles")
      .select("id")
      .eq("id", record.id)
      .eq("clerk_user_id", record.expectedOwnerId)
      .eq("profile_name", record.profileName)
      .maybeSingle();
    if (error || data) ok = false;
  }

  saveProfileManifest(manifestPath, { ...manifest, cleanupStatus: ok ? "PASS" : "FAIL" });
  if (!ok) throw new Error("Version 25 structured-profile cleanup verification failed.");
}
