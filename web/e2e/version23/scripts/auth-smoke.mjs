#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearClerkQaUserIdsFromEnv,
  QA_USER_A_CLERK_ID_ENV,
  QA_USER_B_CLERK_ID_ENV,
  verifyClerkPrecheck,
} from "../helpers/clerk-precheck.ts";
import { loadQaConfig } from "../helpers/config.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "../../..");

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: webRoot,
    env,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

let config;
try {
  config = loadQaConfig({ requireMutationAck: false });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

let clerkUserIds;
try {
  clerkUserIds = await verifyClerkPrecheck(config);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const childEnv = {
  ...process.env,
  [QA_USER_A_CLERK_ID_ENV]: clerkUserIds.A,
  [QA_USER_B_CLERK_ID_ENV]: clerkUserIds.B,
};

let status = 1;
try {
  status = run(
    "npx",
    ["playwright", "test", "--config=playwright.auth-smoke.config.ts"],
    childEnv,
  );
} finally {
  clearClerkQaUserIdsFromEnv();
}

process.exit(status);
