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
      <span>Missing 1</span>
    </div>
  </button>`;
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

try {
  runLoadMorePlanRegression();
  runPaginationMathRegression();
  runPluralizationRegression();
  runParsingRegression();
  runUniquenessRegression();
  runSourceRegression();
  runIncrementalFailureSourceRegression();
  runSavedListPageRequestRegression();
  runLoadMoreFailureAlertSourceRegression();
  runSyntheticPostgrestFailureSourceRegression();
  await runBrowserBackedPaginationRegression();
  await runBrowserBackedLoadMoreFailureAlertRegression();
  await runBrowserBackedSyntheticPostgrestFailureRegression();
  await runBrowserBackedPersistentPaginationInterceptorRegression();
  await runBrowserBackedExactLoadMoreRequestRegression();
  await runBrowserBackedTitleReadingRegression();
  await runBrowserBackedOrderingRegression();
  await runSelectAllScopingRegression();
  console.log("Version 23 pagination regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
