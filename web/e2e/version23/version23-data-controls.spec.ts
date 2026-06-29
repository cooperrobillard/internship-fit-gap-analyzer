import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadQaConfig } from "./helpers/config";
import { assertAuthenticatedApplicationState, signInQaUser, signInQaUserOnPage, switchQaUserOnPage } from "./helpers/auth";
import { assertHeader } from "./helpers/csv";
import { expectNoHorizontalOverflow, expectNoUnsafeText } from "./helpers/assertions";
import {
  fulfillSyntheticPostgrestFailure,
  interceptHeldNext,
  interceptMatching,
  isSavedDelete,
  isSavedList,
  isSavedListPageRequest,
  type HeldRouteInterceptor,
  type HeldRequestOutcome,
} from "./helpers/network";
import {
  readManifest,
  recordsForOwner,
  titleForUserA,
} from "./helpers/manifest";
import { deleteRecordById, countSavedAnalysesForOwner } from "./helpers/supabase-admin";
import { SYNTHETIC_COMPANY, syntheticJob, syntheticResume } from "./helpers/qa-data";
import {
  assertUserBPostSwitchIsolation,
  captureUserBBaselineLoadedCount,
  clickLoadMore,
  expectLoadMoreFailureAlert,
  expectLoadedCount,
  expectRowAbsent,
  expectRowVisible,
  expectVisibleCountSummary,
  expectSelectionStatus,
  expectCompleteDeletionFailureAlert,
  expectPartialDeletionFailureStatus,
  formatPartialDeletionFailureMessage,
  loadMoreAndExpectSuccess,
  gotoSavedWorkspace,
  openAnalysisDetail,
  readVisibleSavedRowSummaries,
  readVisibleTitles,
  rowCheckbox,
  rowOpenButton,
  savedAnalysisOpenButtons,
  setListFilter,
  setSearchQuery,
  switchWorkspaceView,
  buildLoadMorePlan,
  SAVED_ANALYSES_PAGE_SIZE,
} from "./helpers/saved-workspace";
import {
  exportLoadedCsv,
  exportSelectedCsv,
  loadAllUserARecords,
  runStructuredSaveFlow,
  UI_SAVE_TITLE_PREFIX,
  selectRecordsByTitle,
  verifyCurrentRunVisibleCoverage,
  verifyPaginationOrdering,
} from "./helpers/flows";

test.describe.configure({ mode: "serial" });

function qaConfig(): ReturnType<typeof loadQaConfig> {
  return loadQaConfig();
}

