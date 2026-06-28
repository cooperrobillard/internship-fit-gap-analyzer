#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPTIONAL_JOB_FIELD_LABELS,
  shouldClickOptionalJobSummary,
  validateOptionalJobDisclosureCount,
} from "../helpers/analysis-form.ts";
import {
  MATCHED_SKILLS_HEADING_PATTERN,
  MISSING_SKILLS_HEADING_PATTERN,
  SAVED_JOB_DETAILS_SUMMARY_PATTERN,
  isMatchedSkillsHeading,
  isMissingSkillsHeading,
  isSavedJobDetailsSummary,
  validateSavedJobDetailsDisclosureCount,
  validateVisibleSavedAnalysisArticleCount,
} from "../helpers/saved-analysis-detail.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const helpersDir = join(scriptDir, "../helpers");

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

async function assertRejects(promise, expectedMessage) {
  try {
    await promise;
    throw new Error(`Expected rejection: ${expectedMessage}`);
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes(expectedMessage),
      `Expected "${expectedMessage}", got "${error instanceof Error ? error.message : error}"`,
    );
  }
}

function runDisclosureLogicRegression() {
  assert(
    shouldClickOptionalJobSummary(false),
    "closed Optional job details must require a summary click",
  );
  assert(
    !shouldClickOptionalJobSummary(true),
    "already-open disclosure must not require a second summary click",
  );

  assertThrows(
    () => validateOptionalJobDisclosureCount(0),
    "Optional job details disclosure was not found.",
  );
  assertThrows(
    () => validateOptionalJobDisclosureCount(2),
    "Multiple Optional job details disclosures were found.",
  );
  validateOptionalJobDisclosureCount(1);
}

function runScopedLocatorRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const analysisFormSource = readFileSync(join(helpersDir, "analysis-form.ts"), "utf8");

  assert(
    flowsSource.includes("openOptionalJobDetails(page)"),
    "structured save must open Optional job details before filling metadata",
  );
  assert(
    flowsSource.includes("fillOptionalJobMetadata(details"),
    "metadata fields must be filled through the opened disclosure scope",
  );
  assert(
    !flowsSource.includes('page.getByLabel("Job title").fill'),
    "Job title must not be filled from an unscoped page locator",
  );
  assert(
    analysisFormSource.includes('details.getByLabel(label)'),
    "optional job fields must be scoped to the disclosure element",
  );
  assert(
    analysisFormSource.includes("(element as HTMLDetailsElement).open"),
    "details.evaluate must only read disclosure open state",
  );
  assert(
    !analysisFormSource.includes("page.evaluate"),
    "optional job metadata must not use page.evaluate",
  );
}

function runBoundedErrorRegression() {
  const analysisFormSource = readFileSync(join(helpersDir, "analysis-form.ts"), "utf8");
  for (const message of [
    "Optional job details did not open.",
    "Job title was not visible after opening Optional job details.",
    "Company was not editable after opening Optional job details.",
    "Notes was not editable after opening Optional job details.",
  ]) {
    assert(analysisFormSource.includes(message), `missing bounded error: ${message}`);
  }
  assert(
    analysisFormSource.includes("OPTIONAL_DETAILS_DISCLOSURE_TIMEOUT_MS"),
    "disclosure stages must use bounded timeouts",
  );
  assert(
    analysisFormSource.includes("OPTIONAL_DETAILS_FIELD_TIMEOUT_MS"),
    "field stages must use bounded timeouts",
  );
}

function runManifestOrderRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const saveMarker = flowsSource.indexOf('getByRole("button", { name: "Save result" })');
  const detailMarker = flowsSource.indexOf("verify saved detail");
  const manifestMarker = flowsSource.indexOf("await discoverAndAppendUiRecord");

  assert(saveMarker >= 0, "structured save flow must save the result");
  assert(detailMarker >= 0, "structured save flow must verify saved detail");
  assert(manifestMarker >= 0, "structured save flow must append the cleanup manifest");
  assert(
    manifestMarker > detailMarker && detailMarker > saveMarker,
    "cleanup manifest append must occur only after save and detail verification",
  );
}

function runMockDisclosureFlowRegression() {
  let open = false;
  let summaryClicks = 0;
  let fillStarted = false;

  const openDisclosure = () => {
    if (shouldClickOptionalJobSummary(open)) {
      summaryClicks += 1;
      open = true;
    }
  };

  openDisclosure();
  assert(summaryClicks === 1 && open, "closed disclosure must open on first summary click");
  openDisclosure();
  assert(summaryClicks === 1, "already-open disclosure must not click summary again");

  const fillFields = () => {
    if (!open) {
      throw new Error("Job title was not visible after opening Optional job details.");
    }
    fillStarted = true;
  };

  open = false;
  summaryClicks = 0;
  openDisclosure();
  fillFields();
  assert(fillStarted, "field filling must begin only after the disclosure is open");

  for (const label of OPTIONAL_JOB_FIELD_LABELS) {
    assert(label.length > 0, `optional field label must be defined: ${label}`);
  }
}

