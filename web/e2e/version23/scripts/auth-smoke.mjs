#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLERK_QA_USERS_RELATIVE,
  verifyClerkPrecheck,
} from "../helpers/clerk-precheck.ts";
import { loadQaConfig } from "../helpers/config.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "../../..");

function run(command, args, cwd = webRoot) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
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

try {
  const clerkUserIds = await verifyClerkPrecheck(config);
  mkdirSync(resolve(webRoot, "test-results"), { recursive: true });
  writeFileSync(
    resolve(webRoot, CLERK_QA_USERS_RELATIVE),
    JSON.stringify(clerkUserIds, null, 2),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const status = run("npx", [
  "playwright",
  "test",
  "--config=playwright.auth-smoke.config.ts",
]);
process.exit(status);
