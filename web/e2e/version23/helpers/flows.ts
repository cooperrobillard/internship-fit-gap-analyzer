import { expect, type Page } from "@playwright/test";
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
  clickLoadMore,
  deleteDownload,
  expectLoadedCount,
  expectLoadMoreAbsent,
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
  await page.goto(`${config.baseUrl}/dashboard`);
  await page.getByRole("button", { name: "Use sample inputs" }).click();
  await expect(
    page.getByText(
      "Fictional sample inputs loaded. Run analysis when ready; nothing has been saved.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Analysis complete")).toHaveCount(0);

  const uiTitle = `V23 QA ${config.runId} ${UI_SAVE_TITLE_PREFIX}`;
  await page.getByLabel("Job title").fill(uiTitle);
  await page.getByLabel("Company").fill(SYNTHETIC_COMPANY);
  await page
    .getByLabel("Notes")
    .fill(`V23 QA ${config.runId} structured save notes`);

  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByText("Analysis complete")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText("Structured result saved")).toHaveCount(0);

  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.getByText("Structured result saved").first()).toBeVisible({
    timeout: 60_000,
  });

  await gotoSavedWorkspace(page, config.baseUrl);
  await openAnalysisDetail(page, uiTitle);

  await expect(page.getByRole("heading", { level: 2, name: uiTitle })).toBeVisible();
  await expect(page.getByText(SYNTHETIC_COMPANY).first()).toBeVisible();
  await expect(
    page.getByText(`V23 QA ${config.runId} structured save notes`),
  ).toBeVisible();
  await expect(page.getByText(/Matched skills/i).first()).toBeVisible();
  await expect(page.getByText(/Missing skills/i).first()).toBeVisible();
  await expect(page.getByText("Demo Candidate")).toHaveCount(0);
  await expect(page.getByText("Northstar Distribution")).toHaveCount(0);
  await expect(page.getByText(syntheticResume)).toHaveCount(0);
  await expect(page.getByText(syntheticJob)).toHaveCount(0);
  await expectNoUnsafeText(page);

  await discoverAndAppendUiRecord(config, uiTitle);

  return uiTitle;
}

export async function loadAllUserARecords(page: Page): Promise<void> {
  await expectLoadedCount(page, 10);
  await clickLoadMore(page);
  await expect(page.getByText("Loaded 10 more analyses.")).toBeVisible({
    timeout: 60_000,
  });
  await expectLoadedCount(page, 20);
  await clickLoadMore(page);
  await expect(page.getByText("Loaded 3 more analyses.")).toBeVisible({
    timeout: 60_000,
  });
  await expectLoadedCount(page, 23);
  await expectLoadMoreAbsent(page);
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