function runNoForceFillRegression() {
  const analysisFormSource = readFileSync(join(helpersDir, "analysis-form.ts"), "utf8");
  const savedDetailSource = readFileSync(
    join(helpersDir, "saved-analysis-detail.ts"),
    "utf8",
  );
  assert(
    !analysisFormSource.includes("force:"),
    "optional job details must not use force-fill",
  );
  assert(
    !analysisFormSource.includes("setAttribute(\"open\""),
    "optional job details must not force the open attribute",
  );
  assert(
    !savedDetailSource.includes("setAttribute(\"open\""),
    "saved Job details must not force the open attribute",
  );
  assert(
    !savedDetailSource.includes("page.evaluate"),
    "saved Job details must not use page.evaluate",
  );
}

function runSavedJobDetailsRegression() {
  assert(isSavedJobDetailsSummary("Job details"), "exact summary Job details must match");
  assert(
    isSavedJobDetailsSummary("Job details · Notes included"),
    "exact summary Job details · Notes included must match",
  );
  assert(
    !isSavedJobDetailsSummary("Optional job details"),
    "form-side Optional job details must not match saved Job details summary",
  );
  assert(
    SAVED_JOB_DETAILS_SUMMARY_PATTERN.test("Job details"),
    "anchored summary pattern must accept Job details",
  );

  assertThrows(
    () => validateVisibleSavedAnalysisArticleCount(0),
    "Visible saved-analysis detail article was not found.",
  );
  assertThrows(
    () => validateVisibleSavedAnalysisArticleCount(2),
    "Multiple visible saved-analysis detail articles were found.",
  );
  assertThrows(
    () => validateSavedJobDetailsDisclosureCount(0),
    "Saved Job details disclosure was not found.",
  );
  assertThrows(
    () => validateSavedJobDetailsDisclosureCount(2),
    "Multiple saved Job details disclosures were found.",
  );

  let open = false;
  let summaryClicks = 0;
  const openSavedJobDetails = () => {
    if (shouldClickOptionalJobSummary(open)) {
      summaryClicks += 1;
      open = true;
    }
  };
  openSavedJobDetails();
  assert(summaryClicks === 1 && open, "closed saved Job details must open before Notes verification");
  openSavedJobDetails();
  assert(summaryClicks === 1, "already-open saved Job details must not be clicked closed");

  let notesVerified = false;
  const verifyNotes = () => {
    if (!open) {
      throw new Error("Saved Job details disclosure did not open.");
    }
    notesVerified = true;
  };
  open = false;
  summaryClicks = 0;
  openSavedJobDetails();
  verifyNotes();
  assert(notesVerified, "Notes verification must occur only after the disclosure is open");
}

function runSavedDetailFlowRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const savedDetailSource = readFileSync(
    join(helpersDir, "saved-analysis-detail.ts"),
    "utf8",
  );

  assert(
    flowsSource.includes("openSavedAnalysisJobDetails(page, uiTitle)"),
    "structured save must open saved Job details before Notes verification",
  );
  assert(
    flowsSource.includes("jobDetails.getByText(uiNotes"),
    "Notes verification must be scoped inside the saved disclosure",
  );
  assert(
    !flowsSource.includes("await expect(page.getByText(uiNotes)).toBeVisible"),
    "Notes must not be verified with a page-wide locator",
  );
  assert(
    savedDetailSource.includes('getByRole("article")'),
    "saved detail helper must scope to the saved-analysis article",
  );
  assert(
    savedDetailSource.includes("filter({ visible: true })"),
    "hidden duplicate detail articles must be ignored",
  );
  assert(
    savedDetailSource.includes("SAVED_JOB_DETAILS_SUMMARY_PATTERN"),
    "saved Job details summary must use the anchored pattern",
  );

  const openSavedMarker = flowsSource.indexOf("openSavedAnalysisJobDetails(page, uiTitle)");
  const notesMarker = flowsSource.indexOf("jobDetails.getByText(uiNotes");
  const privacyMarker = flowsSource.indexOf('page.getByText("Demo Candidate")');
  const manifestMarker = flowsSource.indexOf("await discoverAndAppendUiRecord");

  assert(openSavedMarker >= 0, "saved Job details helper must be used in structured save flow");
  assert(notesMarker > openSavedMarker, "scoped Notes verification must follow opening saved Job details");
  assert(
    privacyMarker > notesMarker,
    "privacy assertions must remain after scoped Notes verification",
  );
  assert(
    manifestMarker > privacyMarker,
    "cleanup manifest append must remain after privacy assertions",
  );
  assert(
    savedDetailSource.includes("Saved Job details disclosure did not open."),
    "saved disclosure opening must fail with a bounded error",
  );
  assert(
    !savedDetailSource.includes('has: article.locator("summary")'),
    "saved Job details disclosure must not use article-rooted summary locators in filter has",
  );
  assert(
    savedDetailSource.includes(':scope > summary'),
    "saved Job details disclosure must use direct-child summary locators",
  );
  assert(
    savedDetailSource.includes("requireSavedJobDetailsDisclosure"),
    "saved Job details disclosure must wait for exactly one bounded match",
  );
}

