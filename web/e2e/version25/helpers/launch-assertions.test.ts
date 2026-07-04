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
import { HOME_DESCRIPTION, SITE_NAME, TWITTER_CARD } from "../../../src/lib/site-config";
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
const launchSpecSource = readFileSync(resolve(helperDir, "../version25-launch-verification.spec.ts"), "utf8");

function throws(fn: () => void, message: RegExp) {
  assert.throws(fn, message);
}

assertCanonicalBaseUrl(CANONICAL_ORIGIN);
throws(() => assertCanonicalBaseUrl("https://internship-fit-gap-analyzer.vercel.app"), /QA_BASE_URL/);

assertCanonicalUrl("https://jobfit.cooperrobillard.com/", EXPECTED_HOME_CANONICAL);
assertCanonicalUrl("https://jobfit.cooperrobillard.com", EXPECTED_HOME_CANONICAL);
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
    twitterCard: TWITTER_CARD,
    twitterTitle: SITE_NAME,
    twitterDescription: HOME_DESCRIPTION,
    twitterImage: `${CANONICAL_ORIGIN}/twitter-image`,
  },
});

assertMetadataSnapshot({
  expectedCanonical: EXPECTED_HOME_CANONICAL,
  expectedTitle: SITE_NAME,
  expectedDescription: HOME_DESCRIPTION,
  metadata: {
    canonical: CANONICAL_ORIGIN,
    openGraphTitle: SITE_NAME,
    openGraphDescription: HOME_DESCRIPTION,
    openGraphUrl: CANONICAL_ORIGIN,
    openGraphImage: `${CANONICAL_ORIGIN}/opengraph-image`,
    twitterCard: TWITTER_CARD,
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
  !launchSpecSource.includes('getByRole("menuitem", { name: /sign out/i })'),
  "launch spec must not use obsolete Clerk Sign out menuitem locator",
);
assert(launchSpecSource.includes(".cl-userButtonTrigger"), "launch spec must target Clerk UserButton trigger");
assert(launchSpecSource.includes(".cl-userButtonPopoverCard"), "launch spec must target Clerk UserButton popover");
assert(
  launchSpecSource.includes('getByRole("button"') && launchSpecSource.includes("/^sign out$/i"),
  "launch spec must use button role with exact-ending Sign out pattern",
);
assert(launchSpecSource.includes("signOutViaUserButton"), "launch spec must centralize UserButton sign-out flow");

const signOutHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf("async function signOutViaUserButton"),
  launchSpecSource.indexOf("async function assertNoHorizontalOverflow"),
);
assert(
  signOutHelperSource.includes('const signInLink = page.getByRole("link", {') &&
    signOutHelperSource.includes("name: /^sign in$/i"),
  "sign-out helper must define the exact Sign in link completion signal",
);
assert(
  signOutHelperSource.includes("await expect(signInLink).toBeVisible"),
  "sign-out helper must await Sign in link visibility",
);
assert(
  signOutHelperSource.includes("await expect(trigger).toBeHidden"),
  "sign-out helper must await the UserButton trigger becoming hidden",
);
assert(!signOutHelperSource.includes("waitForTimeout"), "sign-out helper must not use arbitrary timeout waits");
assert(!signOutHelperSource.includes("clerk.signOut"), "sign-out helper must not call direct Clerk signOut");
assert(!signOutHelperSource.includes("signOutQaUser"), "sign-out helper must not bypass UI with auth helper signOut");

const directSampleTestSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    'test("direct sample analysis stays same-origin and safe"',
  ),
  launchSpecSource.indexOf(
    'test("structured profile CRUD, use, and two-user isolation"',
  ),
);
assert(
  directSampleTestSource.includes('await signInQaUserOnPage(page, config, "A", {'),
  "direct sample analysis test must sign in QA User A",
);
assert(directSampleTestSource.includes("qaUserIds"), "direct sample analysis test must pass qaUserIds");
assert(
  directSampleTestSource.includes('await page.goto(`${config.baseUrl}/dashboard`);'),
  "direct sample analysis test must navigate to dashboard",
);
assert(
  directSampleTestSource.includes('name: /analyze a role/i'),
  "direct sample analysis test must wait for Analyze a role heading",
);
assert(
  directSampleTestSource.includes('getByRole("button"') &&
    directSampleTestSource.includes("/use sample inputs/i"),
  "direct sample analysis test must define sampleInputsButton by button role",
);
assert(
  directSampleTestSource.includes("await expect(sampleInputsButton).toBeVisible"),
  "direct sample analysis test must wait for sampleInputsButton visibility",
);
assert(
  directSampleTestSource.includes("await sampleInputsButton.click();"),
  "direct sample analysis test must click sampleInputsButton",
);
assert(!directSampleTestSource.includes("waitForTimeout"), "direct sample analysis test must not use waitForTimeout");
assert(!directSampleTestSource.includes("clerk.signIn"), "direct sample analysis test must not call clerk.signIn");
assert(
  !directSampleTestSource.includes("storageState") && !directSampleTestSource.includes("storage state"),
  "direct sample analysis test must not rely on storage state",
);

