#!/usr/bin/env node
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadQaConfig } from "../../version23/helpers/config.ts";
import { writeVersion25Report, statusFromResultsFile } from "../helpers/report.ts";
import { version25ManifestPath, readProfileManifest } from "../helpers/profile-manifest.ts";

const config = loadQaConfig({ requireMutationAck: false });
const webRoot = process.cwd();
const v23Results = resolve(webRoot, "test-results/version23-results.json");
const v25Results = resolve(webRoot, "test-results/version25-results.json");
const manifestPath = version25ManifestPath(config.runId, webRoot);
let cleanupStatus = "FAIL";
if (existsSync(manifestPath)) {
  cleanupStatus = readProfileManifest(manifestPath, config.runId).cleanupStatus === "PASS" ? "PASS" : "FAIL";
}
writeVersion25Report({
  runId: config.runId,
  version23Status: statusFromResultsFile(v23Results),
  version25Status: statusFromResultsFile(v25Results),
  cleanupStatus,
  details: ["Automated report generated with sanitized status labels only."],
});
console.log("Version 25 QA report: /tmp/version25-production-verification.md");
