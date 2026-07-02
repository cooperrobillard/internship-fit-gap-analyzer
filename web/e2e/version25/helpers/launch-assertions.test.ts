import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCanonicalBaseUrl,
  assertCanonicalUrl,
  assertExactSitemap,
  assertExactSkillSets,
  assertMetadataSnapshot,
  assertNoIndex,
  assertRobotsTxt,
  assertSafeUiText,
  CANONICAL_ORIGIN,
  EXPECTED_HOME_CANONICAL,
  EXPECTED_PRIVACY_CANONICAL,
  extractSitemapUrls,
  normalizeSkillSet,
} from "./launch-assertions";
import { HOME_DESCRIPTION, SITE_NAME } from "../../../src/lib/site-config";
import {
  assertManifestRecordProvenance,
  cleanupVersion25ProfilesWithClient,
  resolveManifestOwnerId,
} from "./profile-admin";
import {
  emptyProfileManifest,
  saveProfileManifest,
  type CreatedProfileRecord,
} from "./profile-manifest";
import type { QaConfig } from "../../version23/helpers/config";

const helperDir = dirname(fileURLToPath(import.meta.url));
const profileAdminSource = readFileSync(resolve(helperDir, "profile-admin.ts"), "utf8");

function throws(fn: () => void, message: RegExp) {
  assert.throws(fn, message);
}

assertCanonicalBaseUrl(CANONICAL_ORIGIN);
throws(() => assertCanonicalBaseUrl("https://internship-fit-gap-analyzer.vercel.app"), /QA_BASE_URL/);

assertCanonicalUrl("https://jobfit.cooperrobillard.com/", EXPECTED_HOME_CANONICAL);
assertCanonicalUrl("https://jobfit.cooperrobillard.com/privacy/", EXPECTED_PRIVACY_CANONICAL);
throws(() => assertCanonicalUrl("https://localhost:3000/", EXPECTED_HOME_CANONICAL), /Unexpected canonical/);

const sitemap = `<urlset><url><loc>${EXPECTED_PRIVACY_CANONICAL}</loc></url><url><loc>${EXPECTED_HOME_CANONICAL}</loc></url></urlset>`;
assert.deepEqual(extractSitemapUrls(sitemap), [EXPECTED_HOME_CANONICAL, EXPECTED_PRIVACY_CANONICAL].sort());
assertExactSitemap(sitemap);
throws(() => assertExactSitemap(`<urlset><url><loc>${EXPECTED_HOME_CANONICAL}</loc></url></urlset>`), /Unexpected sitemap/);

