import { createClient } from "@supabase/supabase-js";
import type { QaConfig } from "./config";
import { loadClerkQaUserIdsFromEnv } from "./clerk-precheck";
import {
  readManifest,
  saveManifest,
  appendManifestRecord,
  type CreatedRecord,
  type RunManifest,
} from "./manifest";
import { SYNTHETIC_COMPANY } from "./qa-data";

function adminClient(config: QaConfig) {
  return createClient(config.supabaseUrl, config.supabaseElevatedKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type JobAnalysisCleanupRow = {
  id: string;
  job_title: string;
  company: string;
  clerk_user_id: string;
};

export type CleanupSupabaseClient = ReturnType<typeof adminClient>;

export function assertCurrentRunRecordProvenance(
  config: QaConfig,
  record: CreatedRecord,
  row: JobAnalysisCleanupRow,
  ownerIds: { A: string; B: string },
): void {
  const expectedOwnerId = ownerIds[record.ownerLabel];
  if (row.id !== record.id) {
    throw new Error("Refusing cleanup: manifest record ID mismatch.");
  }
  if (row.clerk_user_id !== expectedOwnerId) {
    throw new Error("Refusing cleanup: owner mismatch for manifest record.");
  }
  if (row.company !== SYNTHETIC_COMPANY) {
    throw new Error("Refusing cleanup: unexpected company for manifest record.");
  }
  if (!row.job_title.startsWith(`V23 QA ${config.runId}`)) {
    throw new Error("Refusing cleanup: unexpected run provenance for manifest record.");
  }
}

export async function findRemainingCurrentRunRecordsWithClient(
  config: QaConfig,
  manifest: RunManifest,
  supabase: CleanupSupabaseClient,
  ownerIds: { A: string; B: string },
): Promise<CreatedRecord[]> {
  const remaining: CreatedRecord[] = [];

  for (const record of manifest.records) {
    const expectedOwnerId = ownerIds[record.ownerLabel];
    const lookup = await supabase
      .from("job_analyses")
      .select("id, job_title, company, clerk_user_id")
      .eq("id", record.id)
      .eq("clerk_user_id", expectedOwnerId)
      .maybeSingle();

    if (lookup.error) {
      throw new Error("Unable to verify current-run cleanup residual.");
    }
    if (!lookup.data) {
      continue;
    }

    assertCurrentRunRecordProvenance(
      config,
      record,
      lookup.data as JobAnalysisCleanupRow,
      ownerIds,
    );
    remaining.push(record);
  }

  return remaining;
}

export async function cleanupCurrentRunWithClient(
  config: QaConfig,
  manifestPath: string,
  supabase: CleanupSupabaseClient,
  ownerIds: { A: string; B: string },
  options: { dryRun?: boolean } = {},
): Promise<{ remainingCount: number }> {
  const manifest = readManifest(manifestPath);

  if (manifest.records.length === 0) {
    if (!options.dryRun) {
      saveManifest(manifestPath, {
        ...manifest,
        cleanupStatus: "PASS",
      });
    }
    return { remainingCount: 0 };
  }

  let remaining = await findRemainingCurrentRunRecordsWithClient(
    config,
    manifest,
    supabase,
    ownerIds,
  );

  if (options.dryRun) {
    return { remainingCount: remaining.length };
  }

  if (remaining.length === 0) {
    saveManifest(manifestPath, {
      ...manifest,
      cleanupStatus: "PASS",
    });
    return { remainingCount: 0 };
  }

  let ok = true;

  for (const record of remaining) {
    const ownerId = ownerIds[record.ownerLabel];
    const { error } = await supabase
      .from("job_analyses")
      .delete()
      .eq("id", record.id)
      .eq("clerk_user_id", ownerId)
      .eq("company", SYNTHETIC_COMPANY)
      .like("job_title", `V23 QA ${config.runId}%`);

    if (error) {
      ok = false;
      console.error(
        `Cleanup failed for synthetic ${record.ownerLabel} ${record.id} ${record.title}`,
      );
    }
  }

  remaining = await findRemainingCurrentRunRecordsWithClient(
    config,
    manifest,
    supabase,
    ownerIds,
  );

  if (remaining.length > 0) {
    ok = false;
  }

  saveManifest(manifestPath, {
    ...manifest,
    cleanupStatus: ok ? "PASS" : "FAIL",
  });

  if (!ok) {
    throw new Error(
      `Cleanup failed. Safe retry: npm run qa:version23:cleanup -- --run-id ${config.runId}`,
    );
  }

  return { remainingCount: remaining.length };
}

export async function countSavedAnalysesForOwner(
  config: QaConfig,
  ownerLabel: "A" | "B",
): Promise<number> {
  const ownerIds = loadClerkQaUserIdsFromEnv();
  const supabase = adminClient(config);
  const { count, error } = await supabase
    .from("job_analyses")
    .select("id", { count: "exact", head: true })
    .eq("clerk_user_id", ownerIds[ownerLabel]);

  if (error) {
    throw new Error(
      `Unable to count saved analyses for QA User ${ownerLabel}.`,
    );
  }
  if (count === null || !Number.isInteger(count) || count < 0) {
    throw new Error(
      `Supabase returned an invalid saved-analysis count for QA User ${ownerLabel}.`,
    );
  }
  return count;
}

export async function resolveClerkUserIds(config: QaConfig): Promise<{
  A: string;
  B: string;
}> {
  const headers = { Authorization: `Bearer ${config.clerkSecretKey}` };

  async function one(email: string): Promise<string> {
    const response = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(`Unable to resolve Clerk QA user (${response.status}).`);
    }
    const users = (await response.json()) as Array<{ id: string }>;
    if (users.length !== 1) {
      throw new Error(
        `Expected exactly one Clerk QA user for ${email}; found ${users.length}.`,
      );
    }
    return users[0].id;
  }

  return {
    A: await one(config.userAEmail),
    B: await one(config.userBEmail),
  };
}

function buildUserARecordTitle(
  config: QaConfig,
  index: number,
): { title: string; notes: string | null; missing: number } {
  const number = String(index + 1).padStart(2, "0");
  const suffix =
    index === 15 ? " older-pagination-search-target" : ` A ${number}`;
  const title = `V23 QA ${config.runId}${suffix}`;
  const notes =
    index === 2
      ? "Follow up, high priority"
      : index === 3
        ? 'Contact said "review next week"'
        : index === 4
          ? "Has notes"
          : null;
  const missing = index % 2 === 0 ? 2 : 0;
  return { title, notes, missing };
}

export async function seedAdminRecords(config: QaConfig): Promise<void> {
  if (config.seedMode !== "admin") {
    return;
  }

  const ownerIds = await resolveClerkUserIds(config);
  const supabase = adminClient(config);
  const manifest: RunManifest = { runId: config.runId, records: [] };

  for (let index = 0; index < 22; index += 1) {
    const { title, notes, missing } = buildUserARecordTitle(config, index);
    const createdAt = new Date(Date.now() - index * 60_000).toISOString();
    const number = String(index + 1).padStart(2, "0");
    const record = await insertStructuredRecord({
      supabase,
      clerkUserId: ownerIds.A,
      ownerLabel: "A",
      config,
      title,
      notes,
      missingCount: missing,
      createdAt,
      sourceSuffix: `A/${number}`,
    });
    manifest.records.push(record);
    saveManifest(config.manifestPath, manifest);
  }

  const userBTitle = `V23 QA ${config.runId} B`;
  const userBRecord = await insertStructuredRecord({
    supabase,
    clerkUserId: ownerIds.B,
    ownerLabel: "B",
    config,
    title: userBTitle,
    notes: "User B isolation record",
    missingCount: 2,
    createdAt: new Date(Date.now() - 50 * 60_000).toISOString(),
    sourceSuffix: "B/01",
  });
  manifest.records.push(userBRecord);
  saveManifest(config.manifestPath, manifest);
}

async function insertStructuredRecord(input: {
  supabase: ReturnType<typeof adminClient>;
  clerkUserId: string;
  ownerLabel: "A" | "B";
  config: QaConfig;
  title: string;
  notes: string | null;
  missingCount: number;
  createdAt: string;
  sourceSuffix: string;
}): Promise<CreatedRecord> {
  const run = await input.supabase
    .from("analysis_runs")
    .insert({
      clerk_user_id: input.clerkUserId,
      run_label: `V23 QA ${input.config.runId}`,
      created_at: input.createdAt,
    })
    .select("id")
    .single();
  if (run.error) {
    throw run.error;
  }

  const job = await input.supabase
    .from("job_analyses")
    .insert({
      analysis_run_id: run.data.id,
      clerk_user_id: input.clerkUserId,
      job_title: input.title,
      company: SYNTHETIC_COMPANY,
      source_url: `https://example.invalid/v23/${input.config.runId}/${input.sourceSuffix}`,
      notes: input.notes,
      matched_skills_count: 2,
      missing_skills_count: input.missingCount,
      created_at: input.createdAt,
    })
    .select("id, job_title, company, created_at")
    .single();
  if (job.error) {
    throw job.error;
  }

  await input.supabase.from("matched_skills").insert([
    {
      job_analysis_id: job.data.id,
      clerk_user_id: input.clerkUserId,
      skill: "excel",
      category: "business",
    },
    {
      job_analysis_id: job.data.id,
      clerk_user_id: input.clerkUserId,
      skill: "logistics",
      category: "operations",
    },
  ]);

  if (input.missingCount > 0) {
    await input.supabase.from("skill_gaps").insert([
      {
        job_analysis_id: job.data.id,
        clerk_user_id: input.clerkUserId,
        skill: "forecasting",
        category: "operations",
      },
      {
        job_analysis_id: job.data.id,
        clerk_user_id: input.clerkUserId,
        skill: "sap erp",
        category: "business",
      },
    ]);
  }

  return {
    id: job.data.id,
    ownerLabel: input.ownerLabel,
    title: job.data.job_title,
    company: job.data.company,
    created_at: job.data.created_at,
  };
}

export async function cleanupCurrentRun(
  config: QaConfig,
  options: { dryRun?: boolean } = {},
): Promise<{ remainingCount: number }> {
  const ownerIds = await resolveClerkUserIds(config);
  const supabase = adminClient(config);
  return cleanupCurrentRunWithClient(
    config,
    config.manifestPath,
    supabase,
    ownerIds,
    options,
  );
}

export async function dryRunStaleCleanup(config: QaConfig): Promise<void> {
  const supabase = adminClient(config);
  const ownerIds = await resolveClerkUserIds(config);
  const { data, error } = await supabase
    .from("job_analyses")
    .select("id, job_title, clerk_user_id")
    .eq("company", SYNTHETIC_COMPANY)
    .like("job_title", "V23 QA %")
    .in("clerk_user_id", [ownerIds.A, ownerIds.B])
    .limit(200);

  if (error) {
    throw error;
  }

  console.log(
    `Dry run stale cleanup: found ${data?.length ?? 0} Version 23 QA Company record(s) for configured QA users.`,
  );
}

export async function staleCleanup(config: QaConfig): Promise<void> {
  const supabase = adminClient(config);
  const ownerIds = await resolveClerkUserIds(config);
  const { data, error } = await supabase
    .from("job_analyses")
    .select("id, job_title, clerk_user_id")
    .eq("company", SYNTHETIC_COMPANY)
    .like("job_title", "V23 QA %")
    .in("clerk_user_id", [ownerIds.A, ownerIds.B]);

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const ownerLabel =
      row.clerk_user_id === ownerIds.A
        ? "A"
        : row.clerk_user_id === ownerIds.B
          ? "B"
          : null;
    if (!ownerLabel) {
      continue;
    }
    const { error: deleteError } = await supabase
      .from("job_analyses")
      .delete()
      .eq("id", row.id)
      .eq("clerk_user_id", row.clerk_user_id)
      .eq("company", SYNTHETIC_COMPANY)
      .like("job_title", "V23 QA %");
    if (deleteError) {
      throw deleteError;
    }
  }
}

export async function discoverAndAppendUiRecord(
  config: QaConfig,
  title: string,
): Promise<string> {
  const ownerIds = await resolveClerkUserIds(config);
  const supabase = adminClient(config);
  const { data, error } = await supabase
    .from("job_analyses")
    .select("id, job_title, company, created_at")
    .eq("clerk_user_id", ownerIds.A)
    .eq("company", SYNTHETIC_COMPANY)
    .eq("job_title", title)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`UI-created record not found for title ${title}.`);
  }

  appendManifestRecord(config, {
    id: data.id,
    ownerLabel: "A",
    title: data.job_title,
    company: data.company,
    created_at: data.created_at,
  });
  return data.id;
}

export async function deleteRecordById(
  config: QaConfig,
  ownerLabel: "A" | "B",
  recordId: string,
): Promise<void> {
  const ownerIds = await resolveClerkUserIds(config);
  const supabase = adminClient(config);
  const { error } = await supabase
    .from("job_analyses")
    .delete()
    .eq("id", recordId)
    .eq("clerk_user_id", ownerIds[ownerLabel])
    .eq("company", SYNTHETIC_COMPANY)
    .like("job_title", `V23 QA ${config.runId}%`);
  if (error) {
    throw error;
  }
}