test.describe("Authentication and two-user RLS isolation", () => {
  test("Authentication and two-user RLS isolation", async ({ browser }) => {
    const userA = await signInQaUser(browser, qaConfig(), "A");
    await gotoSavedWorkspace(userA.page, qaConfig().baseUrl);
    await expectRowVisible(userA.page, titleForUserA(qaConfig(), 0));
    await expect(userA.page.getByText(`V23 QA ${qaConfig().runId} B`)).toHaveCount(0);

    const userB = await signInQaUser(browser, qaConfig(), "B");
    await gotoSavedWorkspace(userB.page, qaConfig().baseUrl);
    const userBBaselineLoadedCount = await captureUserBBaselineLoadedCount(userB.page);
    await expectRowVisible(userB.page, `V23 QA ${qaConfig().runId} B`);
    await expect(userB.page.getByText(`V23 QA ${qaConfig().runId} A`)).toHaveCount(0);
    await userA.context.close();
    await userB.context.close();

    const switchContext = await browser.newContext();
    const switchPage = await switchContext.newPage();
    let staleInterceptor: HeldRouteInterceptor | undefined;
    let loadMorePromise: Promise<void> | undefined;
    let heldOutcome: HeldRequestOutcome | undefined;

    try {
      await signInQaUserOnPage(switchPage, qaConfig(), "A");
      await gotoSavedWorkspace(switchPage, qaConfig().baseUrl);
      await assertAuthenticatedApplicationState(switchPage, "A");
      await rowCheckbox(switchPage, titleForUserA(qaConfig(), 0)).check();
      await expect(switchPage.getByText("1 analysis selected")).toBeVisible();

      staleInterceptor = await interceptHeldNext(switchPage, isSavedList);
      loadMorePromise = clickLoadMore(switchPage);
      await staleInterceptor.waitUntilHeld();

      await switchQaUserOnPage(switchPage, qaConfig(), "A", "B");
      heldOutcome = await staleInterceptor.finalize();
      await loadMorePromise.catch(() => undefined);

      await assertAuthenticatedApplicationState(switchPage, "B");
      await assertUserBPostSwitchIsolation(
        switchPage,
        qaConfig().runId,
        userBBaselineLoadedCount,
      );

      if (heldOutcome === "fulfilled") {
        await expectLoadedCount(switchPage, userBBaselineLoadedCount);
        await expect(switchPage.getByText(`V23 QA ${qaConfig().runId} A`)).toHaveCount(0);
        await expectRowVisible(switchPage, `V23 QA ${qaConfig().runId} B`);
      } else if (
        heldOutcome === "aborted" ||
        heldOutcome === "canceled-by-navigation"
      ) {
        await assertUserBPostSwitchIsolation(
          switchPage,
          qaConfig().runId,
          userBBaselineLoadedCount,
        );
      }

      staleInterceptor.assertHeldOnce();
    } finally {
      staleInterceptor?.release();
      await staleInterceptor?.finalize().catch(() => undefined);
      await loadMorePromise?.catch(() => undefined);
      await staleInterceptor?.unroute().catch(() => undefined);
      await switchContext.close().catch(() => undefined);
    }
  });
});

test.describe("Structured save and detail", () => {
  test("Structured save and detail", async ({ browser }) => {
    const { context, page } = await signInQaUser(browser, qaConfig(), "A");
    await runStructuredSaveFlow(page, qaConfig());
    expect(recordsForOwner(readManifest(qaConfig().manifestPath), "A")).toHaveLength(23);
    await context.close();
  });
});

test.describe("Pagination", () => {
  test("Pagination", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);

    const userARecords = recordsForOwner(readManifest(config.manifestPath), "A");
    const currentRunRecordCount = userARecords.length;
    expect(currentRunRecordCount).toBe(23);
    expect(new Set(userARecords.map((record) => record.id)).size).toBe(23);

    const accountTotal = await countSavedAnalysesForOwner(config, "A");
    expect(accountTotal).toBeGreaterThanOrEqual(currentRunRecordCount);
    const preexistingCount = accountTotal - currentRunRecordCount;

    const initialCount = Math.min(accountTotal, SAVED_ANALYSES_PAGE_SIZE);
    await expectLoadedCount(page, initialCount);
    const initialTitles = await readVisibleTitles(page);
    expect(initialTitles).toHaveLength(initialCount);

    const plan = buildLoadMorePlan(accountTotal, SAVED_ANALYSES_PAGE_SIZE);
    for (let index = 0; index < plan.length; index += 1) {
      const step = plan[index]!;
      await loadMoreAndExpectSuccess(page, step);
      if (index === 0) {
        const afterFirstMore = await readVisibleTitles(page);
        for (const title of initialTitles) {
          expect(afterFirstMore).toContain(title);
        }
        expect(new Set(afterFirstMore).size).toBe(step.expectedTotalCount);
      }
    }

    await verifyCurrentRunVisibleCoverage(page, config, preexistingCount);
    await verifyPaginationOrdering(page, config);
    await context.close();
  });
});

