#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readManifest, saveManifest } from "../helpers/manifest.ts";
import { SYNTHETIC_COMPANY } from "../helpers/qa-data.ts";
import {
  assertCurrentRunRecordProvenance,
  cleanupCurrentRunWithClient,
  findRemainingCurrentRunRecordsWithClient,
} from "../helpers/supabase-admin.ts";

const supabaseAdminSource = readFileSync(
  new URL("../helpers/supabase-admin.ts", import.meta.url),
  "utf8",
);

const runId = "cleanup-regression-run";
const qaConfig = {
  runId,
  baseUrl: "https://jobfit.cooperrobillard.com",
  baseHost: "jobfit.cooperrobillard.com",
  renderHealthUrl: "https://example.invalid/health",
  expectedCommit: "abc123",
  vercelToken: "token",
  vercelTeamId: "team",
  clerkSecretKey: "sk_test_fake",
  clerkPublishableKey: "pk_test_fake",
  userAEmail: "qa-a@example.invalid",
  userBEmail: "qa-b@example.invalid",
  supabaseUrl: "https://example.invalid",
  supabaseElevatedKey: "elevated-key",
  seedMode: "admin",
  manifestPath: "",
  reportPath: "",
  resultsPath: "",
  runMetaPath: "",
};

const ownerIds = { A: "owner_a", B: "owner_b" };

const manifestRecord = {
  id: "analysis-1",
  ownerLabel: "A",
  title: `V23 QA ${runId} A 01`,
  company: SYNTHETIC_COMPANY,
  created_at: "2026-07-02T00:00:00.000Z",
};

function createMockSupabase(initialRows) {
  const rows = [...initialRows];
  const deleteFilters = [];

  const applyFilters = (source, filters) =>
    source.filter((row) =>
      Object.entries(filters).every(([column, value]) => {
        if (column.endsWith("_like")) {
          const field = column.replace(/_like$/, "");
          return String(row[field]).startsWith(value.replace(/%$/, ""));
        }
        return String(row[column]) === value;
      }),
    );

  const buildSelectQuery = () => {
    const filters = {};
    return {
      select: (columns) => {
        void columns;
        return {
          eq: (column, value) => {
            filters[column] = value;
            return {
              eq: (nextColumn, nextValue) => {
                filters[nextColumn] = nextValue;
                return {
                  maybeSingle: async () => {
                    const matches = applyFilters(rows, filters);
                    return { data: matches[0] ?? null, error: null };
                  },
                };
              },
              maybeSingle: async () => {
                const matches = applyFilters(rows, filters);
                return { data: matches[0] ?? null, error: null };
              },
            };
          },
        };
      },
    };
  };

  const buildDeleteQuery = () => {
    const filters = {};
    const chain = {
      eq: (column, value) => {
        filters[column] = value;
        return chain;
      },
      like: (column, value) => {
        filters[`${column}_like`] = value;
        deleteFilters.push({ ...filters });
        for (const row of applyFilters(rows, filters)) {
          const index = rows.findIndex((item) => item.id === row.id);
          if (index >= 0) rows.splice(index, 1);
        }
        return { error: null };
      },
    };
    return chain;
  };

  return {
    from: (table) => {
      assert.equal(table, "job_analyses", "mock client only supports job_analyses");
      return {
        select: (columns) => buildSelectQuery().select(columns),
        delete: () => buildDeleteQuery(),
      };
    },
    deleteFilters,
    remainingRows: () => [...rows],
  };
}

