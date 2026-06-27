#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearClerkQaUserIdsFromEnv,
  loadClerkQaUserIdsFromEnv,
  QA_USER_A_CLERK_ID_ENV,
  QA_USER_B_CLERK_ID_ENV,
  setClerkQaUserIdsInEnv,
  verifyClerkPrecheck,
} from "../helpers/clerk-precheck.ts";
import {
  mapLandingNavigationError,
  mapSavedNavigationError,
  navigateToLandingPage,
  navigateToSavedWorkspace,
  safeAuthErrorDetail,
  signInByEmail,
  verifyAuthenticatedIdentity,
  waitForClerkOnLandingPage,
} from "../helpers/auth-stages.ts";
import { runSetupStages } from "../helpers/setup-stages.ts";
import { buildReportSections } from "../helpers/report.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "../../..");

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
  clerkSecretKey: "sk_test_fake",
  clerkPublishableKey: "pk_test_fake",
  userAEmail: "qa-a@example.invalid",
  userBEmail: "qa-b@example.invalid",
};

const qaConfig = {
  baseUrl: "https://example.invalid",
  userAEmail: baseConfig.userAEmail,
  userBEmail: baseConfig.userBEmail,
  clerkSecretKey: baseConfig.clerkSecretKey,
};

function makeFetchMock(handlers) {
  return async (url) => {
    const handler = handlers.find((item) => item.match(url));
    if (!handler) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    return handler.respond();
  };
}

function createPage(mode) {
  const currentUrl = "https://example.invalid/";
  return {
    url: () => currentUrl,
    title: async () => "Example",
    goto: async (target, options = {}) => {
      if (mode === "landing-timeout") {
        throw new Error(`Timeout ${options.timeout ?? 0}ms exceeded`);
      }
      if (mode === "saved-timeout" && target.includes("/dashboard/saved")) {
        throw new Error(`Timeout ${options.timeout ?? 0}ms exceeded`);
      }
      return { status: () => 200 };
    },
    getByRole: () => ({
      isVisible: async () => false,
      toBeVisible: async () => undefined,
    }),
    getByText: () => ({
      toHaveCount: async () => undefined,
    }),
    evaluate: async () => (mode === "identity-mismatch" ? "user_wrong" : "user_a"),
  };
}

async function runClerkPrecheckRegression() {
  const instanceHandler = {
    match: (url) => url === "https://api.clerk.com/v1/instance",
    respond: async () => ({
      ok: true,
      async json() {
        return { id: "ins_test" };
      },
    }),
  };

  const usersHandler = (email, userId, count = 1) => ({
    match: (url) =>
      url.startsWith("https://api.clerk.com/v1/users?") &&
      url.includes(encodeURIComponent(email)),
    respond: async () => ({
      ok: true,
      async json() {
        return count === 0 ? [] : Array.from({ length: count }, () => ({ id: userId }));
      },
    }),
  });

  const passIds = await verifyClerkPrecheck(
    baseConfig,
    makeFetchMock([
      instanceHandler,
      usersHandler(baseConfig.userAEmail, "user_a"),
      usersHandler(baseConfig.userBEmail, "user_b"),
    ]),
  );
  assert(passIds.A === "user_a" && passIds.B === "user_b", "precheck must return user IDs");

  await assertRejects(
    verifyClerkPrecheck(
      baseConfig,
      makeFetchMock([
        instanceHandler,
        usersHandler(baseConfig.userAEmail, "user_a", 0),
      ]),
    ),
    "Configured QA User A was not found",
  );

  await assertRejects(
    verifyClerkPrecheck(
      baseConfig,
      makeFetchMock([
        instanceHandler,
        usersHandler(baseConfig.userAEmail, "user_a"),
        usersHandler(baseConfig.userBEmail, "user_b", 0),
      ]),
    ),
    "Configured QA User B was not found",
  );

  await assertRejects(
    verifyClerkPrecheck(
      baseConfig,
      makeFetchMock([
        instanceHandler,
        usersHandler(baseConfig.userAEmail, "user_a"),
        usersHandler(baseConfig.userBEmail, "user_a"),
      ]),
    ),
    "resolved to the same Clerk user ID",
  );
}

