#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOAD_MORE_ALERT_MESSAGE,
  formatPaginationSuccessStatus,
  parsePaginationSuccessStatus,
  pluralizeAnalysisWord,
  validateUniqueSavedRowTitles,
} from "../helpers/saved-workspace.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const helpersDir = join(scriptDir, "../helpers");
const specPath = join(scriptDir, "../version23-data-controls.spec.ts");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error(`Expected failure containing "${expectedMessage}"`);
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes(expectedMessage),
      `Expected "${expectedMessage}", got "${error instanceof Error ? error.message : error}"`,
    );
  }
}

function runPaginationMathRegression() {
  assert(10 + 10 + 3 === 23, "User A pagination must load 10, then 10, then 3 records");
  assert(
    formatPaginationSuccessStatus({
      addedCount: 10,
      totalCount: 20,
      expectMoreAvailable: true,
    }) === "Loaded 10 more analyses. 20 analyses loaded.",
    "first page success status must match production format",
  );
  assert(
    formatPaginationSuccessStatus({
      addedCount: 3,
      totalCount: 23,
      expectMoreAvailable: false,
    }) ===
      "Loaded 3 more analyses. 23 analyses loaded. No more saved analyses to load.",
    "final page success status must include the no-more suffix",
  );
}

function runPluralizationRegression() {
  assert(
    formatPaginationSuccessStatus({
      addedCount: 1,
      totalCount: 11,
      expectMoreAvailable: true,
    }) === "Loaded 1 more analysis. 11 analyses loaded.",
    "singular added-count grammar must be supported",
  );
  assert(pluralizeAnalysisWord(1) === "analysis", "singular analysis label");
  assert(pluralizeAnalysisWord(3) === "analyses", "plural analyses label");
}

function runParsingRegression() {
  const parsed = parsePaginationSuccessStatus(
    "Loaded 3 more analyses. 23 analyses loaded. No more saved analyses to load.",
  );
  assert(parsed.addedCount === 3 && parsed.totalCount === 23 && parsed.hasNoMoreSuffix, "final status must parse");
  const interim = parsePaginationSuccessStatus("Loaded 10 more analyses. 20 analyses loaded.");
  assert(interim.addedCount === 10 && interim.totalCount === 20 && !interim.hasNoMoreSuffix, "interim status must parse");
}

function runUniquenessRegression() {
  validateUniqueSavedRowTitles(["a", "b", "c"], 3);
  assertThrows(
    () => validateUniqueSavedRowTitles(["a", "a"], 2),
    "duplicate titles",
  );
  assertThrows(
    () => validateUniqueSavedRowTitles(["a", "b"], 3),
    "Expected 3 visible saved rows; observed 2.",
  );
  assertThrows(
    () => validateUniqueSavedRowTitles(Array.from({ length: 22 }, (_, i) => `row-${i}`), 23),
    "Expected 23 visible saved rows; observed 22.",
  );
  assertThrows(
    () => validateUniqueSavedRowTitles(Array.from({ length: 24 }, (_, i) => `row-${i}`), 23),
    "Expected 23 visible saved rows; observed 24.",
  );
}

function runSourceRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const specSource = readFileSync(specPath, "utf8");
  const workspaceSource = readFileSync(join(helpersDir, "saved-workspace.ts"), "utf8");

  assert(
    workspaceSource.includes('#saved-analyses-pagination-status'),
    "pagination status must use the dedicated status element",
  );
  assert(
    workspaceSource.includes("LOAD_MORE_ALERT_MESSAGE"),
    "pagination helper must detect load-more alerts",
  );
  assert(
    flowsSource.includes("loadMoreAndExpectSuccess(page"),
    "loadAllUserARecords must use the reusable pagination success helper",
  );
  assert(
    specSource.includes("loadMoreAndExpectSuccess(page"),
    "Pagination test must use the reusable pagination success helper",
  );
  assert(
    !flowsSource.includes('getByText("Loaded 3 more analyses.")'),
    "loadAllUserARecords must not wait on page-wide Loaded 3 more analyses text",
  );
  assert(
    !specSource.includes('getByText("Loaded 3 more analyses.")'),
    "Pagination test must not wait on page-wide Loaded 3 more analyses text",
  );
  assert(
    specSource.includes("interceptNext(page, isSavedList"),
    "Incremental failure and retry must keep its intentional interceptor path",
  );
  assert(
    specSource.includes("verifyPaginationOrdering(page, qaConfig())"),
    "pagination ordering verification must remain after all records load",
  );

  const firstHelper = specSource.indexOf("expectedTotalCount: 20");
  const secondHelper = specSource.indexOf("expectedTotalCount: 23");
  assert(firstHelper >= 0 && secondHelper > firstHelper, "Pagination test must load 20 then 23");
}

async function runBrowserBackedPaginationRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const { paginationStatus } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const finalStatus = formatPaginationSuccessStatus({
      addedCount: 3,
      totalCount: 23,
      expectMoreAvailable: false,
    });
    await page.setContent(
      `<main><p id="saved-analyses-pagination-status">${finalStatus}</p></main>`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(paginationStatus(page)).toHaveText(finalStatus);
    await expect(paginationStatus(page)).toHaveCount(1);

    const alertPage = await browser.newPage();
    await alertPage.setContent(
      `<div role="alert">${LOAD_MORE_ALERT_MESSAGE}</div>`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      alertPage.getByRole("alert").filter({ hasText: LOAD_MORE_ALERT_MESSAGE }),
    ).toBeVisible();
    await alertPage.close();
  } finally {
    await browser.close();
  }
}

try {
  runPaginationMathRegression();
  runPluralizationRegression();
  runParsingRegression();
  runUniquenessRegression();
  runSourceRegression();
  await runBrowserBackedPaginationRegression();
  console.log("Version 23 pagination regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