const directSampleSignInIndex = directSampleTestSource.indexOf(
  'await signInQaUserOnPage(page, config, "A", {',
);
const directSampleDashboardIndex = directSampleTestSource.indexOf(
  'await page.goto(`${config.baseUrl}/dashboard`);',
);
const directSampleClickIndex = directSampleTestSource.indexOf(
  "await sampleInputsButton.click();",
);
assert(directSampleSignInIndex >= 0, "direct sample analysis test must include signInQaUserOnPage call");
assert(directSampleDashboardIndex >= 0, "direct sample analysis test must include dashboard navigation");
assert(directSampleClickIndex >= 0, "direct sample analysis test must include sampleInputsButton click");
assert(
  directSampleSignInIndex < directSampleDashboardIndex,
  "direct sample analysis test must sign in before navigating to dashboard",
);
assert(
  directSampleDashboardIndex < directSampleClickIndex,
  "direct sample analysis test must navigate to dashboard before clicking sample inputs",
);

const skillListSectionHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf("function skillListSection("),
  launchSpecSource.indexOf("async function collectSkills"),
);
assert(
  skillListSectionHelperSource.includes('getByRole("heading"'),
  "skillListSection must locate heading by accessible role",
);
assert(
  skillListSectionHelperSource.includes("exact: true"),
  "skillListSection must use exact accessible heading name",
);
assert(
  (skillListSectionHelperSource.match(/\.locator\("\.\."\)/g) ?? []).length >= 2,
  "skillListSection must ascend two parent steps to the outer skill-list wrapper",
);

const collectSkillsHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    "async function collectSkills",
  ),
  launchSpecSource.indexOf(
    'test("public metadata and canonical-host verification"',
  ),
);
assert(
  collectSkillsHelperSource.includes(
    'section.locator("li").evaluateAll',
  ),
  "collectSkills must evaluate list items in the named section",
);
assert(
  collectSkillsHelperSource.includes(
    "Array.from(",
  ) &&
    collectSkillsHelperSource.includes(
      "item.children",
    ),
  "collectSkills must inspect list-item child structure",
);
assert(
  collectSkillsHelperSource.includes(
    "child.children.length > 0",
  ),
  "collectSkills must find the nested content group",
);
assert(
  collectSkillsHelperSource.includes(
    "contentGroup?.firstElementChild?.textContent?.trim()",
  ),
  "collectSkills must extract only the skill-label element",
);
assert(
  collectSkillsHelperSource.includes(".filter(Boolean)"),
  "collectSkills must filter empty results",
);
assert(
  !collectSkillsHelperSource.includes(
    'split("—")',
  ),
  "collectSkills must not depend on a nonexistent em-dash delimiter",
);
assert(
  !collectSkillsHelperSource.match(
    /item\.textContent/,
  ),
  "collectSkills must not read the complete list-item textContent as the returned value",
);
assert(
  !collectSkillsHelperSource.includes("EXPECTED_MATCHED_SKILLS") &&
    !collectSkillsHelperSource.includes("EXPECTED_MISSING_SKILLS") &&
    !collectSkillsHelperSource.includes("Procurement") &&
    !collectSkillsHelperSource.includes("operations_supply_chain"),
  "collectSkills must not reference expected skill names or category labels",
);
assert(
  !collectSkillsHelperSource.match(
    /locator\(\s*["']\.[a-zA-Z_-]/,
  ),
  "collectSkills must not use CSS class locators",
);
assert(
  !collectSkillsHelperSource.includes("xpath=") &&
    !collectSkillsHelperSource.includes("getByTestId") &&
    !collectSkillsHelperSource.includes("waitForTimeout"),
  "collectSkills must not use XPath, test IDs, or arbitrary sleeps",
);

assert(
  directSampleTestSource.includes("const matchedSkillsSection = skillListSection("),
  "direct sample analysis test must define matchedSkillsSection",
);
assert(
  directSampleTestSource.includes("const missingSkillsSection = skillListSection("),
  "direct sample analysis test must define missingSkillsSection",
);
assert(
  directSampleTestSource.includes('await expect(matchedSkillsSection.locator("li")).toHaveCount(4'),
  "direct sample analysis test must wait for four matched list items",
);
assert(
  directSampleTestSource.includes('await expect(missingSkillsSection.locator("li")).toHaveCount(5'),
  "direct sample analysis test must wait for five missing list items",
);
assert(
  directSampleTestSource.includes("await collectSkills(matchedSkillsSection)"),
  "direct sample analysis test must collect matched skills from named section",
);
assert(
  directSampleTestSource.includes("await collectSkills(missingSkillsSection)"),
  "direct sample analysis test must collect missing skills from named section",
);
assert(
  directSampleTestSource.includes("assertExactSkillSets({"),
  "direct sample analysis test must retain assertExactSkillSets",
);
assert(
  !directSampleTestSource.includes("waitForTimeout"),
  "direct sample analysis skill-list assertions must not use waitForTimeout",
);
assert(
  !directSampleTestSource.includes("xpath=") &&
    !directSampleTestSource.includes("getByTestId") &&
    !directSampleTestSource.match(/locator\(\s*["']\.[a-zA-Z_-]/),
  "direct sample analysis skill-list assertions must not use XPath, test IDs, or CSS class selectors",
);
assert(
  !directSampleTestSource.includes("request.post") &&
    !directSampleTestSource.includes("response.json") &&
    !directSampleTestSource.includes("analyzeResult"),
  "direct sample analysis skill-list assertions must not shortcut through direct API results",
);

const createProfileHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    "async function createProfile",
  ),
  launchSpecSource.indexOf(
    "async function deleteProfileViaUi",
  ),
);
assert(
  createProfileHelperSource.includes("page.getByLabel(") &&
    createProfileHelperSource.includes("/source type/i"),
  "createProfile must locate Source type by accessible label",
);
assert(
  createProfileHelperSource.includes(
    "await expect(sourceSelect).toHaveCount(1)",
  ),
  "createProfile must assert exactly one Source type control",
);
assert(
  createProfileHelperSource.includes(
    'await expect(sourceSelect).toHaveValue(',
  ) &&
    createProfileHelperSource.includes(
      '"manual"',
    ),
  "createProfile must validate the existing manual default",
);
assert(
  !createProfileHelperSource.includes(
    "selectOption",
  ),
  "createProfile must not interact with the hidden Source type select",
);
assert(
  !createProfileHelperSource.includes(
    "Advanced profile details",
  ),
  "createProfile must not open optional advanced details",
);
assert(
  !createProfileHelperSource.includes(
    "force: true",
  ) &&
    !createProfileHelperSource.includes(
      ".evaluate(",
    ) &&
    !createProfileHelperSource.includes(
      "dispatchEvent",
    ),
  "createProfile must not force or programmatically mutate the hidden control",
);
assert(
  !createProfileHelperSource.includes(
    "waitForTimeout",
  ),
  "createProfile must not use arbitrary sleeps",
);
assert(
  !createProfileHelperSource.includes(
    "xpath=",
  ) &&
    !createProfileHelperSource.includes(
      "getByTestId",
    ) &&
    !createProfileHelperSource.match(
      /locator\(\s*["']\.[a-zA-Z_-]/,
    ),
  "createProfile must not use XPath, test IDs, or CSS class selectors",
);
assert(
  createProfileHelperSource.includes(
    "const createProfileForm = page",
  ) &&
    createProfileHelperSource.includes(
      '.locator("form")',
    ) &&
    createProfileHelperSource.includes(
      ".filter({",
    ),
  "createProfile must define a scoped create form",
);
assert(
  createProfileHelperSource.includes(
    'name: "New profile"',
  ) &&
    createProfileHelperSource.includes(
      "exact: true",
    ),
  "createProfile form must be scoped by the exact New profile heading",
);
assert(
  createProfileHelperSource.includes(
    "await expect(createProfileForm).toHaveCount(1)",
  ),
  "createProfile must assert exactly one create form",
);
assert(
  createProfileHelperSource.includes(
    'createProfileForm.getByRole("button"',
  ) &&
    createProfileHelperSource.includes(
      "name: /^create profile$/i",
    ),
  "createProfile must locate its submit action inside the scoped form",
);
assert(
  createProfileHelperSource.includes(
    "await expect(createProfileSubmit).toHaveCount(1)",
  ) &&
    createProfileHelperSource.includes(
      "await expect(createProfileSubmit).toBeVisible()",
    ) &&
    createProfileHelperSource.includes(
      "await createProfileSubmit.click()",
    ),
  "createProfile must verify and click the unique visible scoped submit action",
);
assert(
  !createProfileHelperSource.includes(
    'page.getByRole("button", { name: /^create profile$/i }).click()',
  ),
  "createProfile must not use an ambiguous page-wide submit locator",
);
assert(
  !createProfileHelperSource.includes(
    "createProfileSubmit.first()",
  ) &&
    !createProfileHelperSource.includes(
      "createProfileSubmit.last()",
    ) &&
    !createProfileHelperSource.includes(
      "createProfileSubmit.nth(",
    ),
  "createProfile must not resolve submit ambiguity positionally",
);
assert(
  createProfileHelperSource.includes(
    "const profileSummary = page",
  ) &&
    createProfileHelperSource.includes(
      "name: profileName",
    ) &&
    createProfileHelperSource.includes(
      'getByRole("heading"',
    ),
  "createProfile must anchor the selected summary through the exact profileName heading",
);
assert(
  createProfileHelperSource.includes(
    '.locator("..")',
  ) &&
    createProfileHelperSource.includes(
      "profileSummary.getByText(",
    ),
  "createProfile must scope notes verification inside profileSummary",
);
assert(
  createProfileHelperSource.includes(
    "profileSummary.getByText(",
  ) &&
    createProfileHelperSource.includes(
      "exact: true",
    ),
  "createProfile must use exact matching for scoped notes text",
);
assert(
  !createProfileHelperSource.includes(
    "page.getByText(`Synthetic Version 25 ${ownerLabel} structured notes only.`",
  ),
  "createProfile must not use an ambiguous page-wide profile-notes locator",
);
assert(
  !createProfileHelperSource.includes(
    "profileSummary.first()",
  ) &&
    !createProfileHelperSource.includes(
      "profileSummary.last()",
    ) &&
    !createProfileHelperSource.includes(
      "profileSummary.nth(",
    ),
  "createProfile must not resolve profile summary ambiguity positionally",
);
assert(
  createProfileHelperSource.includes(
    'const profileDetails = page',
  ) &&
    createProfileHelperSource.includes(
      '.locator("details")',
    ) &&
    createProfileHelperSource.includes(
      '"Profile details"',
    ),
  "createProfile must scope persisted source verification to Profile details",
);
assert(
  createProfileHelperSource.includes(
    'profileDetails.getByText("Manual"',
  ),
  "createProfile must verify the persisted Manual source type",
);
assert(
  !createProfileHelperSource.includes(
    '"Manual entry"',
  ),
  "createProfile must not use the analysis-form source label in profile details",
);
assert(
  createProfileHelperSource.includes(
    'profileDetails.getByText("Created"',
  ) &&
    createProfileHelperSource.includes(
      'profileDetails.getByText("Updated"',
    ),
  "createProfile must scope Created and Updated timestamp assertions to Profile details",
);
assert(
  createProfileHelperSource.includes(
    'profileDetails.getByText("Created", { exact: true })',
  ) &&
    createProfileHelperSource.includes(
      'profileDetails.getByText("Updated", { exact: true })',
    ),
  "createProfile must use exact Created and Updated text inside Profile details",
);
assert(
  !createProfileHelperSource.includes(
    "page.getByText(/Created/i)",
  ) &&
    !createProfileHelperSource.includes(
      "page.getByText(/Updated/i)",
    ),
  "createProfile must not use ambiguous page-wide timestamp locators",
);
assert(
  !createProfileHelperSource.includes(
    "force: true",
  ) &&
    !createProfileHelperSource.includes(
      "waitForTimeout",
    ) &&
    !createProfileHelperSource.includes(
      "xpath=",
    ) &&
    !createProfileHelperSource.includes(
      "getByTestId",
    ) &&
    !createProfileHelperSource.includes(
      ".evaluate(",
    ) &&
    !createProfileHelperSource.includes(
      "dispatchEvent",
    ) &&
    !createProfileHelperSource.match(
      /locator\(\s*["']\.[a-zA-Z_-]/,
    ),
  "createProfile must not use forced, positional, programmatic, XPath, test-ID, class, or arbitrary-wait shortcuts",
);
assert(
  createProfileHelperSource.includes(
    "Profile created.",
  ),
  "createProfile must retain the creation confirmation assertion",
);
assert(
  createProfileHelperSource.includes(
    "discoverProfileForManifest",
  ) &&
    createProfileHelperSource.includes(
      "appendProfileRecord",
    ),
  "createProfile must retain exact cleanup-manifest registration",
);

const structuredProfileTestSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    'test("structured profile CRUD, use, and two-user isolation"',
  ),
  launchSpecSource.indexOf(
    'test("cross-route responsive smoke checks"',
  ),
);
assert(
  structuredProfileTestSource.includes(
    'getByRole("radio", {',
  ) &&
    structuredProfileTestSource.includes(
      'name: "Saved profile"',
    ) &&
    structuredProfileTestSource.includes(
      "exact: true",
    ),
  "structured profile test must locate Saved profile radio by exact role and name",
);
assert(
  structuredProfileTestSource.includes(
    'getByRole("combobox", {',
  ) &&
    structuredProfileTestSource.includes(
      'name: "Saved profile"',
    ),
  "structured profile test must locate Saved profile select by combobox role with exact name",
);
assert(
  !structuredProfileTestSource.includes('getByLabel("Saved profile")'),
  "structured profile test must not use ambiguous getByLabel for Saved profile select",
);
assert(
  structuredProfileTestSource.includes(
    "const profileSourceDetails = page",
  ) &&
    structuredProfileTestSource.includes(
      '"Profile source details"',
    ),
  "structured profile test must scope selected preview through profileSourceDetails",
);
assert(
  structuredProfileTestSource.includes(
    "selectedProfilePreview.getByText(userAProfileNameEdited",
  ),
  "structured profile test must assert edited profile name inside selectedProfilePreview",
);
assert(
  structuredProfileTestSource.includes(
    'profileSourceDetails.getByText(\n      "Manual entry · structured profile data only."',
  ) ||
    structuredProfileTestSource.includes(
      '"Manual entry · structured profile data only."',
    ),
  "structured profile test must assert structured-profile source text inside profileSourceDetails",
);
assert(
  structuredProfileTestSource.includes(
    "const editProfileForm = page",
  ) &&
    structuredProfileTestSource.includes(
      'name: "Edit profile"',
    ),
  "structured profile test must scope edit interactions through editProfileForm",
);
assert(
  structuredProfileTestSource.includes(
    "await expect(editProfileForm).toHaveCount(1)",
  ),
  "structured profile test must assert exactly one edit form",
);
assert(
  structuredProfileTestSource.includes(
    "editProfileForm.getByLabel(",
  ) &&
    structuredProfileTestSource.includes(
      "editProfileForm.getByRole(",
    ),
  "structured profile test must perform edit interactions inside editProfileForm",
);
assert(
  structuredProfileTestSource.includes("Profile updated."),
  "structured profile test must retain Profile updated confirmation",
);
assert(
  structuredProfileTestSource.includes(
    "name: userAProfileNameEdited, exact: true",
  ),
  "structured profile test must assert edited heading with exact matching",
);
assert(
  structuredProfileTestSource.includes(
    'getByLabel(/resume information/i)',
  ) &&
    structuredProfileTestSource.includes("toHaveCount(0)"),
  "structured profile test must retain absent pasted résumé field check in saved-profile mode",
);
assert(
  !structuredProfileTestSource.match(/\.(first|last|nth)\(/),
  "structured profile test must not use positional locators",
);
assert(
  !structuredProfileTestSource.includes("force: true") &&
    !structuredProfileTestSource.includes("waitForTimeout") &&
    !structuredProfileTestSource.includes("xpath=") &&
    !structuredProfileTestSource.includes("getByTestId") &&
    !structuredProfileTestSource.includes("dispatchEvent") &&
    !structuredProfileTestSource.match(/locator\(\s*["']\.[a-zA-Z_-]/),
  "structured profile test must not use forced, XPath, test-ID, class, or arbitrary-wait shortcuts",
);

const deleteProfileHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    "async function deleteProfileViaUi",
  ),
  launchSpecSource.indexOf(
    "function skillListSection(",
  ),
);
assert(
  deleteProfileHelperSource.includes(
    "await expect(profileButton).toHaveCount(1)",
  ),
  "deleteProfileViaUi must assert exactly one profile selection button",
);
assert(
  deleteProfileHelperSource.includes(
    "selectedProfileDetail.getByRole(\"button\"",
  ) &&
    deleteProfileHelperSource.includes(
      "name: /^delete$/i",
    ),
  "deleteProfileViaUi must scope Delete to selected profile detail controls",
);
assert(
  deleteProfileHelperSource.includes(
    "await expect(deleteButton).toHaveCount(1)",
  ),
  "deleteProfileViaUi must assert exactly one Delete button in selected profile detail",
);
assert(
  deleteProfileHelperSource.includes(
    "selectedProfileDetail.getByRole(\"button\"",
  ) &&
    deleteProfileHelperSource.includes(
      "name: /^delete profile$/i",
    ),
  "deleteProfileViaUi must scope Delete profile to selected profile detail confirmation",
);
assert(
  deleteProfileHelperSource.includes(
    "await expect(deleteProfileButton).toHaveCount(1)",
  ),
  "deleteProfileViaUi must assert exactly one Delete profile confirmation button",
);
assert(
  deleteProfileHelperSource.includes("Profile deleted."),
  "deleteProfileViaUi must retain Profile deleted confirmation",
);
assert(
  !deleteProfileHelperSource.match(/\.(first|last|nth)\(/),
  "deleteProfileViaUi must not use positional locators",
);

const profileLauncherHelperSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    "async function createProfile",
  ),
  launchSpecSource.indexOf(
    "async function deleteProfileViaUi",
  ),
);
assert(
  profileLauncherHelperSource.includes(
    "const profileLauncher = page.getByRole(\"button\"",
  ) &&
    profileLauncherHelperSource.includes(
      'name: "New profile"',
    ) &&
    profileLauncherHelperSource.includes(
      "exact: true",
    ),
  "createProfile must locate the profile launcher by exact New profile button role and name",
);
assert(
  profileLauncherHelperSource.includes(
    "await expect(profileLauncher).toHaveCount(1)",
  ) &&
    profileLauncherHelperSource.includes(
      "await expect(profileLauncher).toBeVisible()",
  ),
  "createProfile must assert exactly one visible profile launcher",
);
assert(
  !profileLauncherHelperSource.includes("/^(?:new profile|create profile)$/i"),
  "createProfile must not use the New profile/Create profile union locator",
);
assert(
  !profileLauncherHelperSource.match(/\.(first|last|nth)\(/),
  "createProfile must not use positional locators",
);

const responsiveTestSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    'test("cross-route responsive smoke checks"',
  ),
  launchSpecSource.indexOf(
    'test("accessibility smoke checks"',
  ),
);
assert(
  responsiveTestSource.includes("expectUniqueVisibleButton"),
  "responsive smoke test must use unique visible button helper",
);
assert(
  !responsiveTestSource.match(/\.(first|last|nth)\(/),
  "responsive smoke test must not use positional locators",
);
assert(
  responsiveTestSource.includes('expectUniqueVisibleButton(page, "New profile")'),
  "responsive smoke test must assert the unique exact New profile button on profiles route",
);
assert(
  !responsiveTestSource.includes("/^(?:new profile|create profile)$/i"),
  "responsive smoke test must not use the New profile/Create profile union locator",
);

const accessibilityTestSource = launchSpecSource.slice(
  launchSpecSource.indexOf(
    'test("accessibility smoke checks"',
  ),
  launchSpecSource.length,
);
assert(
  accessibilityTestSource.includes(
    "const profileLauncher = page.getByRole(\"button\"",
  ) &&
    accessibilityTestSource.includes(
      'name: "New profile"',
    ) &&
    accessibilityTestSource.includes(
      "exact: true",
    ),
  "accessibility smoke test must use exact New profile profile launcher",
);
assert(
  !accessibilityTestSource.includes("/^(?:new profile|create profile)$/i"),
  "accessibility smoke test must not use the New profile/Create profile union locator",
);
assert(
  accessibilityTestSource.includes(
    "await expect(profileLauncher).toHaveCount(1)",
  ),
  "accessibility smoke test must assert exactly one profile launcher",
);
assert(
  accessibilityTestSource.includes(
    "createProfileForm.getByRole(\"button\"",
  ) &&
    accessibilityTestSource.includes(
      "name: /^cancel$/i",
    ),
  "accessibility smoke test must locate Cancel inside the active New profile form",
);
assert(
  accessibilityTestSource.includes(
    "await expect(cancelButton).toHaveCount(1)",
  ),
  "accessibility smoke test must assert exactly one Cancel button in the active form",
);
assert(
  !accessibilityTestSource.match(/\.(first|last|nth)\(/),
  "accessibility smoke test must not use positional locators",
);
assert(
  accessibilityTestSource.includes("skip to main content") ||
    accessibilityTestSource.includes("skip to main content/i"),
  "accessibility smoke test must retain skip-link behavior",
);
assert(
  accessibilityTestSource.includes("#main-content"),
  "accessibility smoke test must retain main-content focus check",
);
assert(
  accessibilityTestSource.includes('locator("main")') &&
    accessibilityTestSource.includes("toHaveCount(1)"),
  "accessibility smoke test must retain one main region assertion",
);
assert(
  accessibilityTestSource.includes('getByRole("heading", { level: 1 })'),
  "accessibility smoke test must retain one top-level heading assertion",
);
assert(
  accessibilityTestSource.includes("document.documentElement.style.zoom"),
  "accessibility smoke test may retain existing zoom implementation",
);

const remainingFlowSource = [
  structuredProfileTestSource,
  deleteProfileHelperSource,
  profileLauncherHelperSource,
  responsiveTestSource,
  accessibilityTestSource,
].join("\n");
assert(
  !remainingFlowSource.includes("force: true") &&
    !remainingFlowSource.includes("waitForTimeout") &&
    !remainingFlowSource.includes("xpath=") &&
    !remainingFlowSource.includes("getByTestId") &&
    !remainingFlowSource.includes("dispatchEvent") &&
    !remainingFlowSource.match(/\.evaluate\([^)]*\)\s*;\s*$/m),
  "remaining profile/responsive/accessibility flows must not introduce forbidden shortcuts",
);
assert(
  structuredProfileTestSource.includes("discoverProfileForManifest") ||
    launchSpecSource.includes("appendProfileRecord"),
  "launch spec must retain manifest discovery and cleanup registration",
);

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
