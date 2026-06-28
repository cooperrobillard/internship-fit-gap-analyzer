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
  SAVED_JOB_DETAILS_SUMMARY_PATTERN,
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
  console.log("Version 23 structured-save regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