test.describe("Incremental failure and retry", () => {
  test("Incremental failure and retry", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    await expectLoadedCount(page, 10);

    const targetTitle = titleForUserA(config, 5);
    await rowCheckbox(page, targetTitle).check();
    await openAnalysisDetail(page, targetTitle);
    await setSearchQuery(page, targetTitle);

    await expectVisibleCountSummary(page, 1, 10);
    await expectRowVisible(page, targetTitle);
    await expect(rowCheckbox(page, targetTitle)).toBeChecked();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: targetTitle,
        exact: true,
      }),
    ).toBeVisible();

    const isFirstLoadMoreRequest = (url: string, method: string) =>
      isSavedListPageRequest(url, method, {
        offset: SAVED_ANALYSES_PAGE_SIZE,
        pageSize: SAVED_ANALYSES_PAGE_SIZE,
      });

    const interceptor = await interceptMatching(
      page,
      isFirstLoadMoreRequest,
      (route) => fulfillSyntheticPostgrestFailure(route),
    );
    let interceptorActive = true;
    try {
      expect(interceptor.seen()).toBe(0);
      await clickLoadMore(page);
      await expect
        .poll(() => interceptor.seen(), {
          timeout: 10_000,
          message: "Expected at least one first-page Load More request attempt.",
        })
        .toBeGreaterThanOrEqual(1);
      await expectLoadMoreFailureAlert(page, {
        matchingLoadMoreAttempts: interceptor.seen(),
      });
      await expectLoadedCount(page, 10);

      await expectRowVisible(page, targetTitle);
      await expect(rowCheckbox(page, targetTitle)).toBeChecked();
      await expect(page.getByPlaceholder("Search saved analyses…")).toHaveValue(
        targetTitle,
      );
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: targetTitle,
          exact: true,
        }),
      ).toBeVisible();
      const loadMoreButton = page.getByRole("button", { name: "Load more analyses" });
      await expect(loadMoreButton).toBeVisible();
      await expect(loadMoreButton).toBeEnabled();
      await expectNoUnsafeText(page);

      const failureAttemptCount = interceptor.seen();
      expect(failureAttemptCount).toBeGreaterThanOrEqual(1);

      await interceptor.unroute();
      interceptorActive = false;

      await clickLoadMore(page);
      await expectLoadedCount(page, 20);
      await expectVisibleCountSummary(page, 1, 20);
      await expectRowVisible(page, targetTitle);
      await expect(rowCheckbox(page, targetTitle)).toBeChecked();
      await expect(page.getByPlaceholder("Search saved analyses…")).toHaveValue(
        targetTitle,
      );
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: targetTitle,
          exact: true,
        }),
      ).toBeVisible();

      await setSearchQuery(page, "");
      await expectVisibleCountSummary(page, 20, 20);
      const visibleCount = await savedAnalysisOpenButtons(page).count();
      expect(visibleCount).toBe(20);
    } finally {
      if (interceptorActive) {
        await interceptor.unroute().catch(() => undefined);
      }
    }
    await context.close();
  });
});

