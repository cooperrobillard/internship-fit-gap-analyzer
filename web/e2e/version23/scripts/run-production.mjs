#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resetQaReportArtifacts } from "../helpers/artifact-reset.ts";
import { loadQaConfig } from "../helpers/config.ts";
import { persistRunMeta } from "../helpers/manifest.ts";
import {
  markPlaywrightRunStarted,
  recordPreflightFailure,
  writeReport,
} from "../helpers/report.ts";
import { cleanupCurrentRun } from "../helpers/supabase-admin.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "../../..");

function run(command, args, cwd = webRoot, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

function generateRunId() {
  return `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

const runId = process.env.QA_RUN_ID?.trim() || generateRunId();
process.env.QA_RUN_ID = runId;

resetQaReportArtifacts(webRoot);

await Promise.all([
  import("../helpers/report.ts"),
  import("../helpers/supabase-admin.ts"),
]);
console.log("Version 23 QA module import smoke check passed");

let config;
try {
  config = loadQaConfig();
  persistRunMeta(config);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const preflightStatus = run("npx", ["tsx", "e2e/version23/scripts/preflight.mjs"], webRoot);
if (preflightStatus !== 0) {
  const setup = existsSync(resolve(webRoot, ".qa-runtime/version23/setup-results.json"))
    ? JSON.parse(
        readFileSync(resolve(webRoot, ".qa-runtime/version23/setup-results.json"), "utf8"),
      )
    : {};
  const reason =
    setup["Automated preflight"]?.detail ||
    "Automated preflight failed before Playwright started.";
  if (!setup["Automated preflight"]) {
    recordPreflightFailure(reason, webRoot);
  }
  writeReport(config, { preflightFailed: "true" }, webRoot);
  process.exit(preflightStatus);
}

markPlaywrightRunStarted(config, webRoot);

process.env.QA_SKIP_GLOBAL_TEARDOWN_CLEANUP = "1";
const playwrightStatus = run(
  "npx",
  ["playwright", "test", "--config=playwright.config.ts", "--project=version23-qa"],
  webRoot,
  process.env,
);
delete process.env.QA_SKIP_GLOBAL_TEARDOWN_CLEANUP;

const runtimePath = resolve(webRoot, "test-results/version23-runtime.json");
const extra = existsSync(runtimePath)
  ? JSON.parse(readFileSync(runtimePath, "utf8"))
  : {};

writeReport(config, extra, webRoot);

let cleanupStatus = 0;
if (existsSync(config.manifestPath)) {
  try {
    await cleanupCurrentRun(config);
  } catch (error) {
    cleanupStatus = 1;
    console.error(error instanceof Error ? error.message : error);
  }
  writeReport(config, extra, webRoot);
}

console.log("Version 23 QA report: /tmp/version23-data-control-qa.md");
console.log("Version 23 QA JSON: web/test-results/version23-results.json");
console.log("Version 23 QA HTML: web/playwright-report/index.html");

if (playwrightStatus !== 0) {
  process.exit(playwrightStatus);
}
process.exit(cleanupStatus);