async function runCleanupVerificationRegression() {
  assert(
    !supabaseAdminSource.includes('.in(\n      "id"'),
    "current-run cleanup verification must not rely on broad in() residual checks",
  );
  assert(
    supabaseAdminSource.includes("findRemainingCurrentRunRecordsWithClient"),
    "cleanup must share exact residual verification helper",
  );
  assert(
    supabaseAdminSource.includes('.eq("id", record.id)') &&
      supabaseAdminSource.includes('.like("job_title", `V23 QA ${config.runId}%`)'),
    "cleanup must combine exact ID filters with run-scoped title guard",
  );

  const manifestDir = mkdtempSync(join(tmpdir(), "v23-manifest-"));
  const manifestPath = join(manifestDir, `version23-manifest-${runId}.json`);
  saveManifest(manifestPath, { runId, records: [manifestRecord] });
  qaConfig.manifestPath = manifestPath;

  const emptyDb = createMockSupabase([]);
  const emptyRemaining = await findRemainingCurrentRunRecordsWithClient(
    qaConfig,
    readManifest(manifestPath),
    emptyDb,
    ownerIds,
  );
  assert.equal(emptyRemaining.length, 0);
  const dryRunEmpty = await cleanupCurrentRunWithClient(
    qaConfig,
    manifestPath,
    emptyDb,
    ownerIds,
    { dryRun: true },
  );
  assert.equal(dryRunEmpty.remainingCount, 0);
  assert.equal(readManifest(manifestPath).records.length, 1, "manifest must remain for audit");

  const oneRowDb = createMockSupabase([
    {
      id: manifestRecord.id,
      job_title: manifestRecord.title,
      company: SYNTHETIC_COMPANY,
      clerk_user_id: ownerIds.A,
    },
  ]);
  const dryRunOne = await cleanupCurrentRunWithClient(
    qaConfig,
    manifestPath,
    oneRowDb,
    ownerIds,
    { dryRun: true },
  );
  assert.equal(dryRunOne.remainingCount, 1);
  assert.equal(oneRowDb.remainingRows().length, 1, "dry-run must not delete rows");

  await cleanupCurrentRunWithClient(
    qaConfig,
    manifestPath,
    oneRowDb,
    ownerIds,
  );
  assert.equal(oneRowDb.remainingRows().length, 0);
  assert.equal(readManifest(manifestPath).records.length, 1);
  assert.equal(readManifest(manifestPath).cleanupStatus, "PASS");
  assert.deepEqual(oneRowDb.deleteFilters, [
    {
      id: manifestRecord.id,
      clerk_user_id: ownerIds.A,
      company: SYNTHETIC_COMPANY,
      job_title_like: `V23 QA ${runId}%`,
    },
  ]);

  saveManifest(manifestPath, { runId, records: [manifestRecord], cleanupStatus: "NOT RUN" });
  assert.throws(
    () =>
      assertCurrentRunRecordProvenance(
        qaConfig,
        manifestRecord,
        {
          id: manifestRecord.id,
          job_title: manifestRecord.title,
          company: SYNTHETIC_COMPANY,
          clerk_user_id: ownerIds.B,
        },
        ownerIds,
      ),
    /owner mismatch/,
  );

  const wrongCompanyDb = createMockSupabase([
    {
      id: manifestRecord.id,
      job_title: manifestRecord.title,
      company: "Other Company",
      clerk_user_id: ownerIds.A,
    },
  ]);
  await assert.rejects(
    () =>
      findRemainingCurrentRunRecordsWithClient(
        qaConfig,
        readManifest(manifestPath),
        wrongCompanyDb,
        ownerIds,
      ),
    /unexpected company/,
  );

  const wrongRunDb = createMockSupabase([
    {
      id: manifestRecord.id,
      job_title: "V23 QA other-run A 01",
      company: SYNTHETIC_COMPANY,
      clerk_user_id: ownerIds.A,
    },
  ]);
  await assert.rejects(
    () =>
      findRemainingCurrentRunRecordsWithClient(
        qaConfig,
        readManifest(manifestPath),
        wrongRunDb,
        ownerIds,
      ),
    /unexpected run provenance/,
  );

  saveManifest(manifestPath, { runId, records: [manifestRecord], cleanupStatus: "NOT RUN" });
  const alreadyDeletedDb = createMockSupabase([]);
  const idempotent = await cleanupCurrentRunWithClient(
    qaConfig,
    manifestPath,
    alreadyDeletedDb,
    ownerIds,
  );
  assert.equal(idempotent.remainingCount, 0);
  assert.equal(readManifest(manifestPath).cleanupStatus, "PASS");

  assertCurrentRunRecordProvenance(
    qaConfig,
    manifestRecord,
    {
      id: manifestRecord.id,
      job_title: manifestRecord.title,
      company: SYNTHETIC_COMPANY,
      clerk_user_id: ownerIds.A,
    },
    ownerIds,
  );

  rmSync(manifestDir, { recursive: true, force: true });
}

await runCleanupVerificationRegression();
console.log("Version 23 cleanup-verification regression tests passed.");
