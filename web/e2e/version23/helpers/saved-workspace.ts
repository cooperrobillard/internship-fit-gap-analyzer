import { expect, type Locator, type Page } from "@playwright/test";
import { SYNTHETIC_COMPANY } from "./qa-data";

/** Matches production `SAVED_ANALYSES_PAGE_SIZE` without importing application code. */
export const SAVED_ANALYSES_PAGE_SIZE = 10;

/** Current-run seed contract: dedicated QA User B receives exactly one synthetic record. */
export const USER_B_EXPECTED_BASELINE_LOADED_COUNT = 1;

const LOADED_COUNT_STATUS_PATTERN = /^(\d+) loaded$/;

export const LOAD_MORE_SUCCESS_TIMEOUT_MS = 60_000;
export const LOAD_MORE_FAILURE_ALERT_TIMEOUT_MS = 15_000;
export const LOAD_MORE_ALERT_MESSAGE =
  "Could not load more analyses. Your currently loaded analyses are still available. Try again.";

export const PAGINATION_SUCCESS_STATUS_PATTERN =
  /^Loaded (\d+) more (analysis|analyses)\. (\d+) (analysis|analyses) loaded\.(?: No more saved analyses to load\.)?$/;

export type LoadMoreSuccessOptions = {
  beforeCount: number;
  expectedAddedCount: number;
  expectedTotalCount: number;
  expectMoreAvailable: boolean;
};

export type LoadMorePlanStep = LoadMoreSuccessOptions;

export function buildLoadMorePlan(
  totalCount: number,
  pageSize: number = SAVED_ANALYSES_PAGE_SIZE,
): LoadMorePlanStep[] {
  if (!Number.isInteger(totalCount) || totalCount < 0) {
    throw new Error(
      `Account total must be a non-negative integer; received ${totalCount}.`,
    );
  }
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error(
      `Page size must be a positive integer; received ${pageSize}.`,
    );
  }

  const steps: LoadMorePlanStep[] = [];
  let loaded = Math.min(totalCount, pageSize);

  while (loaded < totalCount) {
    const beforeCount = loaded;
    const remaining = totalCount - loaded;
    const expectedAddedCount = Math.min(pageSize, remaining);
    loaded += expectedAddedCount;
    steps.push({
      beforeCount,
      expectedAddedCount,
      expectedTotalCount: loaded,
      expectMoreAvailable: loaded < totalCount,
    });
  }

  if (steps.length > 0) {
    const finalStep = steps[steps.length - 1]!;
    if (finalStep.expectedTotalCount !== totalCount) {
      throw new Error(
        `Load-more plan final total ${finalStep.expectedTotalCount} does not match account total ${totalCount}.`,
      );
    }
    for (const step of steps) {
      if (step.expectedAddedCount > pageSize) {
        throw new Error(
          `Load-more plan added ${step.expectedAddedCount} rows, exceeding page size ${pageSize}.`,
        );
      }
    }
  }

  return steps;
}

export function pluralizeAnalysisWord(count: number): "analysis" | "analyses" {
  return count === 1 ? "analysis" : "analyses";
}

export function formatLoadedMorePhrase(addedCount: number): string {
  return `Loaded ${addedCount} more ${pluralizeAnalysisWord(addedCount)}.`;
}

export function formatTotalLoadedPhrase(totalCount: number): string {
  return `${totalCount} ${pluralizeAnalysisWord(totalCount)} loaded.`;
}

export function formatPaginationSuccessStatus(options: {
  addedCount: number;
  totalCount: number;
  expectMoreAvailable: boolean;
}): string {
  const { addedCount, totalCount, expectMoreAvailable } = options;
  const noMoreSuffix = expectMoreAvailable
    ? ""
    : " No more saved analyses to load.";
  return `${formatLoadedMorePhrase(addedCount)} ${formatTotalLoadedPhrase(totalCount)}${noMoreSuffix}`;
}

