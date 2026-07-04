import { expect, test, type Locator, type Page } from "@playwright/test";
import { HOME_DESCRIPTION, SITE_NAME } from "../../src/lib/site-config";
import { loadQaConfig } from "../version23/helpers/config";
import { signInQaUserOnPage, switchQaUserOnPage } from "../version23/helpers/auth";
import { loadClerkQaUserIdsFromEnv } from "../version23/helpers/clerk-precheck";
import {
  appendProfileRecord,
  version25ManifestPath,
} from "./helpers/profile-manifest";
import { discoverProfileForManifest } from "./helpers/profile-admin";
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
  OLD_VERCEL_ORIGIN,
  type MetadataSnapshot,
} from "./helpers/launch-assertions";

test.describe.configure({ mode: "serial" });

const config = loadQaConfig();
const qaUserIds = loadClerkQaUserIdsFromEnv();
const manifestPath = version25ManifestPath(config.runId);
const userAProfileName = `V25 QA ${config.runId} User A Profile`;
const userBProfileName = `V25 QA ${config.runId} User B Profile`;
const userAProfileNameEdited = `${userAProfileName} Edited`;

async function metadataSnapshot(page: Page): Promise<MetadataSnapshot> {
  return page.evaluate(() => {
    const bySelector = (selector: string) => document.querySelector(selector)?.getAttribute("content") ?? document.querySelector(selector)?.getAttribute("href") ?? null;
    return {
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
      openGraphTitle: bySelector('meta[property="og:title"]'),
      openGraphDescription: bySelector('meta[property="og:description"]'),
      openGraphUrl: bySelector('meta[property="og:url"]'),
      openGraphImage: bySelector('meta[property="og:image"]'),
      twitterCard: bySelector('meta[name="twitter:card"]'),
      twitterTitle: bySelector('meta[name="twitter:title"]'),
      twitterDescription: bySelector('meta[name="twitter:description"]'),
      twitterImage: bySelector('meta[name="twitter:image"]'),
      robots: bySelector('meta[name="robots"]'),
    };
  });
}

async function signOutViaUserButton(page: Page): Promise<void> {
  const trigger = page.locator(".cl-userButtonTrigger");
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await trigger.click();

  const popover = page.locator(".cl-userButtonPopoverCard");
  await expect(popover).toBeVisible({ timeout: 30_000 });

  const signOutButton = popover.getByRole("button", {
    name: /^sign out$/i,
  });
  await expect(signOutButton).toBeVisible({ timeout: 30_000 });
  await signOutButton.click();

  const signInLink = page.getByRole("link", {
    name: /^sign in$/i,
  });
  await expect(signInLink).toBeVisible({ timeout: 30_000 });

  await expect(trigger).toBeHidden({ timeout: 30_000 });
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectVisibleButton(page: Page, name: RegExp | string): Promise<void> {
  await expect(page.getByRole("button", { name }).first()).toBeVisible({ timeout: 15_000 });
}

async function createProfile(page: Page, ownerLabel: "A" | "B", profileName: string): Promise<void> {
  await page.goto(`${config.baseUrl}/dashboard/profiles`);
  await expect(page.getByRole("heading", { name: /resume profiles/i })).toBeVisible({ timeout: 30_000 });
  const newProfile = page.getByRole("button", { name: /new profile|create profile/i }).first();
  await newProfile.click();
  await page.getByLabel("Profile name").fill(profileName);
  await page.getByLabel(/notes/i).fill(`Synthetic Version 25 ${ownerLabel} structured notes only.`);
  await page.getByLabel(/skills from the source/i).fill("excel, logistics, procurement");
  await page.getByLabel(/skills you added/i).fill("inventory management, forecasting");
  const sourceSelect = page.getByLabel(/source type/i);
  if (await sourceSelect.count()) await sourceSelect.selectOption("manual");
  await page.getByRole("button", { name: /^create profile$/i }).click();
  await expect(page.getByText(`Profile created. “${profileName}” is ready to use.`)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: profileName })).toBeVisible();
  await expect(page.getByText(`Synthetic Version 25 ${ownerLabel} structured notes only.`)).toBeVisible();
  await expect(page.getByText("excel", { exact: true })).toBeVisible();
  await expect(page.getByText("Manual entry", { exact: true })).toBeVisible();
  await expect(page.getByText(/Created/i)).toBeVisible();
  await expect(page.getByText(/Updated/i)).toBeVisible();

  const record = await discoverProfileForManifest({ config, manifestPath, ownerLabel, profileName });
  appendProfileRecord(manifestPath, config.runId, record);
}