test.describe("Search and filters across pages", () => {
  test("Search and filters across pages", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    await expectLoadedCount(page, 10);
    const searchTarget = titleForUserA(config, 15);
    await expectRowAbsent(page, searchTarget);

    await setSearchQuery(page, "older-pagination-search-target");
    await expect(page.getByText("No saved analyses match this search.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Load more analyses" }),
    ).toBeVisible();
    await expectVisibleCountSummary(page, 0, 10);

    await clickLoadMore(page);
    await expectRowVisible(page, searchTarget);
    await expectVisibleCountSummary(page, 1, 20);

    await setSearchQuery(page, "");
    await setListFilter(page, "Show all");
    await expectVisibleCountSummary(page, 20, 20);

    const baselineRows = await readVisibleSavedRowSummaries(page);
    expect(baselineRows).toHaveLength(20);

    const expectedHasMissing = baselineRows.filter(
      (row) => row.missingCount > 0,
    ).length;
    const expectedNoMissing = baselineRows.filter(
      (row) => row.missingCount === 0,
    ).length;
    expect(expectedHasMissing).toBeGreaterThan(0);
    expect(expectedNoMissing).toBeGreaterThan(0);
    expect(expectedHasMissing + expectedNoMissing).toBe(20);

    await setListFilter(page, "Has missing skills");
    await expectVisibleCountSummary(page, expectedHasMissing, 20);
    const hasMissingRows = await readVisibleSavedRowSummaries(page);
    expect(hasMissingRows).toHaveLength(expectedHasMissing);
    for (const row of hasMissingRows) {
      expect(row.missingCount).toBeGreaterThan(0);
    }
    for (const row of baselineRows) {
      if (row.missingCount > 0) {
        await expectRowVisible(page, row.title);
      } else {
        await expectRowAbsent(page, row.title);
      }
    }

    await setListFilter(page, "No missing skills");
    await expectVisibleCountSummary(page, expectedNoMissing, 20);
    const noMissingRows = await readVisibleSavedRowSummaries(page);
    expect(noMissingRows).toHaveLength(expectedNoMissing);
    for (const row of noMissingRows) {
      expect(row.missingCount).toBe(0);
    }
    for (const row of baselineRows) {
      if (row.missingCount === 0) {
        await expectRowVisible(page, row.title);
      } else {
        await expectRowAbsent(page, row.title);
      }
    }

    const expectedNoteTitles = [
      `V23 QA ${config.runId} ${UI_SAVE_TITLE_PREFIX}`,
      titleForUserA(config, 2),
      titleForUserA(config, 3),
      titleForUserA(config, 4),
    ];
    for (const title of expectedNoteTitles) {
      expect(baselineRows.some((row) => row.title === title)).toBe(true);
    }

    await setListFilter(page, "Has notes");
    await expectVisibleCountSummary(page, expectedNoteTitles.length, 20);
    for (const title of expectedNoteTitles) {
      await expectRowVisible(page, title);
    }
    await expectRowAbsent(page, titleForUserA(config, 5));
    const notesVisibleTitles = await readVisibleTitles(page);
    expect(new Set(notesVisibleTitles)).toEqual(new Set(expectedNoteTitles));
    expect(notesVisibleTitles).toHaveLength(expectedNoteTitles.length);

    await setSearchQuery(page, "zzzz-no-loaded-match-zzzz");
    await expectVisibleCountSummary(page, 0, 20);
    await expect(page.getByText("No saved analyses match this search.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Load more analyses" }),
    ).toBeVisible();
    await expectNoUnsafeText(page);
    await context.close();
  });
});