function runScopedSkillHeadingRegression() {
  const flowsSource = readFileSync(join(helpersDir, "flows.ts"), "utf8");
  const savedDetailSource = readFileSync(
    join(helpersDir, "saved-analysis-detail.ts"),
    "utf8",
  );

  assert(
    flowsSource.includes("requireVisibleSavedAnalysisDetailArticle(page, uiTitle)"),
    "saved title verification must resolve the exact visible article",
  );
  assert(
    flowsSource.includes("article.getByText(SYNTHETIC_COMPANY"),
    "company verification must be scoped to the saved-analysis article",
  );
  assert(
    flowsSource.includes("matchedSkillsHeading(article)"),
    "Matched skills must use a scoped level-four heading locator",
  );
  assert(
    flowsSource.includes("missingSkillsHeading(article)"),
    "Missing skills must use a scoped level-four heading locator",
  );
  assert(
    !flowsSource.includes("page.getByText(/Matched skills/i).first()"),
    "page-wide Matched skills locator must be removed",
  );
  assert(
    !flowsSource.includes("page.getByText(/Missing skills/i).first()"),
    "page-wide Missing skills locator must be removed",
  );
  assert(
    savedDetailSource.includes('level: 4'),
    "skill headings must use semantic level-four heading locators",
  );
  assert(
    savedDetailSource.includes("MATCHED_SKILLS_HEADING_PATTERN"),
    "Matched skills heading pattern must be anchored",
  );
  assert(
    savedDetailSource.includes("MISSING_SKILLS_HEADING_PATTERN"),
    "Missing skills heading pattern must be anchored",
  );

  assert(isMatchedSkillsHeading("Matched skills (3)"), "Matched skills count headings must match");
  assert(isMissingSkillsHeading("Missing skills (4)"), "Missing skills count headings must match");
  assert(
    !isMissingSkillsHeading("Has missing skills"),
    "filter option Has missing skills must not match Missing skills heading pattern",
  );
  assert(
    !isMatchedSkillsHeading("Matched 3 · Missing 4"),
    "summary metadata must not match Matched skills heading pattern",
  );
  assert(
    !isMissingSkillsHeading("Matched 3 · Missing 4"),
    "summary metadata must not match Missing skills heading pattern",
  );
  assert(
    MATCHED_SKILLS_HEADING_PATTERN.test("Matched skills (0)"),
    "anchored Matched skills pattern must accept numeric counts",
  );
  assert(
    MISSING_SKILLS_HEADING_PATTERN.test("Missing skills (12)"),
    "anchored Missing skills pattern must accept numeric counts",
  );

  const filterOption = "Has missing skills";
  const articleHeading = "Missing skills (2)";
  assert(
    !isMissingSkillsHeading(filterOption) && isMissingSkillsHeading(articleHeading),
    "hidden filter option text outside the article cannot satisfy the Missing skills heading pattern",
  );

  const articleMarker = flowsSource.indexOf("requireVisibleSavedAnalysisDetailArticle(page, uiTitle)");
  const matchedMarker = flowsSource.indexOf("matchedSkillsHeading(article)");
  const missingMarker = flowsSource.indexOf("missingSkillsHeading(article)");
  const openSavedMarker = flowsSource.indexOf("openSavedAnalysisJobDetails(page, uiTitle)");
  const notesMarker = flowsSource.indexOf("jobDetails.getByText(uiNotes");
  const privacyMarker = flowsSource.indexOf('page.getByText("Demo Candidate")');
  const manifestMarker = flowsSource.indexOf("await discoverAndAppendUiRecord");

  assert(articleMarker >= 0, "article resolution must precede scoped assertions");
  assert(matchedMarker > articleMarker, "Matched skills must be verified within the article");
  assert(missingMarker > matchedMarker, "Missing skills must follow Matched skills verification");
  assert(
    openSavedMarker > missingMarker,
    "saved Job details helper must still run after skill verification",
  );
  assert(notesMarker > openSavedMarker, "scoped Notes verification must follow saved Job details");
  assert(privacyMarker > notesMarker, "privacy assertions must remain after Notes verification");
  assert(
    manifestMarker > privacyMarker,
    "manifest append must remain after privacy verification",
  );
}

