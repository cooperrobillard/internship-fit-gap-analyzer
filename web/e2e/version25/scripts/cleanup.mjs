#!/usr/bin/env node
import { loadQaConfig } from "../../version23/helpers/config.ts";
import { cleanupVersion25Profiles } from "../helpers/profile-admin.ts";
import { version25ManifestPath } from "../helpers/profile-manifest.ts";

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--verify");
const config = loadQaConfig();
await cleanupVersion25Profiles(config, version25ManifestPath(config.runId), { dryRun });
console.log(dryRun ? "Version 25 profile cleanup dry-run completed." : "Version 25 profile cleanup completed.");
