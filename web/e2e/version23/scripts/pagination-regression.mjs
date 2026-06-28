#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOAD_MORE_ALERT_MESSAGE,
  SAVED_ANALYSES_PAGE_SIZE,
  buildLoadMorePlan,
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

function assertPlanTotals(totalCount, pageSize, expectedSteps) {
  const plan = buildLoadMorePlan(totalCount, pageSize);
  assert(plan.length === expectedSteps.length, `total ${totalCount} must produce ${expectedSteps.length} load-more step(s)`);
  for (let index = 0; index < expectedSteps.length; index += 1) {
    const step = plan[index];
    const expected = expectedSteps[index];
    assert(
      step.beforeCount === expected.beforeCount &&
        step.expectedAddedCount === expected.expectedAddedCount &&
        step.expectedTotalCount === expected.expectedTotalCount &&
        step.expectMoreAvailable === expected.expectMoreAvailable,
      `total ${totalCount} step ${index + 1} must match expected transition`,
    );
  }
  if (plan.length > 0) {
    assert(
      plan[plan.length - 1].expectedTotalCount === totalCount,
      `final planned total must equal account total ${totalCount}`,
    );
  }
}

function runLoadMorePlanRegression() {
  assertPlanTotals(27, SAVED_ANALYSES_PAGE_SIZE, [
    {
      beforeCount: 10,
      expectedAddedCount: 10,
      expectedTotalCount: 20,
      expectMoreAvailable: true,
    },
    {
      beforeCount: 20,
      expectedAddedCount: 7,
      expectedTotalCount: 27,
      expectMoreAvailable: false,
    },
  ]);
  assert(
    buildLoadMorePlan(27, SAVED_ANALYSES_PAGE_SIZE)[1].expectedAddedCount === 7,
    "final addition for 27-record account must be 7",
  );

  assertPlanTotals(23, SAVED_ANALYSES_PAGE_SIZE, [
    {
      beforeCount: 10,
      expectedAddedCount: 10,
      expectedTotalCount: 20,
      expectMoreAvailable: true,
    },
    {
      beforeCount: 20,
      expectedAddedCount: 3,
      expectedTotalCount: 23,
      expectMoreAvailable: false,
    },
  ]);

  assertPlanTotals(25, SAVED_ANALYSES_PAGE_SIZE, [
    {
      beforeCount: 10,
      expectedAddedCount: 10,
      expectedTotalCount: 20,
      expectMoreAvailable: true,
    },
    {
      beforeCount: 20,
      expectedAddedCount: 5,
      expectedTotalCount: 25,
      expectMoreAvailable: false,
    },
  ]);

  assertPlanTotals(21, SAVED_ANALYSES_PAGE_SIZE, [
    {
      beforeCount: 10,
      expectedAddedCount: 10,
      expectedTotalCount: 20,
      expectMoreAvailable: true,
    },
    {
      beforeCount: 20,
      expectedAddedCount: 1,
      expectedTotalCount: 21,
      expectMoreAvailable: false,
    },
  ]);

  assert(buildLoadMorePlan(10, SAVED_ANALYSES_PAGE_SIZE).length === 0, "total 10 requires no Load More action");
  assert(buildLoadMorePlan(5, SAVED_ANALYSES_PAGE_SIZE).length === 0, "total below 10 requires no Load More action");

  assertThrows(
    () => buildLoadMorePlan(-1, SAVED_ANALYSES_PAGE_SIZE),
    "Account total must be a non-negative integer",
  );
  assertThrows(
    () => buildLoadMorePlan(23.5, SAVED_ANALYSES_PAGE_SIZE),
    "Account total must be a non-negative integer",
  );
  assertThrows(
    () => buildLoadMorePlan(23, 0),
    "Page size must be a positive integer",
  );

  const baselineAwareTotal = 23 + 4;
  assert(
    buildLoadMorePlan(baselineAwareTotal, SAVED_ANALYSES_PAGE_SIZE).length === 2,
    "23 current-run records can coexist with 4 pre-existing records for a 27-record account",
  );
}

function runPaginationMathRegression() {
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
      addedCount: 7,
      totalCount: 27,
      expectMoreAvailable: false,
    }) ===
      "Loaded 7 more analyses. 27 analyses loaded. No more saved analyses to load.",
    "27-record final page success status must include the no-more suffix",
  );
  assert(
    formatPaginationSuccessStatus({
      addedCount: 3,
      totalCount: 23,
      expectMoreAvailable: false,
    }) ===
      "Loaded 3 more analyses. 23 analyses loaded. No more saved analyses to load.",
    "23-record final page success status must include the no-more suffix",
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
  const parsed27 = parsePaginationSuccessStatus(
    "Loaded 7 more analyses. 27 analyses loaded. No more saved analyses to load.",
  );
  assert(
    parsed27.addedCount === 7 && parsed27.totalCount === 27 && parsed27.hasNoMoreSuffix,
    "27-record final status must parse",
  );
  const parsed23 = parsePaginationSuccessStatus(
    "Loaded 3 more analyses. 23 analyses loaded. No more saved analyses to load.",
  );
  assert(
    parsed23.addedCount === 3 && parsed23.totalCount === 23 && parsed23.hasNoMoreSuffix,
    "23 current-run final status must parse",
  );
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
}

function runSourceRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const specSource = readFileSync(specPath, "utf8");
  const workspaceSource = readFileSync(join(helpersDir, "saved-workspace.ts"), "utf8");
  const supabaseSource = readFileSync(join(helpersDir, "supabase-admin.ts"), "utf8");

  assert(
    workspaceSource.includes("#saved-analyses-pagination-status"),
    "pagination status must use the dedicated status element",
  );
  assert(
    workspaceSource.includes("LOAD_MORE_ALERT_MESSAGE"),
    "pagination helper must detect load-more alerts",
  );
  assert(
    workspaceSource.includes("buildLoadMorePlan"),
    "saved-workspace must expose generic load-more planning",
  );
  assert(
    flowsSource.includes("loadMoreAndExpectSuccess(page"),
    "loadAllUserARecords must use the reusable pagination success helper",
  );
  assert(
    flowsSource.includes("countSavedAnalysesForOwner(config, \"A\")"),
    "loadAllUserARecords must obtain a fresh Node-side account count",
  );
  assert(
    !flowsSource.includes("expectedTotalCount: 23"),
    "loadAllUserARecords must not hard-code final total 23",
  );
  assert(
    specSource.includes("buildLoadMorePlan(accountTotal"),
    "Pagination test must build transitions from the dynamic account total",
  );
  assert(
    specSource.includes("countSavedAnalysesForOwner(config, \"A\")"),
    "Pagination test must obtain the dynamic account total",
  );
  assert(
    specSource.includes("expect(currentRunRecordCount).toBe(23)"),
    "Pagination test must still require exactly 23 current-run manifest records",
  );
  assert(
    !specSource.includes("expectedTotalCount: 23"),
    "Pagination test must not hard-code final account total 23",
  );
  assert(
    specSource.includes("verifyCurrentRunVisibleCoverage(page, config, preexistingCount)"),
    "Pagination test must verify current-run coverage separately from account total",
  );
  assert(
    flowsSource.includes("currentRunTitleSet.has(title)"),
    "pagination ordering must filter out pre-existing titles before comparison",
  );
  assert(
    specSource.includes("setSearchQuery(page, `V23 QA ${config.runId}`)"),
    "Selection must scope Select all visible to the exact current run",
  );
  assert(
    specSource.match(/Keyboard accessibility[\s\S]*setSearchQuery\(page, `V23 QA \$\{config\.runId\}`\)/),
    "Keyboard Select All must be scoped to the exact current run",
  );
  assert(
    specSource.includes("expect(rows).toHaveLength(accountTotal)"),
    "Loaded CSV row count must use the dynamic account total",
  );
  assert(
    specSource.includes("rows.filter((row) => row.job_title === title)"),
    "Loaded CSV must still verify all current-run titles",
  );
  assert(
    specSource.includes("accountTotalBefore - 2"),
    "Selected-deletion success must use beforeTotal - 2",
  );
  assert(
    workspaceSource.includes("USER_B_EXPECTED_BASELINE_LOADED_COUNT = 1"),
    "User B baseline must remain strict at 1",
  );
  assert(
    supabaseSource.includes("count: \"exact\", head: true"),
    "Node-only account count helper must use a count-only Supabase query",
  );
  assert(
    !specSource.includes("page.evaluate") ||
      !specSource.includes("supabaseElevatedKey"),
    "no elevated credential may be passed to browser code",
  );
  assert(
    supabaseSource.includes("cleanupCurrentRun"),
    "cleanup must continue to operate on current-run manifest records",
  );
  assert(
    supabaseSource.includes(".eq(\"id\", record.id)"),
    "cleanup must continue to target exact manifest IDs",
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
    specSource.includes("verifyPaginationOrdering(page, config)"),
    "pagination ordering verification must remain after all records load",
  );
}

async function runBrowserBackedPaginationRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const { paginationStatus } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const finalStatus = formatPaginationSuccessStatus({
      addedCount: 7,
      totalCount: 27,
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

async function runSelectAllScopingRegression() {
  const { chromium, expect } = await import("@playwright/test");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const runId = "regression-run";
    const accountTotal = 27;
    const currentRunTitles = Array.from({ length: 23 }, (_, index) => {
      const number = String(index + 1).padStart(2, "0");
      return `V23 QA ${runId} A ${number}`;
    });

    const rows = currentRunTitles
      .map(
        (title) =>
          `<label><input type="checkbox" aria-label="Select saved analysis ${title}" />${title}</label>`,
      )
      .join("");
    await page.setContent(
      `<main>
        <input placeholder="Search saved analyses…" value="V23 QA ${runId}" />
        <p>23 of ${accountTotal}</p>
        <label><input type="checkbox" aria-label="Select all visible" />Select all visible</label>
        ${rows}
        <script>
          const selectAll = document.querySelector('[aria-label="Select all visible"]');
          selectAll.addEventListener('change', (event) => {
            const checked = event.target.checked;
            document.querySelectorAll('input[aria-label^="Select saved analysis"]').forEach((input) => {
              input.checked = checked;
            });
          });
        </script>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByText(`23 of ${accountTotal}`, { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Select all visible").check();

    let selectedCount = 0;
    for (const title of currentRunTitles) {
      if (await page.getByLabel(`Select saved analysis ${title}`).isChecked()) {
        selectedCount += 1;
      }
    }
    assert(selectedCount === 23, "Select all visible must select only current-run rows");
    assert(
      (await page.locator('input[type="checkbox"]:checked').count()) === 24,
      "Select all visible must not select hidden pre-existing rows",
    );
  } finally {
    await browser.close();
  }
}

try {
  runLoadMorePlanRegression();
  runPaginationMathRegression();
  runPluralizationRegression();
  runParsingRegression();
  runUniquenessRegression();
  runSourceRegression();
  await runBrowserBackedPaginationRegression();
  await runSelectAllScopingRegression();
  console.log("Version 23 pagination regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