export function parsePaginationSuccessStatus(text: string): {
  addedCount: number;
  totalCount: number;
  hasNoMoreSuffix: boolean;
} {
  const normalized = text.trim();
  const match = normalized.match(PAGINATION_SUCCESS_STATUS_PATTERN);
  if (!match) {
    throw new Error(`Unable to parse pagination status: "${normalized}".`);
  }
  return {
    addedCount: Number(match[1]),
    totalCount: Number(match[3]),
    hasNoMoreSuffix: normalized.endsWith("No more saved analyses to load."),
  };
}

export function validateUniqueSavedRowTitles(titles: string[], expectedTotalCount: number): void {
  if (titles.length !== expectedTotalCount) {
    throw new Error(
      `Expected ${expectedTotalCount} visible saved rows; observed ${titles.length}.`,
    );
  }
  if (new Set(titles).size !== expectedTotalCount) {
    throw new Error(
      `Expected ${expectedTotalCount} unique saved rows; observed duplicate titles.`,
    );
  }
}

export function paginationStatus(page: Page): Locator {
  return page.locator("#saved-analyses-pagination-status");
}

export function loadMoreFailureAlert(page: Page): Locator {
  return page.getByRole("alert").filter({ hasText: LOAD_MORE_ALERT_MESSAGE });
}

export type LoadMoreFailureDiagnosticsOptions = {
  matchingLoadMoreAttempts?: number;
};

export async function describeLoadMoreFailureUiState(
  page: Page,
  options: LoadMoreFailureDiagnosticsOptions = {},
): Promise<string> {
  const loadedCount = await readLoadedCount(page).catch(() => -1);
  const loadMoreButton = page.getByRole("button", { name: "Load more analyses" });
  const loadMoreMatches = await loadMoreButton.count();
  const loadMoreText =
    loadMoreMatches === 1
      ? ((await loadMoreButton.textContent()) ?? "").trim() || "(empty)"
      : "(absent)";
  const loadMoreDisabled =
    loadMoreMatches === 1 ? await loadMoreButton.isDisabled() : "(absent)";
  const incrementalAlertCount = await loadMoreFailureAlert(page).count();
  const initialListErrorCount = await page
    .getByRole("alert")
    .filter({ hasText: "Could not load saved analyses" })
    .count();
  const detailErrorCount = await page
    .getByRole("alert")
    .filter({ hasText: "Could not load analysis detail" })
    .count();
  const attemptSuffix =
    options.matchingLoadMoreAttempts === undefined
      ? ""
      : `matching load-more attempts=${options.matchingLoadMoreAttempts}; `;

  return (
    attemptSuffix +
    `loaded count=${loadedCount}; ` +
    `load more button text="${loadMoreText}"; ` +
    `load more disabled=${loadMoreDisabled}; ` +
    `incremental error alerts=${incrementalAlertCount}; ` +
    `initial-list error alerts=${initialListErrorCount}; ` +
    `detail error alerts=${detailErrorCount}`
  );
}

export async function expectLoadMoreFailureAlert(
  page: Page,
  options: LoadMoreFailureDiagnosticsOptions = {},
): Promise<void> {
  const alert = loadMoreFailureAlert(page);

  try {
    await expect(alert).toHaveCount(1, {
      timeout: LOAD_MORE_FAILURE_ALERT_TIMEOUT_MS,
    });
    await expect(alert).toHaveText(LOAD_MORE_ALERT_MESSAGE, {
      timeout: LOAD_MORE_FAILURE_ALERT_TIMEOUT_MS,
    });
  } catch (error) {
    const diagnostics = await describeLoadMoreFailureUiState(page, options);
    throw new Error(
      `Expected exactly one load-more failure alert. Diagnostics: ${diagnostics}`,
      { cause: error },
    );
  }
}

