#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  printCredentialFindings,
  scanTrackedRepository,
} from "../helpers/credential-scan.ts";
import {
  recordPreflightFailure,
  recordPreflightSuccess,
} from "../helpers/report.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../../..");
const webRoot = resolve(scriptDir, "../../..");

function run(command, args, cwd = repoRoot) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

function failPreflight(reason) {
  recordPreflightFailure(reason, webRoot);
  console.error(reason);
  process.exit(1);
}

function runPythonChecks() {
  const steps = [
    ["python3", ["tests/test_taxonomy_role_validation.py"], "Python taxonomy role validation failed"],
    ["python3", ["tests/test_taxonomy_quality.py"], "Python taxonomy quality checks failed"],
    ["python3", ["tests/test_api_service.py"], "Python API service tests failed"],
    ["python3", ["run_tests.py"], "Python test suite failed"],
    [
      "python3",
      [
        "-m",
        "py_compile",
        "api/main.py",
        "api/models.py",
        "api/analysis_service.py",
        "src/extract_keywords.py",
        "src/analysis_runner.py",
        "tests/test_taxonomy_quality.py",
        "tests/test_taxonomy_role_validation.py",
        "tests/test_api_service.py",
        "run_tests.py",
        "streamlit_app.py",
      ],
      "Python compilation failed",
    ],
  ];

  for (const [command, args, message] of steps) {
    if (run(command, args) !== 0) {
      failPreflight(message);
    }
  }
}

function runWebChecks() {
  const steps = [
    ["npm", ["ci"], "npm ci failed"],
    ["npm", ["run", "lint"], "ESLint failed"],
    ["./node_modules/.bin/tsc", ["--noEmit"], "TypeScript check failed"],
    ["npm", ["run", "build"], "Next.js build failed"],
  ];

  for (const [command, args, message] of steps) {
    if (run(command, args, webRoot) !== 0) {
      failPreflight(message);
    }
  }
}

function runGitChecks() {
  if (run("git", ["diff", "--check"]) !== 0) {
    failPreflight("git diff --check failed");
  }

  const status = execFileSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (status) {
    console.log("git status --short:");
    console.log(status);
  }
}

function runCredentialScan() {
  const findings = scanTrackedRepository(repoRoot);
  if (findings.length > 0) {
    printCredentialFindings(findings);
    failPreflight(
      `Credential scan found ${findings.length} likely tracked credential material issue(s).`,
    );
  }
}

runPythonChecks();
runWebChecks();
runGitChecks();
runCredentialScan();
recordPreflightSuccess(webRoot);
console.log("Version 23 preflight passed.");
