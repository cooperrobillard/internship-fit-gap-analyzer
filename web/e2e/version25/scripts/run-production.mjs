#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function run(command, args, cwd = process.cwd(), env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", shell: false });
  return result.status ?? 1;
}

function generateRunId() {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

const webRoot = process.cwd();
const runId = process.env.QA_RUN_ID?.trim() || generateRunId();
process.env.QA_RUN_ID = runId;

let finalStatus = 0;
const version23Status = run("npm", ["run", "qa:version23:production"], webRoot, process.env);
if (version23Status !== 0) {
  finalStatus = version23Status;
  run("npm", ["run", "qa:version25:report"], webRoot, process.env);
  process.exit(finalStatus);
}

process.env.QA_SKIP_VERSION25_GLOBAL_TEARDOWN_CLEANUP = "1";
const version25Status = run("npx", ["playwright", "test", "--config=playwright.version25.config.ts", "--project=version25-launch"], webRoot, process.env);
delete process.env.QA_SKIP_VERSION25_GLOBAL_TEARDOWN_CLEANUP;
if (version25Status !== 0 && finalStatus === 0) finalStatus = version25Status;

const cleanupStatus = run("npm", ["run", "qa:version25:cleanup"], webRoot, process.env);
if (cleanupStatus !== 0 && finalStatus === 0) finalStatus = cleanupStatus;

const reportStatus = run("npm", ["run", "qa:version25:report"], webRoot, process.env);
if (reportStatus !== 0 && finalStatus === 0) finalStatus = reportStatus;

for (const required of ["test-results/version23-results.json", "test-results/version25-results.json", "test-results/version25-report-summary.json"]) {
  if (!existsSync(resolve(webRoot, required))) {
    console.error(`Missing required automated output: ${required}`);
    if (finalStatus === 0) finalStatus = 1;
  }
}

process.exit(finalStatus);
