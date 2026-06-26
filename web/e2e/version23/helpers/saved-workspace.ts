import { expect, type Locator, type Page } from "@playwright/test";
import { SYNTHETIC_COMPANY } from "./qa-data";

export async function gotoSavedWorkspace(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/dashboard/saved`);
  await expect(page.getByRole("heading", { name: "Saved analyses" })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Loading saved analyses…")).toHaveCount(0, {
    timeout: 60_000,
  });
}

export async function expectLoadedCount(page: Page, count: number): Promise<void> {
  await expect(page.getByText(`${count} loaded`, { exact: true })).toBeVisible({
    timeout: 60_000,
  });
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