async function runAuthStageRegression() {
  await assertRejects(
    (async () => {
      try {
        await navigateToLandingPage(createPage("landing-timeout"), qaConfig, "A");
      } catch (error) {
        throw mapLandingNavigationError(error, "A");
      }
    })(),
    "landing-page navigation timed out",
  );

  await assertRejects(
    waitForClerkOnLandingPage(createPage("clerk-load"), "A", {
      clerk: {
        loaded: async () => {
          throw new Error("Clerk did not load on the production landing page for User A.");
        },
        signIn: async () => undefined,
      },
    }),
    "did not load on the production landing page",
  );

  await assertRejects(
    signInByEmail(createPage("sign-in"), baseConfig.userAEmail, "A", {
      clerk: {
        loaded: async () => undefined,
        signIn: async () => {
          throw new Error("Clerk direct email sign-in timed out for User A.");
        },
      },
    }),
    "direct email sign-in timed out",
  );

  await assertRejects(
    (async () => {
      try {
        await navigateToSavedWorkspace(createPage("saved-timeout"), qaConfig);
      } catch (error) {
        throw mapSavedNavigationError(error, "A");
      }
    })(),
    "Protected Saved navigation timed out",
  );

  await assertRejects(
    verifyAuthenticatedIdentity(createPage("identity-mismatch"), "A", {
      A: "user_a",
      B: "user_b",
    }),
    "Authenticated identity did not match User A",
  );

  const masked = safeAuthErrorDetail(
    new Error("browserContext.close: Target page, context or browser has been closed", {
      cause: new Error("Clerk did not load on the production landing page for User A."),
    }),
  );
  assert(
    masked.includes("did not load on the production landing page"),
    "context cleanup failure must not mask the original error",
  );

  const landingMapped = mapLandingNavigationError(
    new Error("Timeout 45000ms exceeded"),
    "A",
  );
  assert(
    landingMapped.message.includes("landing-page navigation timed out"),
    "landing navigation failure must report landing stage",
  );
}

async function runHandoffRegression() {
  const previousA = process.env[QA_USER_A_CLERK_ID_ENV];
  const previousB = process.env[QA_USER_B_CLERK_ID_ENV];

  try {
    setClerkQaUserIdsInEnv({ A: "user_a_handoff", B: "user_b_handoff" });
    rmSync(resolve(webRoot, "test-results"), { recursive: true, force: true });

    const idsAfterCleanup = loadClerkQaUserIdsFromEnv();
    assert(
      idsAfterCleanup.A === "user_a_handoff" && idsAfterCleanup.B === "user_b_handoff",
      "Playwright output-directory cleanup must not delete env-based Clerk ID handoff",
    );

    clearClerkQaUserIdsFromEnv();
    await assertRejects(
      Promise.resolve().then(() => loadClerkQaUserIdsFromEnv()),
      "User A ID is not available",
    );

    process.env[QA_USER_A_CLERK_ID_ENV] = "user_a_only";
    delete process.env[QA_USER_B_CLERK_ID_ENV];
    await assertRejects(
      Promise.resolve().then(() => loadClerkQaUserIdsFromEnv()),
      "User B ID is not available",
    );

    process.env[QA_USER_B_CLERK_ID_ENV] = "user_a_only";
    await assertRejects(
      Promise.resolve().then(() => loadClerkQaUserIdsFromEnv()),
      "must be different",
    );

    const capturedLogs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      capturedLogs.push(args.join(" "));
    };
    try {
      await verifyClerkPrecheck(
        baseConfig,
        makeFetchMock([
          {
            match: (url) => url === "https://api.clerk.com/v1/instance",
            respond: async () => ({
              ok: true,
              async json() {
                return { id: "ins_test" };
              },
            }),
          },
          {
            match: (url) =>
              url.startsWith("https://api.clerk.com/v1/users?") &&
              url.includes(encodeURIComponent(baseConfig.userAEmail)),
            respond: async () => ({
              ok: true,
              async json() {
                return [{ id: "user_a_secret" }];
              },
            }),
          },
          {
            match: (url) =>
              url.startsWith("https://api.clerk.com/v1/users?") &&
              url.includes(encodeURIComponent(baseConfig.userBEmail)),
            respond: async () => ({
              ok: true,
              async json() {
                return [{ id: "user_b_secret" }];
              },
            }),
          },
        ]),
      );
    } finally {
      console.log = originalLog;
    }
    assert(
      !capturedLogs.some(
        (line) => line.includes("user_a_secret") || line.includes("user_b_secret"),
      ),
      "Clerk user IDs must not be printed",
    );

    const childEnv = {
      ...process.env,
      [QA_USER_A_CLERK_ID_ENV]: "user_a_fake",
      [QA_USER_B_CLERK_ID_ENV]: "user_b_fake",
    };
    const handoffResult = spawnSync(
      "npx",
      [
        "playwright",
        "test",
        "e2e/version23/auth-smoke-handoff.spec.ts",
        "--config=playwright.auth-smoke.config.ts",
        "--project=auth-smoke-handoff",
      ],
      {
        cwd: webRoot,
        env: childEnv,
        encoding: "utf8",
      },
    );
    assert(
      handoffResult.status === 0,
      `auth-smoke handoff Playwright spec must pass with fake IDs: ${handoffResult.stderr || handoffResult.stdout}`,
    );

    let seedCalled = false;
    const setupConfig = {
      baseUrl: "https://example.invalid",
      baseHost: "example.invalid",
      renderHealthUrl: "https://example.invalid/health",
      expectedCommit: "deadbeef",
      clerkPublishableKey: "pk_test",
      clerkSecretKey: "sk_test",
      userAEmail: "a@example.invalid",
      userBEmail: "b@example.invalid",
      supabaseUrl: "https://example.invalid",
      supabaseElevatedKey: "sb_secret_test",
      vercelToken: "token",
      seedMode: "admin",
      runId: "handoff-regression-run",
      manifestPath: join(webRoot, "test-results/version23-manifest-handoff-regression-run.json"),
      reportPath: join(tmpdir(), "version23-handoff-regression.md"),
      resultsPath: join(webRoot, "test-results/version23-results.json"),
      runMetaPath: join(webRoot, "test-results/version23-run-meta.json"),
    };

    clearClerkQaUserIdsFromEnv();
    mkdirSync(join(webRoot, "test-results"), { recursive: true });
    const previousCwd = process.cwd();
    process.chdir(webRoot);
    try {
      const productionIds = await runSetupStages(setupConfig, {
        verifyVercel: async () => ({ testedCommit: "deadbeef" }),
        verifyRender: async () => "HTTP 200 status ok",
        verifyClerkPrecheck: async () => ({ A: "prod_user_a", B: "prod_user_b" }),
        seedAdminRecords: async () => {
          seedCalled = true;
        },
      });
      assert(
        productionIds.clerkUserIds.A === "prod_user_a",
        "production global setup must expose Clerk IDs through process.env",
      );
      assert(
        process.env[QA_USER_A_CLERK_ID_ENV] === "prod_user_a",
        "production global setup must set QA_USER_A_CLERK_ID",
      );
      assert(
        process.env[QA_USER_B_CLERK_ID_ENV] === "prod_user_b",
        "production global setup must set QA_USER_B_CLERK_ID",
      );
      assert(seedCalled, "production setup must still seed after Clerk precheck");
    } finally {
      process.chdir(previousCwd);
    }
  } finally {
    clearClerkQaUserIdsFromEnv();
    if (previousA !== undefined) {
      process.env[QA_USER_A_CLERK_ID_ENV] = previousA;
    }
    if (previousB !== undefined) {
      process.env[QA_USER_B_CLERK_ID_ENV] = previousB;
    }
  }
}