async function deleteProfileViaUi(page: Page, profileName: string): Promise<void> {
  await page.goto(`${config.baseUrl}/dashboard/profiles`);
  await page.getByRole("button", { name: new RegExp(profileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).click();
  await page.getByRole("button", { name: /^delete$/i }).click();
  await page.getByRole("button", { name: /^delete profile$/i }).click();
  await expect(page.getByText("Profile deleted.")).toBeVisible({ timeout: 30_000 });
}

function skillListSection(page: Page, headingName: string): Locator {
  return page
    .getByRole("heading", {
      name: headingName,
      exact: true,
    })
    .locator("..")
    .locator("..");
}

async function collectSkills(section: Locator): Promise<string[]> {
  return section.locator("li").evaluateAll((items) => items.map((item) => item.textContent?.split("—")[0].trim() ?? "").filter(Boolean));
}

test("public metadata and canonical-host verification", async ({ page, request }) => {
  assertCanonicalBaseUrl(config.baseUrl);
  await page.goto(`${config.baseUrl}/`);
  const homeMetadata = await metadataSnapshot(page);
  assertMetadataSnapshot({
    metadata: homeMetadata,
    expectedCanonical: EXPECTED_HOME_CANONICAL,
    expectedTitle: SITE_NAME,
    expectedDescription: HOME_DESCRIPTION,
  });
  await page.goto(`${config.baseUrl}/privacy`);
  const privacyMetadata = await metadataSnapshot(page);
  assertCanonicalUrl(privacyMetadata.canonical, EXPECTED_PRIVACY_CANONICAL);

  for (const imageUrl of [homeMetadata.openGraphImage, homeMetadata.twitterImage]) {
    expect(imageUrl).toBeTruthy();
    const response = await request.get(imageUrl!);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"] ?? "").toMatch(/^image\//);
  }

  const sitemap = await (await request.get(`${config.baseUrl}/sitemap.xml`)).text();
  assertExactSitemap(sitemap);
  const robots = await (await request.get(`${config.baseUrl}/robots.txt`)).text();
  assertRobotsTxt(robots);

  for (const route of ["/sign-in", "/sign-up"]) {
    await page.goto(`${config.baseUrl}${route}`);
    assertNoIndex(await metadataSnapshot(page), route);
  }

  const oldHostResponse = await page.goto(`${OLD_VERCEL_ORIGIN}/`);
  expect(oldHostResponse?.ok()).toBeTruthy();

  const oldHostMetadata = await metadataSnapshot(page);

  assertCanonicalUrl(oldHostMetadata.canonical, EXPECTED_HOME_CANONICAL);

  assertCanonicalUrl(oldHostMetadata.openGraphUrl, EXPECTED_HOME_CANONICAL);
});

test("authentication and session boundary", async ({ page, context }) => {
  await page.goto(`${config.baseUrl}/dashboard`);
  await expect(page).toHaveURL(/sign-in|sign-in\//, { timeout: 30_000 });
  expect(new URL(page.url()).origin).toBe(CANONICAL_ORIGIN);
  await signInQaUserOnPage(page, config, "A", { qaUserIds });
  await page.goto(`${config.baseUrl}/dashboard`);
  await expect(page.getByRole("heading", { name: /analyze a role/i })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: /analyze a role/i })).toBeVisible({ timeout: 30_000 });
  const secondPage = await context.newPage();
  await secondPage.goto(`${config.baseUrl}/dashboard/saved`);
  await expect(secondPage.getByRole("heading", { name: /saved analyses/i })).toBeVisible({ timeout: 30_000 });
  await secondPage.close();
  await signOutViaUserButton(page);
  await page.goto(`${config.baseUrl}/dashboard`);
  await expect(page).toHaveURL(/sign-in|sign-in\//, { timeout: 30_000 });
});

test("direct sample analysis stays same-origin and safe", async ({ page }) => {
  await signInQaUserOnPage(page, config, "A", {
    qaUserIds,
  });

  await page.goto(`${config.baseUrl}/dashboard`);

  await expect(
    page.getByRole("heading", {
      name: /analyze a role/i,
    }),
  ).toBeVisible({ timeout: 30_000 });

  let analyzeCalls = 0;
  const renderRequests: string[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url === `${config.baseUrl}/api/analyze`) analyzeCalls += 1;
    if (url.includes("internship-fit-gap-analyzer.onrender.com")) {
      renderRequests.push(url);
    }
  });

  const sampleInputsButton = page.getByRole("button", {
    name: /use sample inputs/i,
  });

  await expect(sampleInputsButton).toBeVisible({
    timeout: 30_000,
  });
  await sampleInputsButton.click();
  await expect(page.getByText("Fictional sample inputs loaded. Run analysis when ready; nothing has been saved.")).toBeVisible();
  expect(analyzeCalls).toBe(0);
  await expect(page.getByText("Structured result saved")).toHaveCount(0);
  await page.getByRole("button", { name: /^run analysis$/i }).click();
  await expect(page.getByText("Analysis complete")).toBeVisible({ timeout: 120_000 });
  expect(analyzeCalls).toBe(1);
  expect(renderRequests).toEqual([]);
  const matchedSkillsSection = skillListSection(
    page,
    "Matched skills",
  );
  const missingSkillsSection = skillListSection(
    page,
    "Missing skills",
  );

  await expect(matchedSkillsSection).toBeVisible({
    timeout: 30_000,
  });
  await expect(missingSkillsSection).toBeVisible({
    timeout: 30_000,
  });

  await expect(matchedSkillsSection.locator("li")).toHaveCount(4, {
    timeout: 30_000,
  });
  await expect(missingSkillsSection.locator("li")).toHaveCount(5, {
    timeout: 30_000,
  });

  const matched = await collectSkills(matchedSkillsSection);
  const missing = await collectSkills(missingSkillsSection);

  assertExactSkillSets({
    matched,
    missing,
  });
  assertSafeUiText(await page.locator("body").innerText());
});