test.describe("Selection", () => {
  test("Selection", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    const accountTotal = await loadAllUserARecords(page, config);

    const first = titleForUserA(config, 0);
    const eleventh = titleForUserA(config, 10);
    const firstDetailHeading = page.getByRole("heading", {
      level: 2,
      name: first,
      exact: true,
    });

    await expect(rowCheckbox(page, first)).not.toBeChecked();
    await expect(firstDetailHeading).toHaveCount(0);

    await rowCheckbox(page, first).check();

    await expect(rowCheckbox(page, first)).toBeChecked();
    await expect(firstDetailHeading).toHaveCount(0);

    await rowOpenButton(page, first).click();

    await expect(firstDetailHeading).toBeVisible();
    await expect(rowCheckbox(page, first)).toBeChecked();

    await rowCheckbox(page, first).uncheck();

    await expect(rowCheckbox(page, first)).not.toBeChecked();
    await expect(firstDetailHeading).toBeVisible();

    await rowCheckbox(page, first).check();
    await rowCheckbox(page, eleventh).check();
    await expect(page.getByText("2 analyses selected")).toBeVisible();

    await setSearchQuery(page, eleventh);
    await expectVisibleCountSummary(page, 1, accountTotal);
    await expectRowVisible(page, eleventh);
    await expect(rowCheckbox(page, eleventh)).toBeChecked();
    await expectRowAbsent(page, first);
    await expect(
      page.getByText(
        "2 analyses selected; 1 is hidden by the current search or filter.",
        { exact: true },
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(page.getByText("No analyses selected.")).toBeVisible();
    await expect(rowCheckbox(page, eleventh)).not.toBeChecked();

    await setSearchQuery(page, `V23 QA ${config.runId}`);
    await expectVisibleCountSummary(page, 23, accountTotal);
    await expect(rowCheckbox(page, first)).not.toBeChecked();
    await page.getByLabel("Select all visible").check();
    await expect(page.getByText("23 analyses selected")).toBeVisible();
    await rowCheckbox(page, first).uncheck();
    await expect(page.getByLabel("Select all visible")).not.toBeChecked();
    await rowCheckbox(page, first).check();
    await expect(page.getByText("23 analyses selected")).toBeVisible();
    await expect(
      page.getByText(/all account analyses|unloaded records/i),
    ).toHaveCount(0);
    await expectNoUnsafeText(page);
    await context.close();
  });
});

test.describe("Selected CSV", () => {
  test("Selected CSV", async ({ browser }) => {
    const { context, page } = await signInQaUser(browser, qaConfig(), "A");
    await gotoSavedWorkspace(page, qaConfig().baseUrl);
    await loadAllUserARecords(page, qaConfig());

    await expect(
      page.getByRole("button", { name: "Export selected (CSV)" }),
    ).toBeDisabled();

    const commaNoteTitle = titleForUserA(qaConfig(), 2);
    const quoteNoteTitle = titleForUserA(qaConfig(), 3);
    const hiddenTarget = titleForUserA(qaConfig(), 15);
    await selectRecordsByTitle(page, [commaNoteTitle, quoteNoteTitle]);
    await setSearchQuery(page, "older-pagination-search-target");

    const { text, rows } = await exportSelectedCsv(page);
    assertHeader(text);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.job_title).sort()).toEqual(
      [commaNoteTitle, quoteNoteTitle].sort(),
    );
    expect(rows.some((row) => row.notes === "Follow up, high priority")).toBe(true);
    expect(
      rows.some((row) => row.notes === 'Contact said "review next week"'),
    ).toBe(true);
    expect(text).not.toContain(syntheticResume);
    expect(text).not.toContain(syntheticJob);

    await setSearchQuery(page, "");
    await selectRecordsByTitle(page, [hiddenTarget]);
    const hiddenExport = await exportSelectedCsv(page);
    assertHeader(hiddenExport.text);
    expect(hiddenExport.rows.map((row) => row.job_title)).toContain(hiddenTarget);
    await expect(rowCheckbox(page, hiddenTarget)).toBeChecked();
    await context.close();
  });
});

test.describe("Loaded CSV", () => {
  test("Loaded CSV", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    const accountTotal = await loadAllUserARecords(page, config);
    await rowCheckbox(page, titleForUserA(config, 0)).check();

    await expect(
      page.getByRole("button", {
        name: "Loaded analyses (CSV)",
        exact: true,
      }),
    ).not.toBeVisible();

    const currentRunTitles = recordsForOwner(
      readManifest(config.manifestPath),
      "A",
    ).map((record) => record.title);

    const { text, rows } = await exportLoadedCsv(page);
    assertHeader(text);
    expect(rows).toHaveLength(accountTotal);
    for (const title of currentRunTitles) {
      expect(rows.filter((row) => row.job_title === title)).toHaveLength(1);
    }
    expect(new Set(rows.map((row) => row.job_title)).size).toBe(rows.length);
    expect(text).not.toContain(syntheticResume);
    expect(text).not.toContain(syntheticJob);
    await context.close();
  });
});

