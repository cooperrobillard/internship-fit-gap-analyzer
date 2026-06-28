#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SAVED_ANALYSES_PAGE_SIZE,
  buildLoadMorePlan,
  formatPaginationSuccessStatus,
  parsePaginationSuccessStatus,
  pluralizeAnalysisWord,
  validateUniqueSavedRowTitles,
} from "../helpers/saved-workspace.ts";
import { isSavedListPageRequest } from "../helpers/network.ts";

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

async function assertThrowsAsync(fn, expectedMessage) {
  try {
    await fn();
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
    specSource.includes("interceptMatching(") &&
      specSource.includes("isSavedListPageRequest") &&
      specSource.includes("fulfillSyntheticPostgrestFailure"),
    "Incremental failure and retry must keep its intentional interceptor path",
  );
  assert(
    specSource.includes("verifyPaginationOrdering(page, config)"),
    "pagination ordering verification must remain after all records load",
  );
  assert(
    !workspaceSource.includes('getAttribute("aria-label")'),
    "readVisibleTitles must not parse aria-label attributes for titles",
  );
  assert(
    !workspaceSource.includes("/^Open saved analysis (.+), /"),
    "greedy aria-label title regex must be absent from title extraction",
  );
  assert(
    workspaceSource.includes("savedAnalysisOpenButtons"),
    "savedAnalysisOpenButtons must centralize saved-row open button location",
  );
  assert(
    workspaceSource.includes('name: /^Open saved analysis /'),
    "savedAnalysisOpenButtons must keep the accessible button name",
  );
  assert(
    flowsSource.includes("readVisibleTitles(page)"),
    "verifyCurrentRunVisibleCoverage must use readVisibleTitles",
  );
  assert(
    flowsSource.includes("readVisibleTitles(page)") &&
      flowsSource.includes("verifyPaginationOrdering"),
    "verifyPaginationOrdering must use readVisibleTitles",
  );
}

function extractIncrementalFailureBlock(specSource) {
  const startMarker = 'test.describe("Incremental failure and retry"';
  const endMarker = 'test.describe("Search and filters across pages"';
  const start = specSource.indexOf(startMarker);
  const end = specSource.indexOf(endMarker);
  if (start < 0 || end <= start) {
    throw new Error("Unable to locate Incremental failure and retry test block.");
  }
  return specSource.slice(start, end);
}

function runIncrementalFailureSourceRegression() {
  const specSource = readFileSync(specPath, "utf8");
  const block = extractIncrementalFailureBlock(specSource);

  assert(
    block.includes("interceptMatching(") && block.includes("isSavedListPageRequest"),
    "incremental failure test must use the exact saved-list page matcher",
  );
  assert(
    !block.includes("interceptNext("),
    "incremental failure test must not use the one-shot interceptNext matcher",
  );
  assert(
    !block.includes("isSavedList,") && !block.includes("isSavedList\n"),
    "incremental failure test must not use the broad isSavedList matcher",
  );
  assert(
    block.includes("offset: SAVED_ANALYSES_PAGE_SIZE") &&
      block.includes("pageSize: SAVED_ANALYSES_PAGE_SIZE"),
    "incremental failure test must derive offset and pageSize from SAVED_ANALYSES_PAGE_SIZE",
  );
  assert(
    block.includes("expect(interceptor.seen()).toBe(0)"),
    "incremental failure test must prove no request matched before clicking Load More",
  );
  assert(
    block.includes("titleForUserA(config, 5)"),
    "incremental failure test must use a currently loaded target",
  );

  const openDetailIndex = block.indexOf("openAnalysisDetail(page, targetTitle)");
  const setSearchIndex = block.indexOf("setSearchQuery(page, targetTitle)");
  assert(
    openDetailIndex >= 0 && setSearchIndex > openDetailIndex,
    "incremental failure test must open the target before applying the matching search",
  );
  assert(
    !block.includes('setSearchQuery(page, "pagination")'),
    'incremental failure test must not use "pagination" to filter the A 06 target',
  );
  assert(
    !block.includes('switchWorkspaceView(page, "Compare")'),
    "incremental failure test must not switch to Compare before Load More",
  );
  assert(
    block.includes("await expectLoadedCount(page, 10)"),
    "incremental failure test must verify the failed request leaves 10 loaded records",
  );
  assert(
    block.includes("toBeChecked()"),
    "incremental failure test must verify selection remains checked",
  );
  assert(
    block.includes("toHaveValue(") && block.includes("targetTitle"),
    "incremental failure test must verify the search value remains",
  );
  assert(
    block.includes("exact: true"),
    "incremental failure test must verify the detail heading remains visible",
  );
  assert(
    block.includes("interceptor.unroute()"),
    "incremental failure test must unroute before retry",
  );
  assert(
    block.includes('getByRole("button", { name: "Load more analyses" })') &&
      block.includes("toBeEnabled()"),
    "incremental failure test must verify Load More remains enabled after failure",
  );
  assert(
    block.includes("await expectLoadedCount(page, 20)"),
    "incremental failure test must reach 20 loaded records after retry",
  );
  assert(
    block.includes("expectVisibleCountSummary(page, 1, 20)"),
    "incremental failure test must verify 1 of 20 while the unique search remains active",
  );

  const clearSearchIndex = block.indexOf('setSearchQuery(page, "")');
  const twentyRowsIndex = block.indexOf("expect(visibleCount).toBe(20)");
  assert(
    clearSearchIndex >= 0 && twentyRowsIndex > clearSearchIndex,
    "incremental failure test must clear search before asserting 20 rendered saved rows",
  );
  assert(
    block.includes("expectNoUnsafeText(page)"),
    "incremental failure test must keep privacy coverage",
  );
  assert(
    !block.includes("test.setTimeout"),
    "incremental failure test must not increase the full test timeout",
  );
  assert(
    block.includes("expectLoadMoreFailureAlert(page"),
    "incremental failure test must call the dedicated load-more failure alert helper",
  );
  assert(
    !block.includes('expect(page.getByRole("alert")).toContainText('),
    "incremental failure test must not use the broad page-wide alert assertion",
  );
  assert(
    block.includes(".poll(() => interceptor.seen()") &&
      block.includes("toBeGreaterThanOrEqual(1)"),
    "incremental failure test must poll for at least one intercepted attempt",
  );
  assert(
    !block.includes("interceptor.assertSeen(1)"),
    "incremental failure test must not require exactly one underlying request",
  );
  assert(
    block.includes("failureAttemptCount") &&
      block.includes("toBeGreaterThanOrEqual(1)"),
    "incremental failure test must record the observed failure-attempt count",
  );
  assert(
    block.includes("interceptorActive"),
    "incremental failure test must use guarded interceptor cleanup",
  );
  assert(
    block.includes("fulfillSyntheticPostgrestFailure"),
    "incremental failure test must use the synthetic PostgREST failure helper",
  );
  assert(
    !block.includes('route.abort("failed")'),
    "incremental failure test must not use transport abort for saved-list failure",
  );
  assert(
    block.includes(".poll(() => interceptor.seen()"),
    "incremental failure test must poll interceptor.seen() before UI assertions",
  );

  const pollIndex = block.indexOf(".poll(() => interceptor.seen()");
  const alertIndex = block.indexOf("expectLoadMoreFailureAlert(page");
  assert(
    pollIndex >= 0 && alertIndex > pollIndex,
    "incremental failure test must confirm interception before asserting the application alert",
  );
  assert(
    block.includes("matchingLoadMoreAttempts: interceptor.seen()"),
    "incremental failure test must pass safe attempt-count diagnostics",
  );
  assert(
    block.includes("await interceptor.unroute()"),
    "incremental failure test must remove the interceptor before retry",
  );
  assert(
    block.includes("finally") &&
      block.includes("interceptorActive") &&
      block.includes("interceptor.unroute()"),
    "incremental failure test must guarantee interceptor cleanup",
  );
}

