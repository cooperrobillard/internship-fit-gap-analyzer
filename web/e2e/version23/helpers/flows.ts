import { expect, test, type Page } from "@playwright/test";
import { assertHeader, parseCsv } from "./csv";
import { expectNoUnsafeText } from "./assertions";
import {
  readManifest,
  recordsForOwner,
  titleForUserA,
} from "./manifest";
import { discoverAndAppendUiRecord } from "./supabase-admin";
import type { QaConfig } from "./config";
import { SYNTHETIC_COMPANY, syntheticJob, syntheticResume } from "./qa-data";
import {
  fillOptionalJobMetadata,
  openOptionalJobDetails,
} from "./analysis-form";
import {
  matchedSkillsHeading,
  missingSkillsHeading,
  openSavedAnalysisJobDetails,
  requireVisibleSavedAnalysisDetailArticle,
} from "./saved-analysis-detail";
import {
  deleteDownload,
  expectLoadedCount,
  loadMoreAndExpectSuccess,
  expectRowAbsent,
  expectRowVisible,
  gotoSavedWorkspace,
  openAnalysisDetail,
  rowCheckbox,
} from "./saved-workspace";

export const UI_SAVE_TITLE_PREFIX = "UI saved analysis";

export async function runStructuredSaveFlow(
  page: Page,
  config: QaConfig,
): Promise<string> {
  const uiTitle = `V23 QA ${config.runId} ${UI_SAVE_TITLE_PREFIX}`;
  const uiNotes = `V23 QA ${config.runId} structured save notes`;

  await test.step("open analysis dashboard", async () => {
    await page.goto(`${config.baseUrl}/dashboard`);
    await expect(
      page.getByRole("heading", { name: "Analyze a role" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  await test.step("load fictional sample inputs", async () => {
    await page.getByRole("button", { name: "Use sample inputs" }).click();
    await expect(
      page.getByText(
        "Fictional sample inputs loaded. Run analysis when ready; nothing has been saved.",
      ),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Analysis complete")).toHaveCount(0);
  });

  const details = await test.step("open Optional job details", async () =>
    openOptionalJobDetails(page));

  await test.step("fill structured save metadata", async () => {
    await fillOptionalJobMetadata(details, {
      title: uiTitle,
      company: SYNTHETIC_COMPANY,
      notes: uiNotes,
    });
  });

  await test.step("run analysis", async () => {
    await page.getByRole("button", { name: "Run analysis" }).click();
    await expect(page.getByText("Analysis complete")).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByText("Structured result saved")).toHaveCount(0);
  });

  await test.step("save structured result", async () => {
    await page.getByRole("button", { name: "Save result" }).click();
    await expect(page.getByText("Structured result saved").first()).toBeVisible({
      timeout: 60_000,
    });
  });

  await test.step("verify saved detail", async () => {
    await gotoSavedWorkspace(page, config.baseUrl);
    await openAnalysisDetail(page, uiTitle);

    const article = await requireVisibleSavedAnalysisDetailArticle(page, uiTitle);
    await expect(
      article.getByRole("heading", { level: 2, name: uiTitle, exact: true }),
    ).toBeVisible();
    await expect(article.getByText(SYNTHETIC_COMPANY, { exact: true })).toBeVisible();
    await expect(matchedSkillsHeading(article)).toBeVisible();
    await expect(missingSkillsHeading(article)).toBeVisible();

    const jobDetails = await openSavedAnalysisJobDetails(page, uiTitle);
    await expect(jobDetails.getByText(uiNotes, { exact: true })).toBeVisible();

    await expect(page.getByText("Demo Candidate")).toHaveCount(0);
    await expect(page.getByText("Northstar Distribution")).toHaveCount(0);
    await expect(page.getByText(syntheticResume)).toHaveCount(0);
    await expect(page.getByText(syntheticJob)).toHaveCount(0);
    await expectNoUnsafeText(page);
  });

  await discoverAndAppendUiRecord(config, uiTitle);

  return uiTitle;
}

export async function loadAllUserARecords(page: Page): Promise<void> {
  await expectLoadedCount(page, 10);
  await loadMoreAndExpectSuccess(page, {
    beforeCount: 10,
    expectedAddedCount: 10,
    expectedTotalCount: 20,
    expectMoreAvailable: true,
  });
  await loadMoreAndExpectSuccess(page, {
    beforeCount: 20,
    expectedAddedCount: 3,
    expectedTotalCount: 23,
    expectMoreAvailable: false,
  });
}

export async function exportSelectedCsv(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export selected (CSV)" }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const text = await (await import("node:fs/promises")).readFile(path!, "utf8");
  await deleteDownload(path);
  return { text, rows: parseCsv(text) as Array<Record<string, string>> };
}

export async function exportLoadedCsv(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Loaded analyses (CSV)" }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const text = await (await import("node:fs/promises")).readFile(path!, "utf8");
  await deleteDownload(path);
  return { text, rows: parseCsv(text) as Array<Record<string, string>> };
}

export function newestFirstIds(config: QaConfig): string[] {
  return recordsForOwner(readManifest(config.manifestPath), "A")
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at ?? "");
      const rightTime = Date.parse(right.created_at ?? "");
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }
      return right.id.localeCompare(left.id);
    })
    .map((record) => record.id);
}

export async function selectRecordsByTitle(page: Page, titles: string[]) {
  for (const title of titles) {
    await rowCheckbox(page, title).check();
  }
}

export async function expectTitlesPresent(page: Page, titles: string[]) {
  for (const title of titles) {
    await expectRowVisible(page, title);
  }
}

export async function expectTitlesAbsent(page: Page, titles: string[]) {
  for (const title of titles) {
    await expectRowAbsent(page, title);
  }
}

export async function verifyPaginationOrdering(page: Page, config: QaConfig) {
  const titles = recordsForOwner(readManifest(config.manifestPath), "A")
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at ?? "");
      const rightTime = Date.parse(right.created_at ?? "");
      return rightTime - leftTime || right.id.localeCompare(left.id);
    })
    .map((record) => record.title);
  const visible = await page
    .getByRole("button", { name: /^Open saved analysis / })
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("aria-label") ?? "")
        .map((label) => label.match(/^Open saved analysis (.+), /)?.[1] ?? "")
        .filter(Boolean),
    );
  expect(visible).toEqual(titles.slice(0, visible.length));
}

export { titleForUserA, assertHeader };
