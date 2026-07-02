import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertVersion23ResultsArtifact,
  isVersion25OutputDirIsolatedFromVersion23Json,
  simulatePlaywrightOutputDirReset,
  VERSION23_RESULTS_RELATIVE,
  VERSION25_PLAYWRIGHT_OUTPUT_DIR,
  version23ArtifactMissingMessage,
  version23ResultsPath,
  version25PlaywrightOutputDir,
} from "./artifact-handoff";

function runArtifactHandoffRegression() {
  assert.equal(isVersion25OutputDirIsolatedFromVersion23Json(), true);
  assert.notEqual(VERSION25_PLAYWRIGHT_OUTPUT_DIR, "test-results");
  assert.equal(
    version23ArtifactMissingMessage("after-version23"),
    "Version 23 machine artifact missing immediately after Version 23 completed successfully.",
  );
  assert.equal(
    version23ArtifactMissingMessage("after-version25"),
    "Version 23 machine artifact was removed during the Version 25 handoff.",
  );

  const tempRoot = mkdtempSync(join(tmpdir(), "v25-handoff-"));
  const sentinelPath = version23ResultsPath(tempRoot);
  mkdirSync(join(tempRoot, "test-results"), { recursive: true });
  writeFileSync(sentinelPath, '{"stats":{"unexpected":0}}', "utf8");

  assertVersion23ResultsArtifact(tempRoot, "after-version23");

  const outputDir = version25PlaywrightOutputDir(tempRoot);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "example-failure.png"), "sentinel", "utf8");
  simulatePlaywrightOutputDirReset(outputDir);
  assert.equal(existsSync(outputDir), false);
  assert.equal(existsSync(sentinelPath), true, "Version 25 outputDir reset must not remove Version 23 JSON");
  assertVersion23ResultsArtifact(tempRoot, "after-version25");

  rmSync(sentinelPath);
  assert.throws(
    () => assertVersion23ResultsArtifact(tempRoot, "after-version25"),
    /removed during the Version 25 handoff/,
  );

  rmSync(tempRoot, { recursive: true, force: true });

  const missingRoot = mkdtempSync(join(tmpdir(), "v25-handoff-missing-"));
  assert.throws(
    () => assertVersion23ResultsArtifact(missingRoot, "after-version23"),
    /missing immediately after Version 23 completed successfully/,
  );
  rmSync(missingRoot, { recursive: true, force: true });

  assert.equal(
    VERSION23_RESULTS_RELATIVE,
    "test-results/version23-results.json",
    "Version 23 JSON must remain at the shared test-results root",
  );
}

runArtifactHandoffRegression();
console.log("Version 25 artifact-handoff regression tests passed.");