function runSavedListPageRequestRegression() {
  const pageSize = SAVED_ANALYSES_PAGE_SIZE;
  const offset = SAVED_ANALYSES_PAGE_SIZE;
  const base = "https://qa-local.invalid/rest/v1/job_analyses";
  const options = { offset, pageSize };

  assert(
    isSavedListPageRequest(`${base}?select=id&offset=10&limit=11`, "GET", options),
    "predicate must accept the first Load More list page request",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=0&limit=11`, "GET", options),
    "predicate must reject the initial list page request",
  );
  assert(
    !isSavedListPageRequest(
      `${base}?select=id&id=eq.synthetic-id`,
      "GET",
      options,
    ),
    "predicate must reject detail requests with an id filter",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=20&limit=11`, "GET", options),
    "predicate must reject the wrong offset",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=10&limit=10`, "GET", options),
    "predicate must reject the wrong limit",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=10&limit=11`, "POST", options),
    "predicate must reject POST requests",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=10&limit=11`, "DELETE", options),
    "predicate must reject DELETE requests",
  );
  assert(
    !isSavedListPageRequest(`${base}?select=id&offset=10&limit=11`, "HEAD", options),
    "predicate must reject HEAD requests",
  );
  assert(
    !isSavedListPageRequest(
      "https://qa-local.invalid/rest/v1/other_table?select=id&offset=10&limit=11",
      "GET",
      options,
    ),
    "predicate must reject another table",
  );
  assert(
    !isSavedListPageRequest(`${base}?offset=10&limit=11`, "GET", options),
    "predicate must reject URLs without select",
  );
  assert(
    !isSavedListPageRequest("not-a-url", "GET", options),
    "predicate must safely reject malformed URLs",
  );
  assert(
    isSavedListPageRequest(`${base}?offset=10&select=id&limit=11`, "GET", options),
    "predicate must not depend on query-parameter ordering",
  );
}

function runLoadMoreFailureAlertSourceRegression() {
  const workspaceSource = readFileSync(join(helpersDir, "saved-workspace.ts"), "utf8");

  assert(
    workspaceSource.includes("export const LOAD_MORE_ALERT_MESSAGE"),
    "LOAD_MORE_ALERT_MESSAGE must remain the central message constant",
  );
  assert(
    workspaceSource.includes("export function loadMoreFailureAlert"),
    "a dedicated load-more failure alert locator must exist",
  );
  assert(
    workspaceSource.includes('getByRole("alert")') &&
      workspaceSource.includes("filter({ hasText: LOAD_MORE_ALERT_MESSAGE })"),
    "the locator must filter semantic alerts using LOAD_MORE_ALERT_MESSAGE",
  );
  assert(
    !workspaceSource.includes("loadMoreFailureAlert(page).first()") &&
      !workspaceSource.includes("loadMoreFailureAlert(page).last()") &&
      !workspaceSource.includes('.getByRole("alert").first()') &&
      !workspaceSource.includes('.getByRole("alert").last()'),
    "the load-more failure alert locator must not use positional selection",
  );
  assert(
    !workspaceSource.includes("__next-route-announcer__"),
    "the locator must not target the Next.js route announcer directly",
  );
  assert(
    workspaceSource.includes("export async function expectLoadMoreFailureAlert"),
    "a bounded load-more failure alert assertion helper must exist",
  );
  assert(
    workspaceSource.includes("toHaveCount(1") &&
      workspaceSource.includes("toHaveText(LOAD_MORE_ALERT_MESSAGE"),
    "the assertion must require exactly one alert with the exact message",
  );
  assert(
    workspaceSource.includes("LOAD_MORE_FAILURE_ALERT_TIMEOUT_MS"),
    "the assertion must use a bounded timeout constant",
  );
  assert(
    workspaceSource.includes("15_000"),
    "the bounded timeout must be approximately 10-15 seconds",
  );
  assert(
    workspaceSource.includes("loadMoreFailureAlert(page)") &&
      workspaceSource.includes("loadMoreAndExpectSuccess"),
    "loadMoreAndExpectSuccess must reuse the central load-more failure alert locator",
  );
  assert(
    workspaceSource.includes("matchingLoadMoreAttempts"),
    "load-more failure diagnostics must support safe attempt-count reporting",
  );
}

function runSyntheticPostgrestFailureSourceRegression() {
  const networkSource = readFileSync(join(helpersDir, "network.ts"), "utf8");
  const helperStart = networkSource.indexOf(
    "export async function fulfillSyntheticPostgrestFailure",
  );
  const helperEnd = networkSource.indexOf("export function savedDeleteUrlIncludesId");
  assert(
    helperStart >= 0 && helperEnd > helperStart,
    "a synthetic PostgREST failure helper must exist",
  );
  const helperBody = networkSource.slice(helperStart, helperEnd);

  assert(
    helperBody.includes("route.fulfill(") && !helperBody.includes("route.abort("),
    "the synthetic failure helper must use route.fulfill(), not route.abort()",
  );
  assert(
    helperBody.includes("status: 503"),
    "the synthetic failure helper must return a non-2xx status",
  );
  assert(
    helperBody.includes("contentType: \"application/json\"") &&
      helperBody.includes("JSON.stringify"),
    "the synthetic failure helper must return valid JSON",
  );
  assert(
    helperBody.includes("QA_SYNTHETIC_FAILURE") &&
      helperBody.includes("Synthetic Version 23 QA request failure."),
    "the synthetic failure body must contain only safe synthetic fields",
  );
  assert(
    !helperBody.includes("route.fetch("),
    "the synthetic failure helper must not call route.fetch()",
  );
  assert(
    !helperBody.includes("authorization") &&
      !helperBody.includes("console.log") &&
      !helperBody.includes("request.url"),
    "the synthetic failure helper must not log authorization headers, cookies, tokens, or URLs",
  );
}

async function runBrowserBackedSyntheticPostgrestFailureRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const {
    fulfillSyntheticPostgrestFailure,
    interceptNext,
  } = await import("../helpers/network.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<main>ready</main>", {
      waitUntil: "domcontentloaded",
    });

    const fakeUrl = "https://qa-local.invalid/rest/v1/job_analyses?select=id";
    const isFakeSavedList = (url, method) =>
      method === "GET" && url.includes("qa-local.invalid/rest/v1/job_analyses");

    const interceptor = await interceptNext(
      page,
      isFakeSavedList,
      fulfillSyntheticPostgrestFailure,
    );
    try {
      const result = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return {
          status: response.status,
          json: await response.json(),
        };
      }, fakeUrl);

      await expect
        .poll(() => interceptor.seen(), {
          timeout: 10_000,
          message: "Expected the synthetic local failure request to be intercepted.",
        })
        .toBe(1);
      interceptor.assertSeen(1);
      assert(result.status === 503, "synthetic failure must return status 503");
      assert(
        result.json?.code === "QA_SYNTHETIC_FAILURE",
        "synthetic failure response json must be parseable",
      );
    } finally {
      await interceptor.unroute();
    }
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedPersistentPaginationInterceptorRegression() {
  const { chromium } = await import("@playwright/test");
  const {
    fulfillSyntheticPostgrestFailure,
    interceptMatching,
    interceptNext,
    isSavedListPageRequest,
  } = await import("../helpers/network.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<main>ready</main>", {
      waitUntil: "domcontentloaded",
    });

    const pageSize = SAVED_ANALYSES_PAGE_SIZE;
    const paginationUrl =
      "https://qa-local.invalid/rest/v1/job_analyses?select=id&offset=10&limit=11";
    const detailUrl =
      "https://qa-local.invalid/rest/v1/job_analyses?select=id&id=eq.synthetic-id";
    const matcherOptions = { offset: pageSize, pageSize };

    const fetchStatus = async (url) =>
      page.evaluate(async (targetUrl) => {
        try {
          const response = await fetch(targetUrl);
          return response.status;
        } catch {
          return 0;
        }
      }, url);

    const failureInterceptor = await interceptMatching(
      page,
      (url, method) => isSavedListPageRequest(url, method, matcherOptions),
      (route) => fulfillSyntheticPostgrestFailure(route),
    );
    try {
      const firstStatus = await fetchStatus(paginationUrl);
      const secondStatus = await fetchStatus(paginationUrl);

      assert(firstStatus === 503, "first pagination attempt must receive synthetic failure");
      assert(secondStatus === 503, "second pagination attempt must receive synthetic failure");
      assert(
        failureInterceptor.seen() === 2,
        "persistent interceptor must fail every matching pagination attempt",
      );

      const seenBeforeDetail = failureInterceptor.seen();
      await fetchStatus(detailUrl);
      assert(
        failureInterceptor.seen() === seenBeforeDetail,
        "detail request must not increment the pagination failure counter",
      );
    } finally {
      await failureInterceptor.unroute();
    }

    const oneShotInterceptor = await interceptNext(
      page,
      (url, method) => isSavedListPageRequest(url, method, matcherOptions),
      fulfillSyntheticPostgrestFailure,
    );
    try {
      const oneShotFirst = await fetchStatus(paginationUrl);
      const oneShotSecond = await fetchStatus(paginationUrl);

      assert(oneShotFirst === 503, "one-shot interceptor must fail the first attempt");
      assert(
        oneShotSecond !== 503,
        "one-shot interceptor must allow a repeated attempt to pass through",
      );
      assert(
        oneShotInterceptor.seen() === 2,
        "one-shot interceptor must observe both matching attempts while failing only the first",
      );
    } finally {
      await oneShotInterceptor.unroute();
    }

    const successHandler = async (route, request) => {
      if (
        isSavedListPageRequest(request.url(), request.method(), matcherOptions)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }
      await route.continue();
    };
    await page.route("**/*", successHandler);
    try {
      const retryStatus = await fetchStatus(paginationUrl);
      assert(retryStatus === 200, "pagination request must succeed after failure route removal");
    } finally {
      await page.unroute("**/*", successHandler);
    }
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedExactLoadMoreRequestRegression() {
  const { chromium } = await import("@playwright/test");
  const {
    fulfillSyntheticPostgrestFailure,
    isSavedListPageRequest,
  } = await import("../helpers/network.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<main>ready</main>", {
      waitUntil: "domcontentloaded",
    });

    const pageSize = SAVED_ANALYSES_PAGE_SIZE;
    const paginationUrl =
      "https://qa-local.invalid/rest/v1/job_analyses?select=id&offset=10&limit=11";
    const detailUrl =
      "https://qa-local.invalid/rest/v1/job_analyses?select=id&id=eq.synthetic-id";
    let paginationIntercepted = false;
    let detailIntercepted = false;

    const handler = async (route, request) => {
      const url = request.url();
      const method = request.method();
      if (
        isSavedListPageRequest(url, method, {
          offset: pageSize,
          pageSize,
        })
      ) {
        paginationIntercepted = true;
        await fulfillSyntheticPostgrestFailure(route);
        return;
      }
      if (method === "GET" && url.includes("id=eq.synthetic-id")) {
        detailIntercepted = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }
      await route.continue();
    };

    await page.route("**/*", handler);
    try {
      const detailStatus = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return response.status;
      }, detailUrl);
      assert(detailStatus === 200, "detail request must not receive synthetic failure");
      assert(detailIntercepted, "detail request must be handled locally");
      assert(!paginationIntercepted, "detail request must not match pagination matcher");

      const paginationStatus = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return response.status;
      }, paginationUrl);

      assert(paginationIntercepted, "pagination request must match the exact matcher");
      assert(
        paginationStatus === 503,
        "pagination request must receive the synthetic failure response",
      );
    } finally {
      await page.unroute("**/*", handler);
    }
  } finally {
    await browser.close();
  }
}

function buildSavedRowButtonHtml({
  title,
  company,
  savedDate,
  missingCount = 1,
}) {
  return `<button
    type="button"
    aria-label="Open saved analysis ${title}, ${company}, saved ${savedDate}"
  >
    <div>
      <p>${title}</p>
      <p>${savedDate}</p>
    </div>
    <div>
      <span>${company}</span>
      <span>Matched 2</span>
      <span>Missing ${missingCount}</span>
    </div>
  </button>`;
}

function extractSearchFilterBlock(specSource) {
  const startMarker = 'test.describe("Search and filters across pages"';
  const endMarker = 'test.describe("Selection"';
  const start = specSource.indexOf(startMarker);
  const end = specSource.indexOf(endMarker);
  if (start < 0 || end <= start) {
    throw new Error("Unable to locate Search and filters across pages test block.");
  }
  return specSource.slice(start, end);
}

function runFixtureSourceRegression() {
  const supabaseSource = readFileSync(
    join(helpersDir, "supabase-admin.ts"),
    "utf8",
  );

  assert(
    supabaseSource.includes("notes: string | null"),
    "seed builder and insert helper must accept null notes",
  );
  assert(
    supabaseSource.includes(": null;") &&
      !supabaseSource.includes('"no notes"'),
    "default seed notes must be null and must not use the literal no-notes phrase",
  );
  assert(
    supabaseSource.includes('"Follow up, high priority"') &&
      supabaseSource.includes('Contact said "review next week"') &&
      supabaseSource.includes('"Has notes"'),
    "indices 2, 3, and 4 must retain their intentional note values",
  );
  assert(
    supabaseSource.includes("index % 2 === 0 ? 2 : 0"),
    "missing-count alternation must remain intact",
  );
}

function runSearchFilterSourceRegression() {
  const specSource = readFileSync(specPath, "utf8");
  const block = extractSearchFilterBlock(specSource);

  assert(
    !block.includes("5, 20") && !block.includes("3, 20"),
    "search/filter test must not hard-code stale missing or notes counts",
  );
  assert(
    block.includes("const config = qaConfig();"),
    "search/filter test must resolve config once",
  );
  assert(
    block.includes("readVisibleSavedRowSummaries(page)") &&
      block.includes("toHaveLength(20)"),
    "search/filter test must read the twenty-row unfiltered baseline",
  );
  assert(
    block.includes("missingCount > 0") && block.includes("missingCount === 0"),
    "missing-filter counts must be derived from rendered Missing metadata",
  );
  assert(
    block.includes("toBeGreaterThan(0)") &&
      block.includes("(expectedHasMissing + expectedNoMissing).toBe(20)"),
    "both missing categories must be required to be nonempty",
  );
  assert(
    block.includes('setListFilter(page, "Has missing skills")') &&
      block.includes("for (const row of hasMissingRows)") &&
      block.includes("for (const row of baselineRows)"),
    "Has-missing rows must be verified individually against the baseline",
  );
  assert(
    block.includes('setListFilter(page, "No missing skills")') &&
      block.includes("for (const row of noMissingRows)"),
    "No-missing rows must be verified individually against the baseline",
  );
  assert(
    block.includes("UI_SAVE_TITLE_PREFIX") &&
      block.includes("titleForUserA(config, 2)") &&
      block.includes("titleForUserA(config, 3)") &&
      block.includes("titleForUserA(config, 4)"),
    "expected note titles must include the UI-saved record and indices 2, 3, and 4",
  );
  assert(
    block.includes("new Set(notesVisibleTitles)") &&
      block.includes("new Set(expectedNoteTitles)"),
    "notes-filter visible titles must be checked exactly",
  );
  assert(
    block.includes("titleForUserA(config, 5)") &&
      block.includes("expectRowAbsent"),
    "a known null-notes title must be verified absent under Has notes",
  );
  assert(
    block.includes("older-pagination-search-target"),
    "cross-page search target must remain in the test",
  );
  assert(
    block.includes("zzzz-no-loaded-match-zzzz") &&
      block.includes("No saved analyses match this search."),
    "final zero-match search/filter check must remain",
  );
  assert(
    block.includes("expectNoUnsafeText(page)"),
    "search/filter test must include privacy verification",
  );
}

function extractSelectionBlock(specSource) {
  const startMarker = 'test.describe("Selection"';
  const endMarker = 'test.describe("Selected CSV"';
  const start = specSource.indexOf(startMarker);
  const end = specSource.indexOf(endMarker);
  if (start < 0 || end <= start) {
    throw new Error("Unable to locate Selection test block.");
  }
  return specSource.slice(start, end);
}

function runSelectionSourceRegression() {
  const specSource = readFileSync(specPath, "utf8");
  const block = extractSelectionBlock(specSource);

  const initialUncheckedIndex = block.indexOf(
    "await expect(rowCheckbox(page, first)).not.toBeChecked();",
  );
  const initialAbsentDetailIndex = block.indexOf("await expect(firstDetailHeading).toHaveCount(0);");
  const firstCheckIndex = block.indexOf("await rowCheckbox(page, first).check();");
  const checkedDetailAbsentIndex = block.indexOf(
    "await expect(firstDetailHeading).toHaveCount(0);",
    firstCheckIndex + 1,
  );
  const openDetailIndex = block.indexOf("await rowOpenButton(page, first).click();");
  const detailVisibleIndex = block.indexOf("await expect(firstDetailHeading).toBeVisible();");
  const checkedAfterOpenIndex = block.indexOf(
    "await expect(rowCheckbox(page, first)).toBeChecked();",
    openDetailIndex,
  );
  const uncheckIndex = block.indexOf("await rowCheckbox(page, first).uncheck();");
  const detailVisibleAfterUncheckIndex = block.indexOf(
    "await expect(firstDetailHeading).toBeVisible();",
    uncheckIndex,
  );
  const recheckIndex = block.indexOf(
    "await rowCheckbox(page, first).check();",
    uncheckIndex,
  );
  const eleventhCheckIndex = block.indexOf("await rowCheckbox(page, eleventh).check();");
  const twoSelectedIndex = block.indexOf('await expect(page.getByText("2 analyses selected")).toBeVisible();');

  assert(initialUncheckedIndex >= 0, "Selection test must start with an unchecked first checkbox");
  assert(
    initialAbsentDetailIndex > initialUncheckedIndex,
    "Selection test must assert detail is absent before any checkbox interaction",
  );
  assert(
    firstCheckIndex > initialAbsentDetailIndex,
    "Selection test must check the first checkbox after the initial absence assertions",
  );
  assert(
    checkedDetailAbsentIndex > firstCheckIndex,
    "Selection test must assert detail remains absent after checking the checkbox",
  );
  assert(
    openDetailIndex > checkedDetailAbsentIndex,
    "Selection test must open detail only after checkbox selection is established",
  );
  assert(
    detailVisibleIndex > openDetailIndex &&
      checkedAfterOpenIndex > detailVisibleIndex,
    "Selection test must assert detail opens and the checkbox remains checked",
  );

  const afterOpenSlice = block.slice(openDetailIndex, uncheckIndex);
  assert(
    !afterOpenSlice.includes("await expect(rowCheckbox(page, first)).not.toBeChecked();"),
    "Selection test must not expect the checkbox to clear when detail opens",
  );

  assert(
    uncheckIndex > checkedAfterOpenIndex &&
      detailVisibleAfterUncheckIndex > uncheckIndex &&
      recheckIndex > detailVisibleAfterUncheckIndex &&
      eleventhCheckIndex > recheckIndex &&
      twoSelectedIndex > eleventhCheckIndex,
    "Selection test must preserve open detail through uncheck and restore two-row selection",
  );

  const hiddenSearchIndex = block.indexOf("await setSearchQuery(page, eleventh);");
  const filteredSummaryIndex = block.indexOf(
    "await expectVisibleCountSummary(page, 1, accountTotal);",
  );
  const eleventhVisibleIndex = block.indexOf("await expectRowVisible(page, eleventh);");
  const eleventhCheckedIndex = block.indexOf(
    "await expect(rowCheckbox(page, eleventh)).toBeChecked();",
  );
  const firstAbsentIndex = block.indexOf("await expectRowAbsent(page, first);");
  const hiddenStatusIndex = block.indexOf(
    "2 analyses selected; 1 is hidden by the current search or filter.",
  );
  const clearSelectionIndex = block.indexOf(
    'await page.getByRole("button", { name: "Clear selection" }).click();',
  );
  const noSelectionIndex = block.indexOf(
    'await expect(page.getByText("No analyses selected.")).toBeVisible();',
  );
  const eleventhUncheckedIndex = block.indexOf(
    "await expect(rowCheckbox(page, eleventh)).not.toBeChecked();",
  );
  const currentRunSearchIndex = block.indexOf(
    "await setSearchQuery(page, `V23 QA ${config.runId}`);",
  );
  const firstUncheckedAfterRestoreIndex = block.indexOf(
    "await expect(rowCheckbox(page, first)).not.toBeChecked();",
    currentRunSearchIndex,
  );

  assert(
    hiddenSearchIndex > twoSelectedIndex &&
      filteredSummaryIndex > hiddenSearchIndex &&
      eleventhVisibleIndex > filteredSummaryIndex &&
      eleventhCheckedIndex > eleventhVisibleIndex &&
      firstAbsentIndex > eleventhCheckedIndex &&
      hiddenStatusIndex > firstAbsentIndex &&
      clearSelectionIndex > hiddenStatusIndex &&
      noSelectionIndex > clearSelectionIndex &&
      eleventhUncheckedIndex > noSelectionIndex &&
      currentRunSearchIndex > eleventhUncheckedIndex &&
      firstUncheckedAfterRestoreIndex > currentRunSearchIndex,
    "Selection test must verify one visible and one hidden selected row before clearing",
  );

  assert(
    !block.includes("older-pagination-search-target"),
    "Selection test must not reuse the cross-page pagination search target",
  );
  assert(
    !block.includes("2 is hidden by the current search or filter"),
    "Selection test must not expect two hidden selected rows",
  );
  assert(
    block.includes(
      "2 analyses selected; 1 is hidden by the current search or filter.",
    ),
    "Selection test must assert the exact singular hidden-selection status",
  );
  assert(
    block.includes('getByRole("button", { name: "Clear selection" })'),
    "Selection test must verify Clear selection",
  );
  assert(
    block.includes('getByLabel("Select all visible")'),
    "Selection test must verify Select all visible",
  );
  assert(
    block.includes("23 analyses selected"),
    "Selection test must verify twenty-three current-run selections",
  );
  assert(
    block.includes("all account analyses|unloaded records") &&
      block.includes("expectNoUnsafeText(page)"),
    "Selection test must reject misleading account-wide claims and verify privacy",
  );
}

async function runBrowserBackedSelectionDetailIndependenceRegression() {
  const { chromium, expect } = await import("@playwright/test");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const title = "First role";
    await page.setContent(
      `<main id="workspace">
        <label id="row-select">
          <input type="checkbox" id="row-check" aria-label="Select saved analysis ${title}" />
          Select
        </label>
        <button type="button" id="open-detail" aria-label="Open saved analysis ${title}">
          Open detail
        </button>
        <section id="detail-panel" hidden>
          <h2>${title}</h2>
        </section>
        <script>
          const checkbox = document.getElementById("row-check");
          const openButton = document.getElementById("open-detail");
          const detail = document.getElementById("detail-panel");
          openButton.addEventListener("click", () => {
            detail.hidden = false;
          });
        </script>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    const structure = await page.evaluate(() => {
      const workspace = document.getElementById("workspace");
      const selectLabel = document.getElementById("row-select");
      const openButton = document.getElementById("open-detail");
      return {
        sameParent:
          selectLabel?.parentElement === openButton?.parentElement &&
          workspace?.contains(selectLabel) &&
          workspace?.contains(openButton),
        nested:
          selectLabel?.contains(openButton) === true ||
          openButton?.contains(selectLabel) === true,
      };
    });
    assert(structure.sameParent, "checkbox and detail controls must be sibling elements");
    assert(!structure.nested, "checkbox and detail controls must not be nested");

    const checkbox = page.getByLabel(`Select saved analysis ${title}`);
    const detailHeading = page.getByRole("heading", { level: 2, name: title, exact: true });

    await expect(detailHeading).toHaveCount(0);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(detailHeading).toHaveCount(0);

    await page.getByRole("button", { name: `Open saved analysis ${title}` }).click();
    await expect(detailHeading).toBeVisible();
    await expect(checkbox).toBeChecked();

    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await expect(detailHeading).toBeVisible();
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedHiddenSelectionRegression() {
  const { chromium, expect } = await import("@playwright/test");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const firstTitle = "V23 QA run A 01";
    const eleventhTitle = "V23 QA run A 11";
    await page.setContent(
      `<main>
        <input id="search" placeholder="Search saved analyses…" value="" />
        <p id="selection-status">2 analyses selected</p>
        <label id="row-first" data-title="${firstTitle}">
          <input type="checkbox" id="check-first" aria-label="Select saved analysis ${firstTitle}" checked />
          ${firstTitle}
        </label>
        <label id="row-eleventh" data-title="${eleventhTitle}">
          <input type="checkbox" id="check-eleventh" aria-label="Select saved analysis ${eleventhTitle}" checked />
          ${eleventhTitle}
        </label>
        <button type="button" id="clear-selection">Clear selection</button>
        <script>
          const search = document.getElementById("search");
          const status = document.getElementById("selection-status");
          const rowFirst = document.getElementById("row-first");
          const rowEleventh = document.getElementById("row-eleventh");
          const checkFirst = document.getElementById("check-first");
          const checkEleventh = document.getElementById("check-eleventh");
          const clearButton = document.getElementById("clear-selection");
          const hiddenStatus =
            "2 analyses selected; 1 is hidden by the current search or filter.";

          function updateVisibility() {
            const query = search.value.trim().toLowerCase();
            const firstVisible = !query || rowFirst.dataset.title.toLowerCase().includes(query);
            const eleventhVisible =
              !query || rowEleventh.dataset.title.toLowerCase().includes(query);
            rowFirst.hidden = !firstVisible;
            rowEleventh.hidden = !eleventhVisible;

            const selectedCount =
              Number(checkFirst.checked) + Number(checkEleventh.checked);
            const hiddenSelectedCount =
              Number(checkFirst.checked && !firstVisible) +
              Number(checkEleventh.checked && !eleventhVisible);

            if (selectedCount === 0) {
              status.textContent = "No analyses selected.";
              return;
            }
            if (hiddenSelectedCount === 1) {
              status.textContent = hiddenStatus;
              return;
            }
            status.textContent =
              selectedCount === 1
                ? "1 analysis selected"
                : \`\${selectedCount} analyses selected\`;
          }

          search.addEventListener("input", updateVisibility);
          checkFirst.addEventListener("change", updateVisibility);
          checkEleventh.addEventListener("change", updateVisibility);
          clearButton.addEventListener("click", () => {
            checkFirst.checked = false;
            checkEleventh.checked = false;
            updateVisibility();
          });

          updateVisibility();
        </script>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    await page.locator("#search").fill(eleventhTitle);
    await expect(page.locator("#row-first")).toBeHidden();
    await expect(page.locator("#row-eleventh")).toBeVisible();
    await expect(
      page.getByText(
        "2 analyses selected; 1 is hidden by the current search or filter.",
        { exact: true },
      ),
    ).toBeVisible();

    await page.locator("#clear-selection").click();
    await expect(page.getByText("No analyses selected.", { exact: true })).toBeVisible();
    await expect(page.locator("#check-eleventh")).not.toBeChecked();

    await page.locator("#search").fill("");
    await expect(page.locator("#row-first")).toBeVisible();
    await expect(page.locator("#check-first")).not.toBeChecked();
    await expect(page.locator("#check-eleventh")).not.toBeChecked();
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedRowSummaryRegression() {
  const { chromium } = await import("@playwright/test");
  const { readVisibleSavedRowSummaries } = await import(
    "../helpers/saved-workspace.ts"
  );

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const orderedRows = [
      { title: "Alpha role", missingCount: 0 },
      { title: "Beta role", missingCount: 1 },
      { title: "Gamma role", missingCount: 2 },
    ];
    const fixtureRows = orderedRows
      .map((row, index) =>
        buildSavedRowButtonHtml({
          title: row.title,
          company: "Acme Corp",
          savedDate: `6/${index + 1}/2026`,
          missingCount: row.missingCount,
        }),
      )
      .join("");
    await page.setContent(`<main>${fixtureRows}</main>`, {
      waitUntil: "domcontentloaded",
    });

    const summaries = await readVisibleSavedRowSummaries(page);
    assert(summaries.length === 3, "row-summary helper must return all visible rows");
    assert(
      summaries.map((row) => row.title).join("|") ===
        orderedRows.map((row) => row.title).join("|"),
      "row-summary helper must preserve row ordering",
    );
    assert(
      summaries.every(
        (row, index) => row.missingCount === orderedRows[index].missingCount,
      ),
      "row-summary helper must parse Missing counts correctly",
    );

    const malformedPage = await browser.newPage();
    await malformedPage.setContent(
      `<main>${buildSavedRowButtonHtml({
        title: "Broken row",
        company: "Acme Corp",
        savedDate: "6/1/2026",
        missingCount: 1,
      }).replace("Missing 1", "Missing")}</main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => readVisibleSavedRowSummaries(malformedPage),
      "did not contain a readable Missing count",
    );
    await malformedPage.close();

    const duplicatePage = await browser.newPage();
    await duplicatePage.setContent(
      `<main>${[
        buildSavedRowButtonHtml({
          title: "Duplicate title",
          company: "Acme Corp",
          savedDate: "6/1/2026",
          missingCount: 0,
        }),
        buildSavedRowButtonHtml({
          title: "Duplicate title",
          company: "Acme Corp",
          savedDate: "6/2/2026",
          missingCount: 2,
        }),
      ].join("")}</main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => readVisibleSavedRowSummaries(duplicatePage),
      "duplicate titles",
    );
    await duplicatePage.close();
  } finally {
    await browser.close();
  }
}

function greedyAriaLabelTitle(label) {
  const match = label.match(/^Open saved analysis (.+), /);
  return match?.[1] ?? "";
}

async function runBrowserBackedLoadMoreFailureAlertRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const {
    LOAD_MORE_ALERT_MESSAGE: alertMessage,
    expectLoadMoreFailureAlert,
    loadMoreFailureAlert,
  } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<main>
        <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div>
        <p role="alert">${alertMessage}</p>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    assert(
      (await page.getByRole("alert").count()) === 2,
      "fixture must contain both the route announcer and application alert",
    );

    const alert = loadMoreFailureAlert(page);
    await expect(alert).toHaveCount(1);
    await expect(alert).toHaveText(alertMessage);
    await expectLoadMoreFailureAlert(page);

    const missingAlertPage = await browser.newPage();
    await missingAlertPage.setContent(
      `<main><div role="alert" aria-live="assertive" id="__next-route-announcer__"></div></main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => expectLoadMoreFailureAlert(missingAlertPage),
      "Expected exactly one load-more failure alert",
    );
    await missingAlertPage.close();

    const duplicateAlertPage = await browser.newPage();
    await duplicateAlertPage.setContent(
      `<main>
        <p role="alert">${alertMessage}</p>
        <p role="alert">${alertMessage}</p>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => expectLoadMoreFailureAlert(duplicateAlertPage),
      "Expected exactly one load-more failure alert",
    );
    await duplicateAlertPage.close();
  } finally {
    await browser.close();
  }
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
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedTitleReadingRegression() {
  const { chromium } = await import("@playwright/test");
  const {
    readVisibleTitles,
    savedAnalysisOpenButtons,
  } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const runId = "regression-run";
    const commaTitle = "Platform Engineer, Inc.";
    const commaCompany = "Northstar, LLC";
    const commaDate = "6/28/2026, 2:44:11 AM";
    const simpleTitle = "Software Intern";
    const currentRunTitle = `V23 QA ${runId} A 01`;
    const orderedRows = [
      {
        title: commaTitle,
        company: commaCompany,
        savedDate: commaDate,
      },
      {
        title: simpleTitle,
        company: "Acme Corp",
        savedDate: "6/27/2026, 9:15:00 AM",
      },
      {
        title: currentRunTitle,
        company: "Version 23 QA Company",
        savedDate: "6/26/2026, 1:00:00 PM",
      },
      {
        title: "Baseline record 01",
        company: "Legacy Org",
        savedDate: "1/2/2025, 8:00:00 AM",
      },
    ];

    const fixtureRows = orderedRows
      .map((row) => buildSavedRowButtonHtml(row))
      .join("");
    await page.setContent(`<main>${fixtureRows}</main>`, {
      waitUntil: "domcontentloaded",
    });

    const titles = await readVisibleTitles(page);
    assert(titles.length === orderedRows.length, "title count must equal open-button count");
    assert(
      (await savedAnalysisOpenButtons(page).count()) === orderedRows.length,
      "returned title count must equal open-button count",
    );
    assert(
      titles[0] === commaTitle,
      "readVisibleTitles must return the exact comma-containing title text",
    );
    assert(
      titles[1] === simpleTitle,
      "readVisibleTitles must return a normal title without commas",
    );
    assert(
      !titles.includes(commaCompany),
      "company text must not be returned as a title",
    );
    assert(
      !titles.some((title) => title.includes("Matched") || title.includes("Missing")),
      "Matched/Missing text must not be returned as a title",
    );
    assert(
      !titles.some((title) => title.includes(commaDate)),
      "saved-date text must not be returned as a title",
    );
    assert(
      titles.join("|") === orderedRows.map((row) => row.title).join("|"),
      "row order must be preserved",
    );

    const commaAriaLabel = `Open saved analysis ${commaTitle}, ${commaCompany}, saved ${commaDate}`;
    const greedyParsed = greedyAriaLabelTitle(commaAriaLabel);
    assert(
      greedyParsed !== commaTitle,
      "the old greedy aria-label regex must fail the comma fixture",
    );
    assert(
      titles[0] === commaTitle && greedyParsed !== commaTitle,
      "rendered-title reader must succeed where greedy aria-label parsing fails",
    );
    assert(
      !titles.some((title) => title === commaAriaLabel),
      "the complete aria label must never be returned as a title",
    );

    const currentRunTitles = new Set([currentRunTitle]);
    const currentRunVisible = titles.filter((title) => currentRunTitles.has(title));
    const preexistingVisible = titles.filter((title) => !currentRunTitles.has(title));
    assert(currentRunVisible.length === 1, "current-run fixture must match one visible title");
    assert(preexistingVisible.length === 3, "pre-existing fixture rows must remain separate");

    const missingTitlePage = await browser.newPage();
    await missingTitlePage.setContent(
      `<main>${buildSavedRowButtonHtml({
        title: "Valid title",
        company: "Acme Corp",
        savedDate: "6/1/2026",
      }).replace("<p>Valid title</p>", "")}</main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => readVisibleTitles(missingTitlePage),
      "Saved-analysis row 1 did not contain a readable title.",
    );
    await missingTitlePage.close();

    const emptyTitlePage = await browser.newPage();
    await emptyTitlePage.setContent(
      `<main>${buildSavedRowButtonHtml({
        title: "   ",
        company: "Acme Corp",
        savedDate: "6/1/2026",
      })}</main>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertThrowsAsync(
      () => readVisibleTitles(emptyTitlePage),
      "Saved-analysis row 1 did not contain a readable title.",
    );
    await emptyTitlePage.close();

    const coveragePage = await browser.newPage();
    const currentRunTitlesList = Array.from({ length: 23 }, (_, index) => {
      const number = String(index + 1).padStart(2, "0");
      return `V23 QA ${runId} A ${number}`;
    });
    const preexistingTitlesList = Array.from({ length: 4 }, (_, index) => {
      const number = String(index + 1).padStart(2, "0");
      return `Baseline record ${number}`;
    });
    const coverageRows = [...currentRunTitlesList, ...preexistingTitlesList].map(
      (title, index) =>
        buildSavedRowButtonHtml({
          title,
          company: title.startsWith("V23 QA")
            ? "Version 23 QA Company"
            : "Legacy Org",
          savedDate: `6/${(index % 28) + 1}/2026, 12:00:00 PM`,
        }),
    );
    await coveragePage.setContent(`<main>${coverageRows.join("")}</main>`, {
      waitUntil: "domcontentloaded",
    });
    const coverageTitles = await readVisibleTitles(coveragePage);
    const currentRunSet = new Set(currentRunTitlesList);
    const coverageCurrentRun = coverageTitles.filter((title) => currentRunSet.has(title));
    const coveragePreexisting = coverageTitles.filter((title) => !currentRunSet.has(title));
    assert(coverageCurrentRun.length === 23, "27-row fixture must yield 23 current-run matches");
    assert(coveragePreexisting.length === 4, "27-row fixture must keep pre-existing count at 4");
    await coveragePage.close();
  } finally {
    await browser.close();
  }
}

async function runBrowserBackedOrderingRegression() {
  const { chromium } = await import("@playwright/test");
  const { readVisibleTitles } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const runId = "regression-run";
    const currentRunTitles = [
      `V23 QA ${runId} newest`,
      `V23 QA ${runId} middle`,
      `V23 QA ${runId} oldest`,
    ];
    const rows = [
      buildSavedRowButtonHtml({
        title: currentRunTitles[0],
        company: "Version 23 QA Company",
        savedDate: "6/28/2026",
      }),
      buildSavedRowButtonHtml({
        title: "Baseline record 01",
        company: "Legacy Org",
        savedDate: "1/1/2025",
      }),
      buildSavedRowButtonHtml({
        title: currentRunTitles[1],
        company: "Version 23 QA Company",
        savedDate: "6/27/2026",
      }),
      buildSavedRowButtonHtml({
        title: currentRunTitles[2],
        company: "Version 23 QA Company",
        savedDate: "6/26/2026",
      }),
    ];
    await page.setContent(`<main>${rows.join("")}</main>`, {
      waitUntil: "domcontentloaded",
    });

    const visible = await readVisibleTitles(page);
    const currentRunSet = new Set(currentRunTitles);
    const filtered = visible.filter((title) => currentRunSet.has(title));
    assert(
      filtered.join("|") === currentRunTitles.join("|"),
      "current-run ordering must ignore pre-existing rows",
    );
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

function extractLoadedCsvBlock(specSource) {
  const startMarker = 'test.describe("Loaded CSV"';
  const endMarker = 'test.describe("Keyboard accessibility"';
  const start = specSource.indexOf(startMarker);
  const end = specSource.indexOf(endMarker);
  if (start < 0 || end <= start) {
    throw new Error("Unable to locate Loaded CSV test block.");
  }
  return specSource.slice(start, end);
}

function runLoadedExportSourceRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const specSource = readFileSync(specPath, "utf8");
  const block = extractLoadedCsvBlock(specSource);

  const disclosureHelperStart = flowsSource.indexOf(
    "export function loadedExportDisclosure",
  );
  const disclosureHelperEnd = flowsSource.indexOf(
    "export async function runStructuredSaveFlow",
  );
  const loadedExportStart = flowsSource.indexOf(
    "export async function exportLoadedCsv",
  );
  const loadedExportEnd = flowsSource.indexOf("export function newestFirstIds");
  assert(
    disclosureHelperStart >= 0 &&
      disclosureHelperEnd > disclosureHelperStart &&
      loadedExportStart >= 0 &&
      loadedExportEnd > loadedExportStart,
    "Loaded CSV export helpers must exist in flows.ts",
  );
  const disclosureHelperSource = flowsSource.slice(
    disclosureHelperStart,
    disclosureHelperEnd,
  );
  const loadedExportSource = flowsSource.slice(
    loadedExportStart,
    loadedExportEnd,
  );

  assert(
    disclosureHelperSource.includes("Export loaded analyses") &&
      disclosureHelperSource.includes("loadedExportDisclosure"),
    "Loaded CSV helper must scope the Export loaded analyses disclosure",
  );
  assert(
    disclosureHelperSource.includes('name: "Loaded analyses (CSV)"') &&
      disclosureHelperSource.includes("exact: true") &&
      disclosureHelperSource.includes("openLoadedExportDisclosure"),
    "Loaded CSV helper must open the scoped CSV button inside the disclosure",
  );
  assert(
    loadedExportSource.includes("LOADED_EXPORT_DOWNLOAD_TIMEOUT_MS") &&
      loadedExportSource.includes('waitForEvent("download"') &&
      loadedExportSource.includes("timeout: LOADED_EXPORT_DOWNLOAD_TIMEOUT_MS"),
    "Loaded CSV download wait must use an explicit bounded timeout",
  );
  assert(
    loadedExportSource.includes("LOADED_EXPORT_FILENAME_PATTERN") &&
      loadedExportSource.includes("suggestedFilename()"),
    "Loaded CSV helper must verify the safe suggested filename pattern",
  );
  assert(
    disclosureHelperSource.includes("Disclosure count=") &&
      loadedExportSource.includes("button count=") &&
      !disclosureHelperSource.includes("console.log") &&
      !loadedExportSource.includes("console.log") &&
      !disclosureHelperSource.includes("authorization") &&
      !loadedExportSource.includes("request.url"),
    "Loaded CSV helper diagnostics must stay safe and must not log private data",
  );
  assert(
    !disclosureHelperSource.includes(".first()") &&
      !disclosureHelperSource.includes(".last()") &&
      !loadedExportSource.includes(".first()") &&
      !loadedExportSource.includes(".last()"),
    "Loaded CSV export helpers must not use positional locators",
  );

  assert(
    block.includes("not.toBeVisible()") &&
      block.includes('"Loaded analyses (CSV)"') &&
      block.includes("exportLoadedCsv(page)"),
    "Loaded CSV test must prove the button starts hidden before export",
  );
  assert(
    block.includes("expect(rows).toHaveLength(accountTotal)"),
    "Loaded CSV test must still verify the dynamic account total",
  );
  assert(
    block.includes("rows.filter((row) => row.job_title === title)"),
    "Loaded CSV test must still verify each current-run title exactly once",
  );
  assert(
    block.includes("new Set(rows.map((row) => row.job_title)).size"),
    "Loaded CSV test must still verify exported title uniqueness",
  );
  assert(
    block.includes("syntheticResume") && block.includes("syntheticJob"),
    "Loaded CSV test must still verify privacy exclusions",
  );
}

async function runBrowserBackedLoadedExportDisclosureRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const {
    LOADED_EXPORT_FILENAME_PATTERN,
    openLoadedExportDisclosure,
  } = await import("../helpers/flows.ts");
  const { deleteDownload } = await import("../helpers/saved-workspace.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<main>
        <details id="export-result">
          <summary>Export result</summary>
          <button type="button">Result CSV</button>
        </details>
        <details id="export-loaded">
          <summary>Export loaded analyses</summary>
          <button type="button" id="loaded-csv">Loaded analyses (CSV)</button>
        </details>
        <script>
          document.getElementById("loaded-csv").addEventListener("click", () => {
            const blob = new Blob(["job_title,company\\nFixture,Acme"], {
              type: "text/csv",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "saved-analyses-summary-2026-06-28.csv";
            anchor.click();
            URL.revokeObjectURL(url);
          });
        </script>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    const loadedButton = page.getByRole("button", {
      name: "Loaded analyses (CSV)",
      exact: true,
    });
    await expect(loadedButton).not.toBeVisible();

    const button = await openLoadedExportDisclosure(page);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    const exportResultOpen = await page
      .locator("#export-result")
      .evaluate((element) => element.open);
    const exportLoadedOpen = await page
      .locator("#export-loaded")
      .evaluate((element) => element.open);
    assert(!exportResultOpen, "Export result disclosure must remain closed");
    assert(exportLoadedOpen, "Export loaded analyses disclosure must open");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20_000 }),
      button.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(LOADED_EXPORT_FILENAME_PATTERN);
    const path = await download.path();
    expect(path).toBeTruthy();
    await deleteDownload(path);
  } finally {
    await browser.close();
  }
}

function extractSelectedDeletionCancelBlock(specSource) {
  const startMarker = 'test.describe("Selected-deletion cancel path"';
  const endMarker = 'test.describe("Selected-deletion success path"';
  const start = specSource.indexOf(startMarker);
  const end = specSource.indexOf(endMarker);
  if (start < 0 || end <= start) {
    throw new Error("Unable to locate Selected-deletion cancel path test block.");
  }
  return specSource.slice(start, end);
}

function runSelectedDeletionCancelSourceRegression() {
  const specSource = readFileSync(specPath, "utf8");
  const block = extractSelectedDeletionCancelBlock(specSource);

  assert(
    block.includes("const config = qaConfig();") &&
      !block.includes("qaConfig(), 0)") &&
      !block.includes("qaConfig(), 10)"),
    "Selected-deletion cancel test must resolve config once",
  );
  assert(
    block.includes("const accountTotal = await loadAllUserARecords(page, config);"),
    "Selected-deletion cancel test must capture the dynamic account total",
  );

  const visibleTargetIndex = block.indexOf("titleForUserA(config, 2)");
  const hiddenTargetIndex = block.indexOf("titleForUserA(config, 10)");
  const selectIndex = block.indexOf("selectRecordsByTitle(page, [visibleTarget, hiddenTarget])");
  const twoSelectedIndex = block.indexOf('"2 analyses selected", { exact: true }');
  const hasNotesIndex = block.indexOf('setListFilter(page, "Has notes")');
  const fourVisibleIndex = block.indexOf("expectVisibleCountSummary(page, 4, accountTotal)");
  const visibleCheckedIndex = block.indexOf(
    "await expect(rowCheckbox(page, visibleTarget)).toBeChecked();",
  );
  const hiddenAbsentIndex = block.indexOf("await expectRowAbsent(page, hiddenTarget);");
  const hiddenStatusIndex = block.indexOf(
    "2 analyses selected; 1 is hidden by the current search or filter.",
  );
  const deleteSelectedClickIndex = block.indexOf(
    'await page.getByRole("button", { name: "Delete selected", exact: true }).click();',
  );
  const confirmHeadingFocusedIndex = block.indexOf(
    'name: "Delete 2 selected analyses?",\n        exact: true,\n      }),\n    ).toBeFocused();',
  );
  const visibleLabelIndex = block.indexOf(
    "deleteConfirmation.getByText(`${visibleTarget} — ${SYNTHETIC_COMPANY}`",
  );
  const hiddenLabelIndex = block.indexOf(
    "deleteConfirmation.getByText(`${hiddenTarget} — ${SYNTHETIC_COMPANY}`",
  );
  const disabledCheckboxIndex = block.indexOf(
    "await expect(rowCheckbox(page, visibleTarget)).toBeDisabled();",
  );
  const cancelClickIndex = block.indexOf(
    'await deleteConfirmation\n      .getByRole("button", { name: "Cancel", exact: true })\n      .click();',
  );
  const confirmClosedIndex = block.indexOf(
    'name: "Delete 2 selected analyses?",\n        exact: true,\n      }),\n    ).toHaveCount(0);',
  );
  const focusDeleteIndex = block.indexOf(
    'page.getByRole("button", { name: "Delete selected", exact: true }),\n    ).toBeFocused();',
  );
  const showAllIndex = block.indexOf('setListFilter(page, "Show all")');
  const loadedCountIndex = block.indexOf("await expectLoadedCount(page, accountTotal);");
  const firstHiddenVisibleIndex = block.indexOf(
    "expectRowVisible(page, hiddenTarget)",
  );

  assert(
    visibleTargetIndex >= 0 &&
      hiddenTargetIndex >= 0 &&
      selectIndex > hiddenTargetIndex &&
      twoSelectedIndex > selectIndex &&
      hasNotesIndex > twoSelectedIndex &&
      fourVisibleIndex > hasNotesIndex &&
      visibleCheckedIndex > fourVisibleIndex &&
      hiddenAbsentIndex > visibleCheckedIndex &&
      hiddenStatusIndex > hiddenAbsentIndex &&
      deleteSelectedClickIndex > hiddenStatusIndex &&
      confirmHeadingFocusedIndex > deleteSelectedClickIndex &&
      visibleLabelIndex > confirmHeadingFocusedIndex &&
      hiddenLabelIndex > visibleLabelIndex &&
      disabledCheckboxIndex > hiddenLabelIndex &&
      cancelClickIndex > disabledCheckboxIndex &&
      confirmClosedIndex > cancelClickIndex &&
      focusDeleteIndex > confirmClosedIndex &&
      showAllIndex > focusDeleteIndex &&
      loadedCountIndex > showAllIndex,
    "Selected-deletion cancel test must follow the one-visible/one-hidden flow in order",
  );

  assert(
    !block.includes("titleForUserA(config, 0)") &&
      !block.includes("const first = titleForUserA") &&
      !block.includes("const eleventh = titleForUserA") &&
      !block.includes("older-pagination-search-target"),
    "Selected-deletion cancel test must not use stale null-note target pairs",
  );
  assert(
    firstHiddenVisibleIndex === -1 || firstHiddenVisibleIndex > showAllIndex,
    "Selected-deletion cancel test must not expect the hidden target visible under Has notes",
  );
  assert(
    block.includes("expectNoUnsafeText(page)"),
    "Selected-deletion cancel test must include privacy verification",
  );
}

async function runBrowserBackedSelectedDeletionCancelRegression() {
  const { chromium, expect } = await import("@playwright/test");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const visibleTitle = "V23 QA local A 02";
    const hiddenTitle = "V23 QA local A 11";
    const company = "Version 23 QA Company";
    await page.setContent(
      `<main>
        <select id="filter" aria-label="Filter saved analyses">
          <option value="all">Show all</option>
          <option value="notes">Has notes</option>
        </select>
        <p id="visible-summary">2 of 2</p>
        <p id="selection-status">2 analyses selected</p>
        <label id="row-visible" data-has-notes="true">
          <input type="checkbox" id="check-visible" aria-label="Select saved analysis ${visibleTitle}" checked />
          ${visibleTitle}
        </label>
        <label id="row-hidden" data-has-notes="false">
          <input type="checkbox" id="check-hidden" aria-label="Select saved analysis ${hiddenTitle}" checked />
          ${hiddenTitle}
        </label>
        <button type="button" id="delete-selected">Delete selected</button>
        <button type="button" id="clear-selection">Clear selection</button>
        <label><input type="checkbox" id="select-all" aria-label="Select all visible" checked />Select all visible</label>
        <section id="selected-delete-confirmation" hidden>
          <h3 id="confirm-heading" tabindex="-1">Delete 2 selected analyses?</h3>
          <ul id="confirm-labels">
            <li>${visibleTitle} — ${company}</li>
            <li>${hiddenTitle} — ${company}</li>
          </ul>
          <button type="button" id="cancel-delete">Cancel</button>
        </section>
        <script>
          const filter = document.getElementById("filter");
          const summary = document.getElementById("visible-summary");
          const status = document.getElementById("selection-status");
          const rowVisible = document.getElementById("row-visible");
          const rowHidden = document.getElementById("row-hidden");
          const checkVisible = document.getElementById("check-visible");
          const checkHidden = document.getElementById("check-hidden");
          const deleteSelected = document.getElementById("delete-selected");
          const clearSelection = document.getElementById("clear-selection");
          const selectAll = document.getElementById("select-all");
          const confirmation = document.getElementById("selected-delete-confirmation");
          const confirmHeading = document.getElementById("confirm-heading");
          const cancelDelete = document.getElementById("cancel-delete");
          const hiddenStatus =
            "2 analyses selected; 1 is hidden by the current search or filter.";

          function selectedCount() {
            return Number(checkVisible.checked) + Number(checkHidden.checked);
          }

          function updateFilter() {
            const notesOnly = filter.value === "notes";
            rowVisible.hidden = notesOnly ? false : false;
            rowHidden.hidden = notesOnly;
            const visibleRows = Number(!rowVisible.hidden) + Number(!rowHidden.hidden);
            summary.textContent = \`\${visibleRows} of 2\`;

            const selected = selectedCount();
            const hiddenSelected =
              Number(checkVisible.checked && rowVisible.hidden) +
              Number(checkHidden.checked && rowHidden.hidden);
            if (selected === 0) {
              status.textContent = "No analyses selected.";
            } else if (hiddenSelected === 1) {
              status.textContent = hiddenStatus;
            } else {
              status.textContent =
                selected === 1 ? "1 analysis selected" : \`\${selected} analyses selected\`;
            }
          }

          function setSelectionControlsDisabled(disabled) {
            checkVisible.disabled = disabled;
            selectAll.disabled = disabled;
            clearSelection.disabled = disabled;
            deleteSelected.disabled = disabled;
          }

          filter.addEventListener("change", updateFilter);
          checkVisible.addEventListener("change", updateFilter);
          checkHidden.addEventListener("change", updateFilter);
          deleteSelected.addEventListener("click", () => {
            confirmation.hidden = false;
            confirmHeading.focus();
            setSelectionControlsDisabled(true);
          });
          cancelDelete.addEventListener("click", () => {
            confirmation.hidden = true;
            setSelectionControlsDisabled(false);
            deleteSelected.focus();
          });

          updateFilter();
        </script>
      </main>`,
      { waitUntil: "domcontentloaded" },
    );

    await page.locator("#filter").selectOption({ label: "Has notes" });
    await expect(page.locator("#row-visible")).toBeVisible();
    await expect(page.locator("#row-hidden")).toBeHidden();
    await expect(
      page.getByText(
        "2 analyses selected; 1 is hidden by the current search or filter.",
        { exact: true },
      ),
    ).toBeVisible();

    await page.locator("#delete-selected").click();
    const confirmation = page.locator("#selected-delete-confirmation");
    await expect(confirmation).toBeVisible();
    await expect(
      confirmation.getByText(`${visibleTitle} — ${company}`, { exact: true }),
    ).toBeVisible();
    await expect(
      confirmation.getByText(`${hiddenTitle} — ${company}`, { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#check-visible")).toBeDisabled();
    await expect(page.locator("#select-all")).toBeDisabled();
    await expect(page.locator("#clear-selection")).toBeDisabled();
    await expect(page.locator("#delete-selected")).toBeDisabled();

    await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(page.locator("#delete-selected")).toBeFocused();
    await expect(page.locator("#row-hidden")).toBeHidden();
    await expect(
      page.getByText(
        "2 analyses selected; 1 is hidden by the current search or filter.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator("#check-visible")).toBeChecked();
    const hiddenChecked = await page.evaluate(
      () => document.getElementById("check-hidden").checked,
    );
    assert(hiddenChecked, "hidden selected row must remain checked after cancel");

    await page.locator("#filter").selectOption({ label: "Show all" });
    await expect(page.locator("#row-visible")).toBeVisible();
    await expect(page.locator("#row-hidden")).toBeVisible();
    await expect(page.locator("#check-visible")).toBeChecked();
    await expect(page.locator("#check-hidden")).toBeChecked();
    await expect(
      page.getByText("2 analyses selected", { exact: true }),
    ).toBeVisible();
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
  runIncrementalFailureSourceRegression();
  runFixtureSourceRegression();
  runSearchFilterSourceRegression();
  runSelectionSourceRegression();
  runLoadedExportSourceRegression();
  runSelectedDeletionCancelSourceRegression();
  runSavedListPageRequestRegression();
  runLoadMoreFailureAlertSourceRegression();
  runSyntheticPostgrestFailureSourceRegression();
  await runBrowserBackedPaginationRegression();
  await runBrowserBackedLoadMoreFailureAlertRegression();
  await runBrowserBackedSyntheticPostgrestFailureRegression();
  await runBrowserBackedPersistentPaginationInterceptorRegression();
  await runBrowserBackedExactLoadMoreRequestRegression();
  await runBrowserBackedTitleReadingRegression();
  await runBrowserBackedRowSummaryRegression();
  await runBrowserBackedSelectionDetailIndependenceRegression();
  await runBrowserBackedHiddenSelectionRegression();
  await runBrowserBackedLoadedExportDisclosureRegression();
  await runBrowserBackedSelectedDeletionCancelRegression();
  await runBrowserBackedOrderingRegression();
  await runSelectAllScopingRegression();
  console.log("Version 23 pagination regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
