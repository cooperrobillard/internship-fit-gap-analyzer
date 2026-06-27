import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadQaConfig, safeConfigSummary } from "./helpers/config";
import { persistRunMeta } from "./helpers/manifest";
import {
  defaultSetupStageDeps,
  runSetupStages,
} from "./helpers/setup-stages";
import { seedAdminRecords } from "./helpers/supabase-admin";

export default async function globalSetup(): Promise<void> {
  const config = loadQaConfig();
  mkdirSync("test-results", { recursive: true });
  persistRunMeta(config);
  writeFileSync(
    "test-results/version23-config-summary.json",
    JSON.stringify(safeConfigSummary(config), null, 2),
  );
  console.log("Version 23 QA safe config:", safeConfigSummary(config));

  if (
    execFileSync("git", ["ls-files", "web/.env.qa.local"], {
      stdio: "pipe",
    })
      .toString()
      .trim()
  ) {
    throw new Error("web/.env.qa.local is tracked");
  }

  const { testedCommit, renderHealth } = await runSetupStages(
    config,
    defaultSetupStageDeps(seedAdminRecords),
  );

  writeFileSync(
    "test-results/version23-runtime.json",
    JSON.stringify(
      {
        runId: config.runId,
        manifestPath: config.manifestPath,
        reportPath: config.reportPath,
        testedCommit,
        renderHealth,
      },
      null,
      2,
    ),
  );
}