assertRobotsTxt(`User-agent: *\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /sign-in\nDisallow: /sign-up\nDisallow: /__clerk/\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
throws(() => assertRobotsTxt("User-agent: *"), /canonical sitemap/);

assertNoIndex({ robots: "noindex, nofollow" }, "/sign-in");
throws(() => assertNoIndex({ robots: "index" }, "/sign-in"), /noindex/);

assertMetadataSnapshot({
  expectedCanonical: EXPECTED_HOME_CANONICAL,
  expectedTitle: SITE_NAME,
  expectedDescription: HOME_DESCRIPTION,
  metadata: {
    canonical: EXPECTED_HOME_CANONICAL,
    openGraphTitle: SITE_NAME,
    openGraphDescription: HOME_DESCRIPTION,
    openGraphUrl: EXPECTED_HOME_CANONICAL,
    openGraphImage: `${CANONICAL_ORIGIN}/opengraph-image`,
    twitterCard: "summary_large_image",
    twitterTitle: SITE_NAME,
    twitterDescription: HOME_DESCRIPTION,
    twitterImage: `${CANONICAL_ORIGIN}/twitter-image`,
  },
});

assert.notEqual(HOME_DESCRIPTION, "Rule-based career planning workspace for comparing résumé skills with job descriptions, reviewing skill gaps, and working with structured saved results.");

assert.deepEqual(normalizeSkillSet([" Excel ", "excel", "Logistics"]), ["excel", "logistics"]);
assertExactSkillSets({
  matched: ["Procurement", "logistics", "Inventory Management", "Excel"],
  missing: ["Demand Planning", "ERP", "Forecasting", "SAP ERP", "Supplier Management"],
});
throws(() => assertExactSkillSets({ matched: ["excel"], missing: ["excel"] }), /Unexpected matched skills|overlap/);

assertSafeUiText("Analysis complete with structured skills.");
throws(() => assertSafeUiText("Authorization: Bearer abc.def"), /Unsafe UI text/);

assert(
  !profileAdminSource.includes('.like("profile_name"') &&
    !profileAdminSource.includes(".like('profile_name'"),
  "profile cleanup must not use broad prefix deletion",
);
assert(
  profileAdminSource.includes('.eq("id", record.id)') &&
    profileAdminSource.includes('.eq("clerk_user_id", expectedOwnerId)'),
  "profile cleanup must target exact profile ID and owner ID",
);
assert(
  !profileAdminSource.match(/\.delete\(\)[\s\S]*?\.eq\("profile_name"/),
  "profile cleanup deletion must not require the current display name",
);

const runId = "regression-run";
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
} satisfies QaConfig;

const ownerIds = { A: "owner_a", B: "owner_b" };
const manifestRecord: CreatedProfileRecord = {
  id: "profile-1",
  ownerLabel: "A",
  expectedOwnerId: ownerIds.A,
  profileName: `V25 QA ${runId} User A Profile`,
  createdAt: "2026-07-02T00:00:00.000Z",
};
const renamedProfileName = `${manifestRecord.profileName} Edited`;

assertManifestRecordProvenance(qaConfig, manifestRecord);
throws(
  () =>
    assertManifestRecordProvenance(qaConfig, {
      ...manifestRecord,
      profileName: `V25 QA other-run User A Profile`,
    }),
  /exact current-run manifest ownership/,
);
assert.equal(resolveManifestOwnerId(manifestRecord, ownerIds), ownerIds.A);
throws(
  () =>
    resolveManifestOwnerId(
      { ...manifestRecord, expectedOwnerId: "owner_wrong" },
      ownerIds,
    ),
  /owner does not match/,
);

type StoredProfile = {
  id: string;
  clerk_user_id: string;
  profile_name: string;
};

function createMockSupabase(initialProfiles: StoredProfile[]) {
  const profiles = [...initialProfiles];
  const deleteFilters: Array<Record<string, string>> = [];
  const postCleanupVerifyFilters: Array<Record<string, string>> = [];

  const applyFilters = (rows: StoredProfile[], filters: Record<string, string>) =>
    rows.filter((row) =>
      Object.entries(filters).every(([column, value]) => String(row[column as keyof StoredProfile]) === value),
    );

  const buildQuery = (table: string, mode: "select" | "delete") => {
    const filters: Record<string, string> = {};
    let selectedColumns = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {
      select: (columns: string) => {
        selectedColumns = columns;
        return chain;
      },
      eq: (column: string, value: string) => {
        filters[column] = value;
        return chain;
      },
      limit: async () => ({ data: applyFilters(profiles, filters), error: null }),
      maybeSingle: async () => {
        const rows = applyFilters(profiles, filters);
        if (mode === "select" && selectedColumns === "id") {
          postCleanupVerifyFilters.push({ ...filters });
        }
        return { data: rows[0] ?? null, error: null };
      },
      delete: () => chain,
    };

    if (mode === "delete") {
      chain.eq = (column: string, value: string) => {
        filters[column] = value;
        return {
          eq: (nextColumn: string, nextValue: string) => {
            filters[nextColumn] = nextValue;
            deleteFilters.push({ ...filters });
            const matching = applyFilters(profiles, filters);
            for (const row of matching) {
              const index = profiles.findIndex((item) => item.id === row.id);
              if (index >= 0) profiles.splice(index, 1);
            }
            return { error: null };
          },
        };
      };
    }

    return chain;
  };

  return {
    from: (table: string) => ({
      select: (columns: string) => buildQuery(table, "select").select(columns),
      delete: () => buildQuery(table, "delete"),
    }),
    deleteFilters,
    postCleanupVerifyFilters,
    remainingProfiles: () => [...profiles],
  };
}

async function runProfileCleanupRegression() {
  const manifestDir = mkdtempSync(join(tmpdir(), "v25-manifest-"));
  const manifestPath = join(manifestDir, `version25-profile-manifest-${runId}.json`);
  saveProfileManifest(manifestPath, {
    ...emptyProfileManifest(runId),
    records: [manifestRecord],
  });

  const renamedSupabase = createMockSupabase([
    {
      id: manifestRecord.id,
      clerk_user_id: manifestRecord.expectedOwnerId,
      profile_name: renamedProfileName,
    },
  ]);

  await cleanupVersion25ProfilesWithClient(
    qaConfig,
    manifestPath,
    renamedSupabase as never,
    ownerIds,
  );

  assert.equal(renamedSupabase.remainingProfiles().length, 0, "renamed profile must still be deleted by exact ID");
  assert.deepEqual(renamedSupabase.deleteFilters, [
    { id: manifestRecord.id, clerk_user_id: manifestRecord.expectedOwnerId },
  ]);
  assert(
    renamedSupabase.deleteFilters.every((filters) => !("profile_name" in filters)),
    "cleanup must not filter deletion by display name",
  );
  assert.deepEqual(renamedSupabase.postCleanupVerifyFilters, [
    { id: manifestRecord.id, clerk_user_id: manifestRecord.expectedOwnerId },
  ]);
  assert(
    renamedSupabase.postCleanupVerifyFilters.every((filters) => !("profile_name" in filters)),
    "cleanup verification must use exact profile ID and owner only",
  );

  saveProfileManifest(manifestPath, {
    ...emptyProfileManifest(runId),
    records: [manifestRecord],
  });
  const mismatchSupabase = createMockSupabase([
    {
      id: manifestRecord.id,
      clerk_user_id: manifestRecord.expectedOwnerId,
      profile_name: renamedProfileName,
    },
  ]);

  await assert.rejects(
    () =>
      cleanupVersion25ProfilesWithClient(
        qaConfig,
        manifestPath,
        mismatchSupabase as never,
        { A: "owner_mismatch", B: ownerIds.B },
      ),
    /owner does not match/,
  );
  assert.equal(
    mismatchSupabase.remainingProfiles().length,
    1,
    "ownership mismatch must refuse deletion",
  );
  assert.equal(mismatchSupabase.deleteFilters.length, 0, "ownership mismatch must not issue delete filters");

  rmSync(manifestDir, { recursive: true, force: true });
}

async function main() {
  await runProfileCleanupRegression();
  console.log("Version 25 launch assertion regression tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
