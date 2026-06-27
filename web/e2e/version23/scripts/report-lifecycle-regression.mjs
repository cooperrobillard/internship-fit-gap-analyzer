#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLAYWRIGHT_RUN_META_RELATIVE,
  SETUP_RESULTS_RELATIVE,
  qaRuntimePath,
} from "../helpers/qa-runtime.ts";
import {
  buildReportSections,
  isCurrentPlaywrightReport,
  markPlaywrightRunStarted,
  recordPreflightSuccess,
  writeSetupResult,
} from "../helpers/report.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "../../..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeConfig(runId) {
  return {
    baseUrl: "https://example.invalid",
    baseHost: "example.invalid",
    renderHealthUrl: "https://example.invalid/health",
    expectedCommit: "deadbeef",
    clerkPublishableKey: "pk_test",
    clerkSecretKey: "sk_test",
    userAEmail: "a@example.invalid",
    userBEmail: "b@example.invalid",
    supabaseUrl: "https://example.invalid",
    supabaseElevatedKey: "sb_secret_test",
    vercelToken: "token",
    seedMode: "admin",
    runId,
    manifestPath: join(webRoot, `test-results/version23-manifest-${runId}.json`),
    reportPath: "/tmp/version23-report-lifecycle.md",
    resultsPath: join(webRoot, "test-results/version23-results.json"),
    runMetaPath: join(webRoot, "test-results/version23-run-meta.json"),
  };
}

function runLifecycleRegression() {
  mkdirSync(join(webRoot, "test-results"), { recursive: true });
  mkdirSync(qaRuntimePath(".qa-runtime/version23", webRoot), { recursive: true });

  recordPreflightSuccess(webRoot);
  writeSetupResult("Vercel production commit", "PASS", "Ready deadbeef", webRoot);

  const config = makeConfig("lifecycle-current");
  markPlaywrightRunStarted(config, webRoot);

  rmSync(join(webRoot, "test-results"), { recursive: true, force: true });
  mkdirSync(join(webRoot, "test-results"), { recursive: true });

  const setup = JSON.parse(
    readFileSync(qaRuntimePath(SETUP_RESULTS_RELATIVE, webRoot), "utf8"),
  );
  assert(
    setup["Automated preflight"]?.status === "PASS",
    "preflight PASS must survive Playwright output cleanup",
  );

  const marker = JSON.parse(
    readFileSync(qaRuntimePath(PLAYWRIGHT_RUN_META_RELATIVE, webRoot), "utf8"),
  );
  assert(
    marker.runId === "lifecycle-current" && marker.executed === true,
    "current-run marker must survive Playwright output cleanup",
  );

  writeFileSync(
    config.resultsPath,
    JSON.stringify({
      suites: [
        {
          title: "Authentication and two-user RLS isolation",
          specs: [
            {
              title: "Authentication and two-user RLS isolation",
              tests: [
                {
                  results: [
                    {
                      status: "failed",
                      error: {
                        message:
                          "Clerk user switch from User A to User B failed: example failure",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: "Structured save and detail",
          specs: [
            {
              title: "Structured save and detail",
              tests: [{ results: [{ status: "skipped" }] }],
            },
          ],
        },
      ],
    }),
    "utf8",
  );

  assert(
    isCurrentPlaywrightReport(config, webRoot),
    "current failed browser test run must be accepted",
  );

  const sections = buildReportSections(config, {}, webRoot);
  const auth = sections.find(
    (section) => section.name === "Authentication and two-user RLS isolation",
  );
  assert(auth?.status === "FAIL", "failed browser test must report FAIL");
  assert(
    auth?.detail.includes("example failure"),
    "failure detail must be sanitized to the first useful line",
  );

  const structured = sections.find(
    (section) => section.name === "Structured save and detail",
  );
  assert(
    structured?.status === "NOT RUN",
    "serially skipped browser test must remain NOT RUN",
  );
  assert(
    sections.find((section) => section.name === "Automated preflight")?.status ===
      "PASS",
    "preflight must remain PASS in final report",
  );

  const staleConfig = makeConfig("stale-other-run");
  assert(
    !isCurrentPlaywrightReport(staleConfig, webRoot),
    "stale report from another run ID must be rejected",
  );
}

try {
  runLifecycleRegression();
  console.log("Version 23 report lifecycle regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
