import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { loadQaConfig, safeConfigSummary } from "../version23/helpers/config";
import { persistRunMeta } from "../version23/helpers/manifest";
import { defaultSetupStageDeps, runSetupStages } from "../version23/helpers/setup-stages";
import { assertCanonicalBaseUrl } from "./helpers/launch-assertions";
import { version25ManifestPath, saveProfileManifest, emptyProfileManifest } from "./helpers/profile-manifest";

export default async function globalSetup(): Promise<void> {
  const config = loadQaConfig();
  assertCanonicalBaseUrl(config.baseUrl);
  mkdirSync("test-results", { recursive: true });
  persistRunMeta(config);
  saveProfileManifest(version25ManifestPath(config.runId), emptyProfileManifest(config.runId));
  writeFileSync("test-results/version25-config-summary.json", JSON.stringify(safeConfigSummary(config), null, 2));
  console.log("Version 25 QA safe config:", safeConfigSummary(config));

  if (execFileSync("git", ["ls-files", "web/.env.qa.local"], { stdio: "pipe" }).toString().trim()) {
    throw new Error("web/.env.qa.local is tracked");
  }

  const { testedCommit, renderHealth } = await runSetupStages(config, defaultSetupStageDeps(async () => undefined));
  writeFileSync(
    "test-results/version25-runtime.json",
    JSON.stringify({ runId: config.runId, profileManifestPath: version25ManifestPath(config.runId), testedCommit, renderHealth }, null, 2),
  );
}