const ANALYSIS_TITLE = "Exact QA analysis title";
const NOTES_TEXT = "Exact saved QA notes";

function buildSavedDetailFixtureHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <body>
    <details>
      <summary>Optional job details</summary>
    </details>

    <article hidden>
      <h2>${ANALYSIS_TITLE}</h2>
      <details>
        <summary>Job details · Notes included</summary>
      </details>
    </article>

    <article>
      <h2>${ANALYSIS_TITLE}</h2>
      <h4>Matched skills (3)</h4>
      <h4>Missing skills (2)</h4>
      <details>
        <summary>Job details · Notes included</summary>
        <dl>
          <dt>Notes</dt>
          <dd><p>${NOTES_TEXT}</p></dd>
        </dl>
      </details>
    </article>

    <article>
      <h2>Another saved analysis</h2>
      <details>
        <summary>Job details</summary>
      </details>
    </article>
  </body>
</html>`;
}

async function runBrowserBackedDomRegression() {
  const { chromium, expect } = await import("@playwright/test");
  const {
    openSavedAnalysisJobDetails,
    requireSavedJobDetailsDisclosure,
    requireVisibleSavedAnalysisDetailArticle,
    savedJobDetailsDisclosures,
    visibleSavedAnalysisDetailArticle,
  } = await import("../helpers/saved-analysis-detail.ts");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(buildSavedDetailFixtureHtml(), {
      waitUntil: "domcontentloaded",
    });

    await expect(
      visibleSavedAnalysisDetailArticle(page, ANALYSIS_TITLE),
    ).toHaveCount(1);
    await expect(page.getByText("Optional job details", { exact: true })).toBeVisible();

    const article = await requireVisibleSavedAnalysisDetailArticle(page, ANALYSIS_TITLE);
    const disclosures = savedJobDetailsDisclosures(article);
    await expect(disclosures).toHaveCount(1);
    await requireSavedJobDetailsDisclosure(article);

    const details = await openSavedAnalysisJobDetails(page, ANALYSIS_TITLE);
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText(NOTES_TEXT, { exact: true })).toBeVisible();

    await openSavedAnalysisJobDetails(page, ANALYSIS_TITLE);
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText(NOTES_TEXT, { exact: true })).toBeVisible();

    const plainSummaryPage = await browser.newPage();
    await plainSummaryPage.setContent(
      `<article><h2>${ANALYSIS_TITLE}</h2><details><summary>Job details</summary><dl><dt>Notes</dt><dd><p>${NOTES_TEXT}</p></dd></dl></details></article>`,
      { waitUntil: "domcontentloaded" },
    );
    const plainDetails = await openSavedAnalysisJobDetails(
      plainSummaryPage,
      ANALYSIS_TITLE,
    );
    await expect(plainDetails).toHaveAttribute("open", "");
    await expect(plainDetails.getByText(NOTES_TEXT, { exact: true })).toBeVisible();
    await plainSummaryPage.close();

    const missingPage = await browser.newPage();
    await missingPage.setContent(
      `<article><h2>${ANALYSIS_TITLE}</h2></article>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertRejects(
      openSavedAnalysisJobDetails(missingPage, ANALYSIS_TITLE),
      "Saved Job details disclosure was not found.",
    );
    await missingPage.close();

    const duplicatePage = await browser.newPage();
    await duplicatePage.setContent(
      `<article><h2>${ANALYSIS_TITLE}</h2><details><summary>Job details</summary></details><details><summary>Job details · Notes included</summary></details></article>`,
      { waitUntil: "domcontentloaded" },
    );
    await assertRejects(
      openSavedAnalysisJobDetails(duplicatePage, ANALYSIS_TITLE),
      "Multiple saved Job details disclosures were found.",
    );
    await duplicatePage.close();
  } finally {
    await browser.close();
  }
}

try {
  runDisclosureLogicRegression();
  runScopedLocatorRegression();
  runBoundedErrorRegression();
  runManifestOrderRegression();
  runMockDisclosureFlowRegression();
  runNoForceFillRegression();
  runSavedJobDetailsRegression();
  runSavedDetailFlowRegression();
  runScopedSkillHeadingRegression();
  await runBrowserBackedDomRegression();
  console.log("Version 23 structured-save regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
