#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertVersion23ResultsArtifact,
  REQUIRED_COMBINED_RUNNER_OUTPUTS,
  version23ArtifactMissingMessage,
} from "../helpers/artifact-handoff.ts";
import { loadQaConfig } from "../../version23/helpers/config.ts";

function run(command, args, cwd = process.cwd(), env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", shell: false });
  return result.status ?? 1;
}

function generateRunId() {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

function reportVersion23ArtifactFailure(phase, webRoot) {
  console.error(version23ArtifactMissingMessage(phase));
  console.error(`Expected artifact: ${resolve(webRoot, "test-results/version23-results.json")}`);
}

function resolveLocalGitHead(cwd) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd,
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0 || !result.stdout?.trim()) {
    throw new Error("Unable to resolve local Git HEAD.");
  }

  const localHead = result.stdout.trim();
  if (!/^[0-9a-f]{40}$/i.test(localHead)) {
    throw new Error("Unable to resolve a valid local Git HEAD.");
  }

  return localHead.toLowerCase();
}

function assertProductionTargetMatches(config, cwd) {
  const localHead = resolveLocalGitHead(cwd);
  const expectedCommit = config.expectedCommit.trim().toLowerCase();

  if (localHead !== expectedCommit) {
    throw new Error(
      `Production target mismatch before QA started: local HEAD ${localHead}, QA_EXPECTED_COMMIT ${config.expectedCommit.trim()}.`,
    );
  }
}

const webRoot = process.cwd();
const runId = process.env.QA_RUN_ID?.trim() || generateRunId();
process.env.QA_RUN_ID = runId;

let config;
try {
  config = loadQaConfig();
  assertProductionTargetMatches(config, webRoot);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  run("npm", ["run", "qa:version25:report"], webRoot, process.env);
  process.exit(1);
}

let finalStatus = 0;
const version23Status = run("npm", ["run", "qa:version23:production"], webRoot, process.env);
if (version23Status !== 0) {
  finalStatus = version23Status;
  run("npm", ["run", "qa:version25:report"], webRoot, process.env);
  process.exit(finalStatus);
}

try {
  assertVersion23ResultsArtifact(webRoot, "after-version23");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  reportVersion23ArtifactFailure("after-version23", webRoot);
  run("npm", ["run", "qa:version25:report"], webRoot, process.env);
  process.exit(1);
}

process.env.QA_SKIP_VERSION25_GLOBAL_TEARDOWN_CLEANUP = "1";
const version25Status = run(
  "npx",
  ["playwright", "test", "--config=playwright.version25.config.ts", "--project=version25-launch"],
  webRoot,
  process.env,
);
delete process.env.QA_SKIP_VERSION25_GLOBAL_TEARDOWN_CLEANUP;
if (version25Status !== 0 && finalStatus === 0) finalStatus = version25Status;

try {
  assertVersion23ResultsArtifact(webRoot, "after-version25");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  reportVersion23ArtifactFailure("after-version25", webRoot);
  if (finalStatus === 0) finalStatus = 1;
}

const cleanupStatus = run("npm", ["run", "qa:version25:cleanup"], webRoot, process.env);
if (cleanupStatus !== 0 && finalStatus === 0) finalStatus = cleanupStatus;

const reportStatus = run("npm", ["run", "qa:version25:report"], webRoot, process.env);
if (reportStatus !== 0 && finalStatus === 0) finalStatus = reportStatus;

for (const required of REQUIRED_COMBINED_RUNNER_OUTPUTS) {
  if (!existsSync(resolve(webRoot, required))) {
    console.error(`Missing required automated output: ${required}`);
    if (finalStatus === 0) finalStatus = 1;
  }
}

process.exit(finalStatus);