export async function gotoSavedWorkspace(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/dashboard/saved`);
  await expect(page.getByRole("heading", { name: "Saved analyses" })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Loading saved analyses…")).toHaveCount(0, {
    timeout: 60_000,
  });
}

export function loadedCountStatus(page: Page): Locator {
  return page
    .getByLabel("Saved workspace view")
    .locator("..")
    .getByText(LOADED_COUNT_STATUS_PATTERN, { exact: true });
}

export function parseLoadedCountStatusText(text: string): number {
  const normalized = text.trim();
  const match = normalized.match(LOADED_COUNT_STATUS_PATTERN);
  if (!match) {
    throw new Error(`Unable to parse loaded-count status: "${normalized}".`);
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Loaded-count status is not a valid non-negative number: "${normalized}".`,
    );
  }
  return value;
}

export function assertUserBFixtureBaseline(count: number): void {
  if (count !== USER_B_EXPECTED_BASELINE_LOADED_COUNT) {
    throw new Error(
      `QA User B contains unexpected pre-existing saved analyses; use a dedicated empty QA account. Observed ${count} loaded; expected ${USER_B_EXPECTED_BASELINE_LOADED_COUNT}.`,
    );
  }
}

export async function readLoadedCount(page: Page): Promise<number> {
  const status = loadedCountStatus(page);
  await expect(status).toBeVisible({ timeout: 60_000 });
  const matches = await status.count();
  if (matches === 0) {
    throw new Error("Saved workspace loaded-count status is missing.");
  }
  if (matches > 1) {
    throw new Error("Multiple loaded-count statuses found in the Saved workspace.");
  }
  const text = (await status.textContent()) ?? "";
  return parseLoadedCountStatusText(text);
}

export async function captureUserBBaselineLoadedCount(page: Page): Promise<number> {
  const count = await readLoadedCount(page);
  assertUserBFixtureBaseline(count);
  return count;
}

export async function expectLoadedCount(page: Page, count: number): Promise<void> {
  await expect(loadedCountStatus(page)).toHaveText(`${count} loaded`, {
    timeout: 60_000,
  });
}

export async function assertUserBPostSwitchIsolation(
  page: Page,
  runId: string,
  baselineCount: number,
): Promise<void> {
  await expect(page.getByText("No analyses selected.")).toBeVisible();
  await expectLoadedCount(page, baselineCount);
  await expect(page.getByText(`V23 QA ${runId} A`)).toHaveCount(0);
  await expectRowVisible(page, `V23 QA ${runId} B`);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function rowCheckbox(page: Page, title: string): Locator {
  return page.getByRole("checkbox", {
    name: new RegExp(`Select saved analysis ${escapeRegExp(title)}`),
  });
}

export function rowOpenButton(page: Page, title: string): Locator {
  return page.getByRole("button", {
    name: new RegExp(`Open saved analysis ${escapeRegExp(title)}`),
  });
}

export function savedAnalysisOpenButtons(page: Page): Locator {
  return page.getByRole("button", {
    name: /^Open saved analysis /,
  });
}

async function readRenderedTitleFromButton(
  button: Locator,
  rowIndex: number,
): Promise<string> {
  const titleParagraphs = button.locator("p");
  const paragraphCount = await titleParagraphs.count();
  if (paragraphCount === 0) {
    throw new Error(
      `Saved-analysis row ${rowIndex + 1} did not contain a readable title.`,
    );
  }
  const text = ((await titleParagraphs.first().textContent()) ?? "").trim();
  if (!text) {
    throw new Error(
      `Saved-analysis row ${rowIndex + 1} did not contain a readable title.`,
    );
  }
  return text;
}

export async function expectRowVisible(page: Page, title: string): Promise<void> {
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function expectRowAbsent(page: Page, title: string): Promise<void> {
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
}

export async function clickLoadMore(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: "Load more analyses" });
  await expect(button).toBeEnabled();
  await button.click();
}

