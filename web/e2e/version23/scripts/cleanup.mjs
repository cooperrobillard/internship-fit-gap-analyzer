#!/usr/bin/env node
import { loadQaConfig, STALE_CLEANUP_ACK } from "../helpers/config.ts";
import {
  cleanupCurrentRun,
  dryRunStaleCleanup,
  staleCleanup,
} from "../helpers/supabase-admin.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const stale = args.includes("--stale");
const runIdArg = args.find((arg) => arg.startsWith("--run-id="))?.split("=")[1];

if (runIdArg) {
  process.env.QA_RUN_ID = runIdArg;
}

const config = loadQaConfig({ requireMutationAck: !dryRun && !stale });

if (dryRun && stale) {
  await dryRunStaleCleanup(config);
  process.exit(0);
}

if (dryRun) {
  const { remainingCount } = await cleanupCurrentRun(config, { dryRun: true });
  if (remainingCount === 0) {
    console.log("Version 23 cleanup verification passed: no current-run records remain.");
    process.exit(0);
  }
  console.log(
    `Dry run: ${remainingCount} exact current-run record(s) remain and would be deleted.`,
  );
  process.exit(1);
}

if (stale) {
  if (process.env.QA_CONFIRM_STALE_CLEANUP !== STALE_CLEANUP_ACK) {
    console.error(
      `Stale cleanup requires QA_CONFIRM_STALE_CLEANUP=${STALE_CLEANUP_ACK}`,
    );
    process.exit(1);
  }
  await staleCleanup(config);
  process.exit(0);
}

await cleanupCurrentRun(config);
