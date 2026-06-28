import { expect, test, type Page } from "@playwright/test";
import { assertHeader, parseCsv } from "./csv";
import { expectNoUnsafeText } from "./assertions";
import {
  readManifest,
  recordsForOwner,
  titleForUserA,
} from "./manifest";
import {
  countSavedAnalysesForOwner,
  discoverAndAppendUiRecord,
} from "./supabase-admin";
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
  buildLoadMorePlan,
  deleteDownload,
  expectLoadMoreAbsent,
  expectLoadedCount,
  loadMoreAndExpectSuccess,
  expectRowAbsent,
  expectRowVisible,
  gotoSavedWorkspace,
  openAnalysisDetail,
  readVisibleTitles,
  rowCheckbox,
  SAVED_ANALYSES_PAGE_SIZE,
  savedAnalysisOpenButtons,
  validateUniqueSavedRowTitles,
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

export async function loadAllUserARecords(
  page: Page,
  config: QaConfig,
): Promise<number> {
  const accountTotal = await countSavedAnalysesForOwner(config, "A");
  const initialCount = Math.min(accountTotal, SAVED_ANALYSES_PAGE_SIZE);
  await expectLoadedCount(page, initialCount);

  const plan = buildLoadMorePlan(accountTotal, SAVED_ANALYSES_PAGE_SIZE);
  for (const step of plan) {
    await loadMoreAndExpectSuccess(page, step);
  }

  await expectLoadedCount(page, accountTotal);
  const titles = await readVisibleTitles(page);
  validateUniqueSavedRowTitles(titles, accountTotal);
  await expect(
    savedAnalysisOpenButtons(page),
  ).toHaveCount(accountTotal);

  if (plan.length > 0) {
    await expectLoadMoreAbsent(page);
  } else {
    await expect(
      page.getByRole("button", { name: "Load more analyses" }),
    ).toHaveCount(0);
  }

  return accountTotal;
}

export function currentRunTitlesForUserA(config: QaConfig): Set<string> {
  return new Set(
    recordsForOwner(readManifest(config.manifestPath), "A").map(
      (record) => record.title,
    ),
  );
}

export async function verifyCurrentRunVisibleCoverage(
  page: Page,
  config: QaConfig,
  preexistingCount: number,
): Promise<void> {
  const currentRunTitles = currentRunTitlesForUserA(config);
  const currentRunRecordCount = currentRunTitles.size;
  const visible = await readVisibleTitles(page);

  const currentRunVisible = visible.filter((title) =>
    currentRunTitles.has(title),
  );
  expect(currentRunVisible).toHaveLength(currentRunRecordCount);
  for (const title of currentRunTitles) {
    expect(currentRunVisible.filter((visibleTitle) => visibleTitle === title))
      .toHaveLength(1);
  }

  const preexistingVisible = visible.filter(
    (title) => !currentRunTitles.has(title),
  );
  expect(preexistingVisible).toHaveLength(preexistingCount);
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
  const currentRunTitleSet = currentRunTitlesForUserA(config);
  const expectedOrder = recordsForOwner(readManifest(config.manifestPath), "A")
    .sort((left, right) => {
      const leftTime = Date.parse(left.created_at ?? "");
      const rightTime = Date.parse(right.created_at ?? "");
      return rightTime - leftTime || right.id.localeCompare(left.id);
    })
    .map((record) => record.title);
  const visible = await readVisibleTitles(page);
  const currentRunVisible = visible.filter((title) =>
    currentRunTitleSet.has(title),
  );
  expect(currentRunVisible).toEqual(expectedOrder);
}

export { titleForUserA, assertHeader };
