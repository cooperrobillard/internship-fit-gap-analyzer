import { expect, type Locator, type Page } from "@playwright/test";
import { SYNTHETIC_COMPANY } from "./qa-data";

/** Current-run seed contract: dedicated QA User B receives exactly one synthetic record. */
export const USER_B_EXPECTED_BASELINE_LOADED_COUNT = 1;

const LOADED_COUNT_STATUS_PATTERN = /^(\d+) loaded$/;

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
  const buttons = page.getByRole("button", { name: /^Open saved analysis / });
  const count = await buttons.count();
  const titles: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const label = await buttons.nth(index).getAttribute("aria-label");
    if (!label) {
      continue;
    }
    const match = label.match(/^Open saved analysis (.+), /);
    if (match?.[1]) {
      titles.push(match[1]);
    }
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
