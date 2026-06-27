#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPTIONAL_JOB_FIELD_LABELS,
  shouldClickOptionalJobSummary,
  validateOptionalJobDisclosureCount,
} from "../helpers/analysis-form.ts";

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
  assert(
    !analysisFormSource.includes("force:"),
    "optional job details must not use force-fill",
  );
  assert(
    !analysisFormSource.includes("setAttribute(\"open\""),
    "optional job details must not force the open attribute",
  );
}

try {
  runDisclosureLogicRegression();
  runScopedLocatorRegression();
  runBoundedErrorRegression();
  runManifestOrderRegression();
  runMockDisclosureFlowRegression();
  runNoForceFillRegression();
  console.log("Version 23 structured-save regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
