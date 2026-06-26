#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanTextContent } from "../helpers/credential-scan.ts";
import {
  buildReportSections,
  computeVerdict,
  recordPreflightFailure,
} from "../helpers/report.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoFindings(label, findings) {
  assert(findings.length === 0, `${label}: expected no findings, got ${findings.length}`);
}

function assertHasCategory(findings, category) {
  assert(
    findings.some((finding) => finding.category === category),
    `Expected finding category ${category}`,
  );
}

function makeFakeServiceRoleJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({ role: "service_role", iss: "qa-test" }),
  ).toString("base64url");
  return `${header}.${payload}.fakesignaturepart`;
}

function runCredentialScanRegression() {
  const serviceRoleOnly = scanTextContent(
    "web/e2e/version23/helpers/assertions.ts",
    'await expect(page.getByText(/service_role/i)).toHaveCount(0);',
  );
  assertNoFindings("symbolic service_role reference", serviceRoleOnly);

  const blankExample = scanTextContent(
    "web/.env.qa.example",
    "SUPABASE_SERVICE_ROLE_KEY=\nCLERK_SECRET_KEY=\n",
  );
  assertNoFindings("blank env example", blankExample);

  const supabaseSecret = scanTextContent(
    "fake/tracked.env",
    `SUPABASE_SECRET_KEY=sb_secret_${"a".repeat(40)}`,
  );
  assertHasCategory(supabaseSecret, "Supabase secret key material");

  const serviceRoleJwt = scanTextContent(
    "fake/service-role.jwt",
    `TOKEN=${makeFakeServiceRoleJwt()}`,
  );
  assertHasCategory(serviceRoleJwt, "Service-role JWT material");
}

function runReportRegression() {
  const tempDir = mkdtempSync(join(tmpdir(), "version23-preflight-report-"));
  const staleWebRoot = join(tempDir, "stale-web");
  mkdirSync(join(staleWebRoot, "test-results"), { recursive: true });

  const config = {
    baseUrl: "https://example.invalid",
    baseHost: "example.invalid",
    renderHealthUrl: "https://example.invalid/health",
    expectedCommit: "deadbeef",
    clerkPublishableKey: "pk_test",
    clerkSecretKey: "sk_test",
    userAEmail: "a@example.invalid",
    userBEmail: "b@example.invalid",
    supabaseUrl: "https://example.invalid",
    supabaseElevatedKey: `sb_secret_${"b".repeat(40)}`,
    runId: "current-run-id",
    manifestPath: join(staleWebRoot, "test-results/version23-manifest-current-run-id.json"),
    reportPath: join(tempDir, "version23-data-control-qa.md"),
    resultsPath: join(staleWebRoot, "test-results/version23-results.json"),
    runMetaPath: join(staleWebRoot, "test-results/version23-run-meta.json"),
    seedMode: "admin",
    vercelToken: "token",
  };

  writeFileSync(
    join(staleWebRoot, "test-results/version23-setup-results.json"),
    JSON.stringify({
      "Automated preflight": {
        name: "Automated preflight",
        status: "FAIL",
        detail: "Credential scan found issues",
      },
      "Vercel production commit": {
        name: "Vercel production commit",
        status: "NOT RUN",
        detail: "",
      },
      "Render health": { name: "Render health", status: "NOT RUN", detail: "" },
      "Synthetic data setup": {
        name: "Synthetic data setup",
        status: "NOT RUN",
        detail: "",
      },
    }),
    "utf8",
  );

  writeFileSync(
    join(staleWebRoot, "test-results/version23-results.json"),
    JSON.stringify({
      suites: [
        {
          specs: [
            {
              title: "Pagination",
              tests: [
                {
                  results: [
                    {
                      status: "failed",
                      error: { message: "stale failure" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    "utf8",
  );

  const sections = buildReportSections(config, {}, staleWebRoot);
  const pagination = sections.find((section) => section.name === "Pagination");
  assert(
    pagination?.status === "NOT RUN",
    "stale Playwright JSON must not mark browser tests FAIL",
  );
  assert(
    sections.find((section) => section.name === "Automated preflight")?.status === "FAIL",
    "preflight failure must be recorded",
  );
  assert(computeVerdict(sections) === "FAIL", "preflight failure must yield FAIL verdict");

  recordPreflightFailure("Synthetic regression failure", staleWebRoot);
  const afterPreflight = buildReportSections(config, {}, staleWebRoot);
  assert(
    afterPreflight
      .filter((section) => section.name !== "Automated preflight")
      .every((section) => section.status === "NOT RUN"),
    "unexecuted browser and setup sections must remain NOT RUN after preflight failure",
  );

  rmSync(tempDir, { recursive: true, force: true });
}

try {
  runCredentialScanRegression();
  runReportRegression();
  console.log("Version 23 preflight regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
