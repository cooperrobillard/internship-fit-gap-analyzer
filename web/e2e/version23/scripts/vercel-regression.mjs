#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildVercelDeploymentLookupUrl,
  verifyVercel,
} from "../helpers/vercel.ts";
import { runSetupStages } from "../helpers/setup-stages.ts";
import { buildReportSections } from "../helpers/report.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertRejects(promise, expectedMessage) {
  return promise.then(
    () => {
      throw new Error(`Expected rejection: ${expectedMessage}`);
    },
    (error) => {
      assert(
        error instanceof Error && error.message.includes(expectedMessage),
        `Expected "${expectedMessage}", got "${error instanceof Error ? error.message : error}"`,
      );
    },
  );
}

const baseConfig = {
  baseHost: "internship-fit-gap-analyzer-fnjihjyh1.vercel.app",
  expectedCommit: "abc123def4567890abcdef1234567890abcdef12",
  vercelToken: "fake-vercel-token",
  vercelTeamId: "team_owhx872GsfR0fCBEyem0Hzlf",
};

function readyProductionDeployment(overrides = {}) {
  return {
    url: baseConfig.baseHost,
    alias: [baseConfig.baseHost],
    readyState: "READY",
    target: "production",
    meta: {
      githubCommitSha: baseConfig.expectedCommit,
    },
    ...overrides,
  };
}

function mockFetchForDeployment(deployment, status = 200) {
  return async (url, init) => {
    assert(
      url === buildVercelDeploymentLookupUrl(baseConfig),
      `unexpected lookup URL: ${url}`,
    );
    assert(
      init?.headers?.Authorization === `Bearer ${baseConfig.vercelToken}`,
      "Authorization header must use the Vercel token",
    );
    return {
      status,
      async json() {
        return deployment;
      },
    };
  };
}

async function runVercelLookupRegression() {
  const lookupUrl = buildVercelDeploymentLookupUrl(baseConfig);
  assert(
    lookupUrl.includes(
      encodeURIComponent(baseConfig.baseHost),
    ),
    "lookup URL must include encoded deployment hostname",
  );
  assert(
    lookupUrl.includes(`teamId=${baseConfig.vercelTeamId}`),
    "lookup URL must include teamId when configured",
  );
  assert(
    lookupUrl.includes("withGitRepoInfo=true"),
    "lookup URL must request git repo info",
  );

  const result = await verifyVercel(
    baseConfig,
    mockFetchForDeployment(readyProductionDeployment()),
  );
  assert(
    result.testedCommit === baseConfig.expectedCommit,
    "READY production deployment with expected SHA must pass",
  );

  const teamlessConfig = {
    ...baseConfig,
    vercelTeamId: undefined,
  };
  const teamlessUrl = buildVercelDeploymentLookupUrl(teamlessConfig);
  assert(
    !teamlessUrl.includes("teamId="),
    "teamId must be omitted when not configured",
  );

  await assertRejects(
    verifyVercel(
      baseConfig,
      mockFetchForDeployment(
        readyProductionDeployment({ target: "preview" }),
      ),
    ),
    "target is not production",
  );

  await assertRejects(
    verifyVercel(
      baseConfig,
      mockFetchForDeployment(
        readyProductionDeployment({
          readyState: "BUILDING",
          state: "BUILDING",
        }),
      ),
    ),
    "not Ready",
  );

  await assertRejects(
    verifyVercel(
      baseConfig,
      mockFetchForDeployment(
        readyProductionDeployment({
          meta: {
            githubCommitSha: "0000000000000000000000000000000000000000",
          },
        }),
      ),
    ),
    "commit mismatch",
  );

  await assertRejects(
    verifyVercel(
      baseConfig,
      mockFetchForDeployment(
        readyProductionDeployment({
          meta: {},
          gitSource: {},
        }),
      ),
    ),
    "did not expose a Git commit SHA",
  );

  await assertRejects(
    verifyVercel(
      baseConfig,
      mockFetchForDeployment(readyProductionDeployment(), 404),
    ),
    "lookup failed with HTTP 404",
  );

  const stateFallback = await verifyVercel(
    baseConfig,
    mockFetchForDeployment(
      readyProductionDeployment({
        readyState: undefined,
        state: "READY",
      }),
    ),
  );
  assert(
    stateFallback.testedCommit === baseConfig.expectedCommit,
    "state READY fallback must pass when readyState is absent",
  );

  const gitSourceSha = await verifyVercel(
    baseConfig,
    mockFetchForDeployment(
      readyProductionDeployment({
        meta: {},
        gitSource: { sha: baseConfig.expectedCommit },
      }),
    ),
  );
  assert(
    gitSourceSha.testedCommit === baseConfig.expectedCommit,
    "gitSource.sha must be accepted as commit SHA",
  );
}