test.describe("Keyboard accessibility", () => {
  test("Keyboard accessibility", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    const accountTotal = await loadAllUserARecords(page, config);

    const target = titleForUserA(config, 7);
    const checkbox = rowCheckbox(page, target);
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    await expect(page.getByRole("heading", { level: 2, name: target })).toHaveCount(0);

    await checkbox.uncheck();
    await rowOpenButton(page, target).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: target })).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await setSearchQuery(page, `V23 QA ${config.runId}`);
    await expectVisibleCountSummary(page, 23, accountTotal);
    await expectRowVisible(page, target);
    await page.getByLabel("Select all visible").focus();
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: "Clear selection" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("No analyses selected.")).toBeVisible();

    await checkbox.check();
    await page.getByRole("button", { name: "Delete selected" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: /Delete 1 selected analysis/i }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Cancel" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Delete selected" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Load more analyses" })).toHaveCount(0);
    await context.close();
  });
});

test.describe("Responsive", () => {
  test("Responsive", async ({ browser }) => {
    const { context, page } = await signInQaUser(browser, qaConfig(), "A");
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoSavedWorkspace(page, qaConfig().baseUrl);
      await expectNoHorizontalOverflow(page);
      await expect(
        page
          .getByRole("button", {
            name: /Load more analyses|Loaded analyses \(CSV\)|Export selected/,
          })
          .first(),
      ).toBeVisible();
      await expectRowVisible(page, titleForUserA(qaConfig(), 0));
    }

    const client = await context.newCDPSession(page);
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await expectNoHorizontalOverflow(page);
    recordScaleTechnique(
      "Chromium CDP Emulation.setPageScaleFactor with pageScaleFactor: 2",
    );
    await context.close();
  });
});

test.describe("Selected-deletion cancel path", () => {
  test("Selected-deletion cancel path", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    const accountTotal = await loadAllUserARecords(page, config);

    const visibleTarget = titleForUserA(config, 2);
    const hiddenTarget = titleForUserA(config, 10);
    const deleteConfirmation = page.locator("#selected-delete-confirmation");

    await selectRecordsByTitle(page, [visibleTarget, hiddenTarget]);
    await expectSelectionStatus(page, 2);

    await setSearchQuery(page, visibleTarget);
    await expectVisibleCountSummary(page, 1, accountTotal);
    await expectRowVisible(page, visibleTarget);
    await expect(rowCheckbox(page, visibleTarget)).toBeChecked();
    await expectRowAbsent(page, hiddenTarget);
    await expectSelectionStatus(page, 2, 1);

    await page.getByRole("button", { name: "Delete selected", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Delete 2 selected analyses?",
        exact: true,
      }),
    ).toBeFocused();
    await expect(
      deleteConfirmation.getByText(`${visibleTarget} — ${SYNTHETIC_COMPANY}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      deleteConfirmation.getByText(`${hiddenTarget} — ${SYNTHETIC_COMPANY}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expectRowVisible(page, visibleTarget);
    await expectRowAbsent(page, hiddenTarget);

    await expect(rowCheckbox(page, visibleTarget)).toBeDisabled();
    await expect(page.getByLabel("Select all visible")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Clear selection", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Delete selected", exact: true }),
    ).toBeDisabled();

    await deleteConfirmation
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Delete 2 selected analyses?",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Delete selected", exact: true }),
    ).toBeFocused();

    await expectVisibleCountSummary(page, 1, accountTotal);
    await expectRowVisible(page, visibleTarget);
    await expect(rowCheckbox(page, visibleTarget)).toBeChecked();
    await expectRowAbsent(page, hiddenTarget);
    await expectSelectionStatus(page, 2, 1);

    await setSearchQuery(page, "");
    await expectVisibleCountSummary(page, accountTotal, accountTotal);
    await expectRowVisible(page, visibleTarget);
    await expectRowVisible(page, hiddenTarget);
    await expect(rowCheckbox(page, visibleTarget)).toBeChecked();
    await expect(rowCheckbox(page, hiddenTarget)).toBeChecked();
    await expectSelectionStatus(page, 2);
    await expectLoadedCount(page, accountTotal);
    await expectNoUnsafeText(page);
    await context.close();
  });
});

