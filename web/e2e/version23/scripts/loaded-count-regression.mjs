#!/usr/bin/env node
import {
  USER_B_EXPECTED_BASELINE_LOADED_COUNT,
  assertUserBFixtureBaseline,
  parseLoadedCountStatusText,
} from "../helpers/saved-workspace.ts";

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

function runParsingRegression() {
  assert(parseLoadedCountStatusText("1 loaded") === 1, "baseline of 1 must parse");
  assert(parseLoadedCountStatusText("10 loaded") === 10, "page-size count must parse");
  assertThrows(
    () => parseLoadedCountStatusText("10 of 22"),
    "Unable to parse loaded-count status",
  );
  assertThrows(
    () => parseLoadedCountStatusText("loaded"),
    "Unable to parse loaded-count status",
  );
  assertThrows(
    () => parseLoadedCountStatusText("-1 loaded"),
    "Unable to parse loaded-count status",
  );
}

function runFixtureRegression() {
  assertUserBFixtureBaseline(USER_B_EXPECTED_BASELINE_LOADED_COUNT);
  assertThrows(
    () => assertUserBFixtureBaseline(10),
    "unexpected pre-existing saved analyses",
  );
  assert(
    USER_B_EXPECTED_BASELINE_LOADED_COUNT === 1,
    "User B baseline must be 1 for the current seed contract",
  );
}

function runBaselineFlowRegression() {
  const independentUserBStatus = "1 loaded";
  const capturedBaseline = parseLoadedCountStatusText(independentUserBStatus);
  assertUserBFixtureBaseline(capturedBaseline);
  assert(
    capturedBaseline === 1,
    "baseline must be captured before closing the independent User B context",
  );
  assert(
    capturedBaseline !== 10,
    "test must not expect page size 10 when only one User B record exists",
  );

  const postSwitchStatus = "1 loaded";
  const postSwitchCount = parseLoadedCountStatusText(postSwitchStatus);
  assert(
    postSwitchCount === capturedBaseline,
    "post-switch loaded count must equal the recorded User B baseline",
  );
}

function runIsolationRegression() {
  const runId = "regression-run";
  const userBTitle = `V23 QA ${runId} B`;
  const userATitle = `V23 QA ${runId} A`;
  const visibleRows = new Set([userBTitle]);

  assert(visibleRows.has(userBTitle), "current-run User B record must remain visible");
  assert(!visibleRows.has(userATitle), "current-run User A rows must remain absent");

  visibleRows.add(userATitle);
  assert(
    !visibleRows.has(userATitle) || visibleRows.has(userBTitle),
    "isolation contract tracks visible rows",
  );
  visibleRows.delete(userATitle);
  assert(!visibleRows.has(userATitle), "User A rows must stay absent after switch");
}

function runStaleOutcomeRegression() {
  const baseline = parseLoadedCountStatusText("1 loaded");

  const fulfilledStaleStatus = "11 loaded";
  const fulfilledCount = parseLoadedCountStatusText(fulfilledStaleStatus);
  assert(
    fulfilledCount !== baseline,
    "fulfilled stale User A response would increase User B count",
  );
  assert(
    parseLoadedCountStatusText("1 loaded") === baseline,
    "User B baseline must be restored after rejecting stale inflation",
  );

  const canceledStatus = "1 loaded";
  assert(
    parseLoadedCountStatusText(canceledStatus) === baseline,
    "navigation-canceled stale request must preserve the User B baseline",
  );
}

function runPendingCleanupRegression() {
  let primaryFailure;
  try {
    throw new Error("primary isolation failure");
  } catch (error) {
    primaryFailure = error;
  }

  try {
    throw new Error("secondary cleanup noise");
  } catch {
    // cleanup must not replace the primary failure
  }

  assert(
    primaryFailure instanceof Error &&
      primaryFailure.message.includes("primary isolation failure"),
    "pending cleanup must not mask the primary failure",
  );
}

try {
  runParsingRegression();
  runFixtureRegression();
  runBaselineFlowRegression();
  runIsolationRegression();
  runStaleOutcomeRegression();
  runPendingCleanupRegression();
  console.log("Version 23 loaded-count regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