async function runSetupStageRegression() {
  const tempDir = mkdtempSync(join(tmpdir(), "version23-vercel-setup-"));
  const webRoot = join(tempDir, "web");
  mkdirSync(join(webRoot, "test-results"), { recursive: true });
  const previousCwd = process.cwd();
  process.chdir(webRoot);

  try {
    const qaConfig = {
      baseUrl: `https://${baseConfig.baseHost}`,
      baseHost: baseConfig.baseHost,
      renderHealthUrl: "https://example.invalid/health",
      expectedCommit: baseConfig.expectedCommit,
      clerkPublishableKey: "pk_test",
      clerkSecretKey: "sk_test",
      userAEmail: "a@example.invalid",
      userBEmail: "b@example.invalid",
      supabaseUrl: "https://example.invalid",
      supabaseElevatedKey: "sb_secret_test",
      vercelToken: baseConfig.vercelToken,
      vercelTeamId: baseConfig.vercelTeamId,
      seedMode: "admin",
      runId: "vercel-regression-run",
      manifestPath: join(
        webRoot,
        "test-results/version23-manifest-vercel-regression-run.json",
      ),
      reportPath: join(tempDir, "version23-data-control-qa.md"),
      resultsPath: join(webRoot, "test-results/version23-results.json"),
      runMetaPath: join(webRoot, "test-results/version23-run-meta.json"),
    };

    let seedCalled = false;
    const mockClerkPrecheck = async () => ({ A: "user_a", B: "user_b" });

    await assertRejects(
      runSetupStages(qaConfig, {
        verifyVercel: async () => {
          throw new Error("Vercel deployment lookup failed with HTTP 404");
        },
        verifyRender: async () => "HTTP 200 status ok",
        verifyClerkPrecheck: mockClerkPrecheck,
        seedAdminRecords: async () => {
          seedCalled = true;
        },
      }),
      "lookup failed with HTTP 404",
    );

    assert(!seedCalled, "seed helper must not run after Vercel failure");

    const setup = JSON.parse(
      readFileSync(join(webRoot, ".qa-runtime/version23/setup-results.json"), "utf8"),
    );
    assert(
      setup["Vercel production commit"]?.status === "FAIL",
      "Vercel failure must be recorded under Vercel production commit",
    );
    assert(
      setup["Render health"]?.status === "NOT RUN",
      "Render health must remain NOT RUN after Vercel failure",
    );
    assert(
      setup["Clerk authentication precheck"]?.status === "NOT RUN",
      "Clerk authentication precheck must remain NOT RUN after Vercel failure",
    );
    assert(
      setup["Synthetic data setup"]?.status === "NOT RUN",
      "Synthetic data setup must remain NOT RUN after Vercel failure",
    );

    const sections = buildReportSections(qaConfig, {}, webRoot);
    assert(
      sections.find((section) => section.name === "Vercel production commit")
        ?.status === "FAIL",
      "report must classify Vercel failure under Vercel production commit",
    );
    assert(
      sections.find((section) => section.name === "Synthetic data setup")
        ?.status === "NOT RUN",
      "report must not classify Vercel failure under Synthetic data setup",
    );

    seedCalled = false;
    await assertRejects(
      runSetupStages(qaConfig, {
        verifyVercel: async () => ({
          testedCommit: baseConfig.expectedCommit,
        }),
        verifyRender: async () => {
          throw new Error("Render health failed with HTTP 503");
        },
        verifyClerkPrecheck: mockClerkPrecheck,
        seedAdminRecords: async () => {
          seedCalled = true;
        },
      }),
      "Render health failed with HTTP 503",
    );
    assert(!seedCalled, "seed helper must not run after Render failure");

    const renderFailureSetup = JSON.parse(
      readFileSync(join(webRoot, ".qa-runtime/version23/setup-results.json"), "utf8"),
    );
    assert(
      renderFailureSetup["Vercel production commit"]?.status === "PASS",
      "Vercel must remain PASS when Render fails",
    );
    assert(
      renderFailureSetup["Render health"]?.status === "FAIL",
      "Render failure must be recorded under Render health",
    );
    assert(
      renderFailureSetup["Clerk authentication precheck"]?.status === "NOT RUN",
      "Clerk authentication precheck must remain NOT RUN after Render failure",
    );
    assert(
      renderFailureSetup["Synthetic data setup"]?.status === "NOT RUN",
      "Synthetic data setup must remain NOT RUN after Render failure",
    );

    seedCalled = false;
    await assertRejects(
      runSetupStages(qaConfig, {
        verifyVercel: async () => ({
          testedCommit: baseConfig.expectedCommit,
        }),
        verifyRender: async () => "HTTP 200 status ok",
        verifyClerkPrecheck: mockClerkPrecheck,
        seedAdminRecords: async () => {
          seedCalled = true;
          throw new Error("Synthetic seed failed");
        },
      }),
      "Synthetic seed failed",
    );
    assert(seedCalled, "seed helper must run when Vercel and Render pass");

    const seedFailureSetup = JSON.parse(
      readFileSync(join(webRoot, ".qa-runtime/version23/setup-results.json"), "utf8"),
    );
    assert(
      seedFailureSetup["Synthetic data setup"]?.status === "FAIL",
      "seeding failure must be recorded under Synthetic data setup",
    );
    assert(
      seedFailureSetup["Vercel production commit"]?.status === "PASS",
      "Vercel must remain PASS when seeding fails",
    );
    assert(
      seedFailureSetup["Render health"]?.status === "PASS",
      "Render must remain PASS when seeding fails",
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  await runVercelLookupRegression();
  await runSetupStageRegression();
  console.log("Version 23 Vercel regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
