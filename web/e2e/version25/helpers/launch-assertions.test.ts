import assert from "node:assert/strict";
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
  expectedTitle: "Job Fit & Skill-Gap Analyzer",
  expectedDescription: "Description",
  metadata: {
    canonical: EXPECTED_HOME_CANONICAL,
    openGraphTitle: "Job Fit & Skill-Gap Analyzer",
    openGraphDescription: "Description",
    openGraphUrl: EXPECTED_HOME_CANONICAL,
    openGraphImage: `${CANONICAL_ORIGIN}/opengraph-image`,
    twitterCard: "summary_large_image",
    twitterTitle: "Job Fit & Skill-Gap Analyzer",
    twitterDescription: "Description",
    twitterImage: `${CANONICAL_ORIGIN}/twitter-image`,
  },
});

assert.deepEqual(normalizeSkillSet([" Excel ", "excel", "Logistics"]), ["excel", "logistics"]);
assertExactSkillSets({
  matched: ["Procurement", "logistics", "Inventory Management", "Excel"],
  missing: ["Demand Planning", "ERP", "Forecasting", "SAP ERP", "Supplier Management"],
});
throws(() => assertExactSkillSets({ matched: ["excel"], missing: ["excel"] }), /Unexpected matched skills|overlap/);

assertSafeUiText("Analysis complete with structured skills.");
throws(() => assertSafeUiText("Authorization: Bearer abc.def"), /Unsafe UI text/);

console.log("Version 25 launch assertion regression tests passed.");