test.describe("Selected-deletion success path", () => {
  test("Selected-deletion success path", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    const accountTotalBefore = await loadAllUserARecords(page, config);

    const deleteA = titleForUserA(config, 20);
    const deleteB = titleForUserA(config, 21);
    const keep = titleForUserA(config, 22);
    await selectRecordsByTitle(page, [deleteA, deleteB]);
    await setListFilter(page, "Show all");
    await page.getByRole("button", { name: "Delete selected" }).click();
    await page.getByRole("button", { name: "Delete 2 analyses" }).click();
    await expect(page.getByText("2 selected analyses were deleted.")).toBeVisible({
      timeout: 60_000,
    });
    await expectRowAbsent(page, deleteA);
    await expectRowAbsent(page, deleteB);
    await expectRowVisible(page, keep);
    await expectLoadedCount(page, accountTotalBefore - 2);
    await switchWorkspaceView(page, "Insights");
    await switchWorkspaceView(page, "Compare");
    await context.close();
  });
});

test.describe("Already-unavailable target", () => {
  test("Already-unavailable target", async ({ browser }) => {
    const contextA = await signInQaUser(browser, qaConfig(), "A");
    const contextB = await signInQaUser(browser, qaConfig(), "A");
    await gotoSavedWorkspace(contextA.page, qaConfig().baseUrl);
    await loadAllUserARecords(contextA.page, qaConfig());

    const targetA = titleForUserA(qaConfig(), 18);
    const targetB = titleForUserA(qaConfig(), 19);
    await selectRecordsByTitle(contextA.page, [targetA, targetB]);

    const targetAId = recordsForOwner(readManifest(qaConfig().manifestPath), "A").find(
      (record) => record.title === targetA,
    )!.id;
    await deleteRecordById(qaConfig(), "A", targetAId);

    await gotoSavedWorkspace(contextB.page, qaConfig().baseUrl);
    await contextA.page.getByRole("button", { name: "Delete selected" }).click();
    await contextA.page.getByRole("button", { name: "Delete 2 analyses" }).click();
    await expect(
      contextA.page.getByText(/deleted|already unavailable/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expectRowAbsent(contextA.page, targetA);
    await expectRowAbsent(contextA.page, targetB);
    await expect(contextA.page.getByText("No analyses selected.")).toBeVisible();
    await expectNoUnsafeText(contextA.page);
    await contextA.context.close();
    await contextB.context.close();
  });
});

test.describe("Complete deletion failure", () => {
  test("Complete deletion failure", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    await loadAllUserARecords(page, config);

    const first = titleForUserA(config, 1);
    const second = titleForUserA(config, 2);
    await selectRecordsByTitle(page, [first, second]);
    const interceptor = await interceptMatching(page, isSavedDelete, (route) =>
      route.abort("failed"),
    );
    await page.getByRole("button", { name: "Delete selected", exact: true }).click();
    await page.getByRole("button", { name: "Delete 2 analyses", exact: true }).click();
    await expectCompleteDeletionFailureAlert(page, 2);
    await expect(page.locator("#__next-route-announcer__")).toHaveCount(1);
    await expect(page.locator("#__next-route-announcer__")).toHaveText("");
    interceptor.assertSeen(2);
    await expectRowVisible(page, first);
    await expectRowVisible(page, second);
    await expect(rowCheckbox(page, first)).toBeChecked();
    await expect(rowCheckbox(page, second)).toBeChecked();
    await expectSelectionStatus(page, 2);
    await expect(
      page.getByRole("button", { name: "Export selected (CSV)", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", {
        name: "Delete 2 selected analyses?",
        exact: true,
      }),
    ).toHaveCount(0);
    await interceptor.unroute();
    await page.getByRole("button", { name: "Delete selected", exact: true }).click();
    await page.getByRole("button", { name: "Delete 2 analyses", exact: true }).click();
    await expect(
      page.getByText("2 selected analyses were deleted.", { exact: true }),
    ).toBeVisible({ timeout: 60_000 });
    await expectRowAbsent(page, first);
    await expectRowAbsent(page, second);
    await expectSelectionStatus(page, 0);
    await expectNoUnsafeText(page);
    await context.close();
  });
});

test.describe("True partial deletion failure", () => {
  test("True partial deletion failure", async ({ browser }) => {
    const config = qaConfig();
    const { context, page } = await signInQaUser(browser, config, "A");
    await gotoSavedWorkspace(page, config.baseUrl);
    await loadAllUserARecords(page, config);

    const first = titleForUserA(config, 3);
    const second = titleForUserA(config, 4);
    await selectRecordsByTitle(page, [first, second]);

    let observedDeletes = 0;
    const interceptor = await interceptMatching(
      page,
      isSavedDelete,
      async (route) => {
        observedDeletes += 1;
        if (observedDeletes === 1) {
          await route.continue();
          return;
        }
        await route.abort("failed");
      },
    );

    await page.getByRole("button", { name: "Delete selected", exact: true }).click();
    await page.getByRole("button", { name: "Delete 2 analyses", exact: true }).click();
    await expectPartialDeletionFailureStatus(page, {
      targetCount: 2,
      removedCount: 1,
      failureCount: 1,
    });
    interceptor.assertSeen(2);
    await expectRowAbsent(page, first);
    await expectRowVisible(page, second);
    await expect(rowCheckbox(page, second)).toBeChecked();
    await expectSelectionStatus(page, 1);
    await expect(
      page.getByRole("button", { name: "Export selected (CSV)", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", {
        name: "Delete 2 selected analyses?",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("alert").filter({
        hasText: formatPartialDeletionFailureMessage({
          targetCount: 2,
          removedCount: 1,
          failureCount: 1,
        }),
      }),
    ).toHaveCount(0);

    await interceptor.unroute();
    await page.getByRole("button", { name: "Delete selected", exact: true }).click();
    await page.getByRole("button", { name: "Delete 1 analysis", exact: true }).click();
    await expect(
      page.getByText("1 selected analysis was deleted.", { exact: true }),
    ).toBeVisible({ timeout: 60_000 });
    await expectRowAbsent(page, second);
    await expectSelectionStatus(page, 0);
    await expectNoUnsafeText(page);
    await context.close();
  });
});

test.describe("Individual deletion regression", () => {
  test("Individual deletion regression", async ({ browser }) => {
    const { context, page } = await signInQaUser(browser, qaConfig(), "A");
    await gotoSavedWorkspace(page, qaConfig().baseUrl);
    await loadAllUserARecords(page, qaConfig());

    const target = titleForUserA(qaConfig(), 6);
    await openAnalysisDetail(page, target);
    const loadedBefore = Number(
      (await page.getByText(/\d+ loaded/).textContent())?.match(/(\d+) loaded/)?.[1],
    );
    await page.getByRole("button", { name: "Delete saved analysis" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Delete saved analysis" }).click();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(
      page.getByText(`"${target} · ${SYNTHETIC_COMPANY}" was deleted.`),
    ).toBeVisible({ timeout: 60_000 });
    await expectRowAbsent(page, target);
    await expectLoadedCount(page, loadedBefore - 1);
    await switchWorkspaceView(page, "Insights");
    await switchWorkspaceView(page, "Compare");
    await context.close();
  });
});

function recordScaleTechnique(technique: string) {
  const path = "test-results/version23-runtime.json";
  const current = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, string>)
    : {};
  current.scaleTechnique = technique;
  writeFileSync(path, JSON.stringify(current, null, 2));
}