test("structured profile CRUD, use, and two-user isolation", async ({ page }) => {
  await signInQaUserOnPage(page, config, "A", { qaUserIds });
  await createProfile(page, "A", userAProfileName);
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page.getByLabel("Profile name").fill(userAProfileNameEdited);
  await page.getByLabel(/notes/i).fill("Synthetic Version 25 User A edited structured notes only.");
  await page.getByRole("button", { name: /^save changes$/i }).click();
  await expect(page.getByText("Profile updated.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: userAProfileNameEdited })).toBeVisible();

  await page.goto(`${config.baseUrl}/dashboard`);
  await page.getByRole("radio", { name: /saved profile/i }).check();
  await page.getByLabel("Saved profile").selectOption({ label: userAProfileNameEdited });
  await expect(page.getByText(userAProfileNameEdited)).toBeVisible();
  await expect(page.getByText(/structured profile data only/i)).toBeVisible();
  await expect(page.getByLabel(/resume information/i)).toHaveCount(0);
  await page.getByLabel(/job description/i).fill("Synthetic role requiring excel, logistics, procurement, inventory management, forecasting, erp, sap erp, demand planning, and supplier management.");
  await page.getByRole("button", { name: /^run analysis$/i }).click();
  await expect(page.getByText("Analysis complete")).toBeVisible({ timeout: 120_000 });
  assertSafeUiText(await page.locator("body").innerText());

  await switchQaUserOnPage(page, config, "A", "B", { qaUserIds });
  await page.goto(`${config.baseUrl}/dashboard/profiles`);
  await expect(page.getByText(userAProfileNameEdited)).toHaveCount(0);
  await createProfile(page, "B", userBProfileName);
  await switchQaUserOnPage(page, config, "B", "A", { qaUserIds });
  await page.goto(`${config.baseUrl}/dashboard/profiles`);
  await expect(page.getByText(userBProfileName)).toHaveCount(0);
  await deleteProfileViaUi(page, userAProfileNameEdited);
});

test("cross-route responsive smoke checks", async ({ page }) => {
  await signInQaUserOnPage(page, config, "A", { qaUserIds });
  for (const width of [320, 375, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/privacy", "/sign-in", "/sign-up", "/dashboard", "/dashboard/saved", "/dashboard/profiles"]) {
      await page.goto(`${config.baseUrl}${route}`);
      await assertNoHorizontalOverflow(page);
      if (route.startsWith("/dashboard")) await expect(page.getByRole("navigation", { name: /dashboard|workspace/i })).toBeVisible();
      if (route === "/dashboard") await expectVisibleButton(page, /run analysis/i);
      if (route === "/dashboard/profiles") await expectVisibleButton(page, /new profile|create profile/i);
      if (route === "/dashboard/saved") await expect(page.getByRole("heading", { name: /saved analyses/i })).toBeVisible();
    }
  }
});

test("accessibility smoke checks", async ({ page }) => {
  await signInQaUserOnPage(page, config, "A", { qaUserIds });
  await page.goto(`${config.baseUrl}/dashboard`);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip to main content/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: /dashboard|workspace/i })).toBeVisible();
  await expect(page.getByLabel(/resume source/i)).toBeVisible();
  await expect(page.getByLabel(/job description/i)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.goto(`${config.baseUrl}/dashboard/profiles`);
  await page.getByRole("button", { name: /new profile|create profile/i }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Profile name")).toBeVisible();
  await expect(page.getByLabel(/notes/i)).toBeVisible();
  await page.keyboard.press("Escape");
  const cancel = page.getByRole("button", { name: /cancel/i }).first();
  if (await cancel.count()) {
    await cancel.focus();
    await page.keyboard.press("Enter");
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await assertNoHorizontalOverflow(page);
});