export async function loadMoreAndExpectSuccess(
  page: Page,
  options: LoadMoreSuccessOptions,
): Promise<void> {
  const {
    beforeCount,
    expectedAddedCount,
    expectedTotalCount,
    expectMoreAvailable,
  } = options;

  await expectLoadedCount(page, beforeCount);

  const loadMoreButton = page.getByRole("button", { name: "Load more analyses" });
  await expect(loadMoreButton).toHaveCount(1);
  await expect(loadMoreButton).toBeEnabled();

  const status = paginationStatus(page);
  await expect(status).toHaveCount(1);
  const previousStatus = ((await status.textContent()) ?? "").trim();

  await loadMoreButton.click();

  const loadMoreAlert = loadMoreFailureAlert(page);

  try {
    await expect
      .poll(
        async () => {
          if (await loadMoreAlert.isVisible().catch(() => false)) {
            throw new Error(
              "Load more failed with an error alert instead of completing successfully.",
            );
          }
          return readLoadedCount(page);
        },
        { timeout: LOAD_MORE_SUCCESS_TIMEOUT_MS },
      )
      .toBe(expectedTotalCount);
  } catch (error) {
    if (error instanceof Error && error.message.includes("error alert")) {
      throw error;
    }
    const currentCount = await readLoadedCount(page).catch(() => -1);
    const statusText = ((await status.textContent()) ?? "").trim();
    throw new Error(
      `Load more did not reach ${expectedTotalCount} loaded. Current loaded count: ${currentCount}. Pagination status: "${statusText}".`,
      { cause: error },
    );
  }

  await expectLoadedCount(page, expectedTotalCount);

  const titles = await readVisibleTitles(page);
  validateUniqueSavedRowTitles(titles, expectedTotalCount);

  const expectedStatusText = formatPaginationSuccessStatus({
    addedCount: expectedAddedCount,
    totalCount: expectedTotalCount,
    expectMoreAvailable,
  });
  await expect(status).toHaveText(expectedStatusText, {
    timeout: LOAD_MORE_SUCCESS_TIMEOUT_MS,
  });

  const currentStatus = ((await status.textContent()) ?? "").trim();
  if (currentStatus === previousStatus) {
    throw new Error("Pagination status did not change after a successful load more.");
  }

  if (expectMoreAvailable) {
    await expect(loadMoreButton).toBeVisible();
    await expect(loadMoreButton).toBeEnabled();
  } else {
    await expectLoadMoreAbsent(page);
    await expect(status).toContainText("No more saved analyses to load.");
  }
}

export async function expectLoadMoreAbsent(page: Page): Promise<void> {
  await expect(
    page.getByRole("button", { name: "Load more analyses" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("No more saved analyses to load.", { exact: true }),
  ).toBeVisible();
}

export async function setSearchQuery(page: Page, query: string): Promise<void> {
  await page.getByPlaceholder("Search saved analyses…").fill(query);
}

export async function setListFilter(
  page: Page,
  label: "Show all" | "Has missing skills" | "No missing skills" | "Has notes",
): Promise<void> {
  await page.getByLabel("Filter saved analyses").selectOption({ label });
}

export async function expectVisibleCountSummary(
  page: Page,
  visible: number,
  total: number,
): Promise<void> {
  await expect(
    page.getByText(`${visible} of ${total}`, { exact: true }),
  ).toBeVisible();
}

export async function openAnalysisDetail(page: Page, title: string): Promise<void> {
  await rowOpenButton(page, title).click();
  await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible({
    timeout: 60_000,
  });
}

export async function switchWorkspaceView(
  page: Page,
  label: "Analyses" | "Insights" | "Compare",
): Promise<void> {
  await page.getByRole("button", { name: label, pressed: false }).click();
  await expect(page.getByRole("button", { name: label })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

export async function expectSyntheticCompanyVisible(page: Page): Promise<void> {
  await expect(page.getByText(SYNTHETIC_COMPANY).first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function readVisibleTitles(page: Page): Promise<string[]> {
  const buttons = savedAnalysisOpenButtons(page);
  const count = await buttons.count();
  const titles: string[] = [];
  for (let index = 0; index < count; index += 1) {
    titles.push(await readRenderedTitleFromButton(buttons.nth(index), index));
  }
  return titles;
}

export async function deleteDownload(path: string | null): Promise<void> {
  if (!path) {
    return;
  }
  const { unlink } = await import("node:fs/promises");
  await unlink(path);
}
