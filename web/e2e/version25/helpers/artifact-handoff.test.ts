import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const helperDir = dirname(fileURLToPath(import.meta.url));
const runProductionSource = readFileSync(
  resolve(helperDir, "../scripts/run-production.mjs"),
  "utf8",
);

function runRunProductionSourceContractRegression() {
  const version23ProductionIndex = runProductionSource.indexOf("qa:version23:production");
  assert(version23ProductionIndex >= 0, "run-production must invoke qa:version23:production");

  assert(
    runProductionSource.includes("loadQaConfig"),
    "run-production must load QA configuration through loadQaConfig()",
  );
  assert(
    runProductionSource.includes('"rev-parse", "HEAD"') ||
      runProductionSource.includes("'rev-parse', 'HEAD'"),
    "run-production must resolve local Git HEAD using git rev-parse HEAD",
  );
  assert(
    runProductionSource.includes("resolveLocalGitHead"),
    "run-production must define resolveLocalGitHead()",
  );
  assert(
    runProductionSource.includes("shell: false"),
    "run-production Git invocation must use shell: false",
  );
  assert(
    runProductionSource.includes("config.expectedCommit"),
    "run-production must compare local HEAD with config.expectedCommit",
  );
  assert(
    runProductionSource.includes("Production target mismatch before QA started"),
    "run-production must emit a sanitized target-mismatch error",
  );

  const targetGuardIndex = runProductionSource.indexOf("assertProductionTargetMatches");
  assert(
    targetGuardIndex >= 0 && targetGuardIndex < version23ProductionIndex,
    "run-production target guard must run before qa:version23:production",
  );

  assert(
    !runProductionSource.includes("console.log(config") &&
      !runProductionSource.includes("console.log(process.env") &&
      !runProductionSource.includes(".env.qa.local"),
    "run-production must not print environment contents or the complete QA config object",
  );
  assert(
    !runProductionSource.match(/console\.(log|info|debug)\([^)]*CLERK_/i) &&
      !runProductionSource.match(/console\.(log|info|debug)\([^)]*SUPABASE_/i) &&
      !runProductionSource.match(/console\.(log|info|debug)\([^)]*VERCEL_/i),
    "run-production must not log secret-bearing environment variables",
  );

  assert(
    runProductionSource.includes("assertVersion23ResultsArtifact"),
    "run-production must retain Version 23 artifact-handoff checks",
  );
  assert(
    runProductionSource.includes("qa:version25:cleanup"),
    "run-production must retain Version 25 cleanup invocation",
  );
  assert(
    runProductionSource.includes("qa:version25:report"),
    "run-production must retain Version 25 report invocation",
  );
  assert(
    runProductionSource.includes("REQUIRED_COMBINED_RUNNER_OUTPUTS"),
    "run-production must retain required-output verification",
  );
  assert(
    runProductionSource.includes("process.exit(1)") ||
      runProductionSource.includes("process.exit(finalStatus)"),
    "run-production must exit nonzero on failure",
  );
}

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

runRunProductionSourceContractRegression();
runArtifactHandoffRegression();
console.log("Version 25 artifact-handoff regression tests passed.");