async function runSetupStageRegression() {
  const tempDir = mkdtempSync(join(tmpdir(), "version23-auth-setup-"));
  const webRoot = join(tempDir, "web");
  mkdirSync(join(webRoot, "test-results"), { recursive: true });
  const previousCwd = process.cwd();
  process.chdir(webRoot);

  try {
    const setupConfig = {
      baseUrl: "https://example.invalid",
      baseHost: "example.invalid",
      renderHealthUrl: "https://example.invalid/health",
      expectedCommit: "deadbeef",
      clerkPublishableKey: "pk_test",
      clerkSecretKey: "sk_test",
      userAEmail: "a@example.invalid",
      userBEmail: "b@example.invalid",
      supabaseUrl: "https://example.invalid",
      supabaseElevatedKey: "sb_secret_test",
      vercelToken: "token",
      seedMode: "admin",
      runId: "auth-regression-run",
      manifestPath: join(webRoot, "test-results/version23-manifest-auth-regression-run.json"),
      reportPath: join(tempDir, "version23-data-control-qa.md"),
      resultsPath: join(webRoot, "test-results/version23-results.json"),
      runMetaPath: join(webRoot, "test-results/version23-run-meta.json"),
    };

    let seedCalled = false;

    await assertRejects(
      runSetupStages(setupConfig, {
        verifyVercel: async () => ({ testedCommit: "deadbeef" }),
        verifyRender: async () => "HTTP 200 status ok",
        verifyClerkPrecheck: async () => {
          throw new Error(
            "Configured QA User A was not found in the Clerk instance associated with CLERK_SECRET_KEY.",
          );
        },
        seedAdminRecords: async () => {
          seedCalled = true;
        },
      }),
      "Configured QA User A was not found",
    );

    assert(!seedCalled, "auth-smoke mode must perform no Supabase seed calls");

    const setup = JSON.parse(
      readFileSync(join(webRoot, ".qa-runtime/version23/setup-results.json"), "utf8"),
    );
    assert(
      setup["Clerk authentication precheck"]?.status === "FAIL",
      "Clerk precheck failure must be recorded",
    );
    assert(
      setup["Synthetic data setup"]?.status === "NOT RUN",
      "seeding must remain NOT RUN after Clerk precheck failure",
    );

    const sections = buildReportSections(setupConfig, {}, webRoot);
    assert(
      sections.find((section) => section.name === "Clerk authentication precheck")
        ?.status === "FAIL",
      "report must include Clerk authentication precheck failure",
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

try {
  await runClerkPrecheckRegression();
  await runAuthStageRegression();
  await runHandoffRegression();
  await runSetupStageRegression();
  console.log("Version 23 auth regression checks passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
