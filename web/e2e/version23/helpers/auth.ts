import { clerk } from "@clerk/testing/playwright";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { QaConfig } from "./config";
import {
  loadClerkQaUserIdsFromEnv,
  type ClerkQaUserIds,
} from "./clerk-precheck";
import {
  assertSavedAuthenticatedState,
  getActiveClerkUserId,
  mapLandingNavigationError,
  mapSavedNavigationError,
  navigateToLandingPage,
  navigateToSavedWorkspace,
  safeAuthErrorDetail,
  signInByEmail,
  waitForClerkOnLandingPage,
  type AuthStageDeps,
} from "./auth-stages";
import {
  assertInitialLoginPreconditions,
  playwrightStepRunner,
  runAuthStep,
  switchQaUserOnPage as performSwitchQaUserOnPage,
} from "./auth-switch";

export type SignedInQaUser = {
  context: BrowserContext;
  page: Page;
  label: "A" | "B";
  email: string;
};

type AuthStageOptions = {
  qaUserIds?: ClerkQaUserIds;
  deps?: AuthStageDeps;
};

function clerkConfigurationMessage(label: "A" | "B", detail: string): string {
  return [
    `Clerk authentication failed for User ${label}: ${detail}`,
    "Verify CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY match the production Clerk instance.",
    "Confirm the configured QA user exists and testing is enabled for the instance.",
    "Do not expose CLERK_SECRET_KEY to the browser.",
    "Optional ignored storage-state auth is documented in web/e2e/version23/README.md,",
    "but storage state must not be treated as a passing Clerk sign-in assertion.",
  ].join(" ");
}

function resolveQaUserIds(options: AuthStageOptions = {}): ClerkQaUserIds {
  return options.qaUserIds ?? loadClerkQaUserIdsFromEnv();
}

async function performStagedSignIn(
  page: Page,
  config: QaConfig,
  label: "A" | "B",
  options: AuthStageOptions = {},
): Promise<void> {
  const email = label === "A" ? config.userAEmail : config.userBEmail;
  const qaUserIds = resolveQaUserIds(options);
  const deps = options.deps ?? {};

  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    throw new Error(
      clerkConfigurationMessage(
        label,
        "CLERK_SECRET_KEY is not set in the Node test process.",
      ),
    );
  }

  await assertInitialLoginPreconditions(page);

  await runAuthStep("open landing page", async () => {
    try {
      await navigateToLandingPage(page, config, label);
    } catch (error) {
      throw mapLandingNavigationError(error, label);
    }
  });

  await runAuthStep("wait for Clerk", async () => {
    await waitForClerkOnLandingPage(page, label, deps);
  });

  await runAuthStep("sign in by email", async () => {
    await signInByEmail(page, email, label, deps);
  });

  await runAuthStep("open Saved", async () => {
    try {
      await navigateToSavedWorkspace(page, config);
    } catch (error) {
      throw mapSavedNavigationError(error, label);
    }
  });

  await runAuthStep("verify identity", async () => {
    await assertSavedAuthenticatedState(page, label, qaUserIds);
  });
}

export async function assertAuthenticatedApplicationState(
  page: Page,
  label: "A" | "B",
  qaUserIds?: ClerkQaUserIds,
): Promise<void> {
  const resolvedUserIds = qaUserIds ?? loadClerkQaUserIdsFromEnv();
  await assertSavedAuthenticatedState(page, label, resolvedUserIds);
}

export async function signInQaUserOnPage(
  page: Page,
  config: QaConfig,
  label: "A" | "B",
  options: AuthStageOptions = {},
): Promise<void> {
  try {
    await performStagedSignIn(page, config, label, options);
  } catch (error) {
    const detail = safeAuthErrorDetail(error);
    throw new Error(clerkConfigurationMessage(label, detail), { cause: error });
  }
}

export async function signInQaUser(
  browser: Browser,
  config: QaConfig,
  label: "A" | "B",
  options: AuthStageOptions = {},
): Promise<SignedInQaUser> {
  const email = label === "A" ? config.userAEmail : config.userBEmail;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await performStagedSignIn(page, config, label, options);
    return { context, page, label, email };
  } catch (error) {
    await context.close().catch(() => undefined);
    const detail = safeAuthErrorDetail(error);
    throw new Error(clerkConfigurationMessage(label, detail), { cause: error });
  }
}

export async function switchQaUserOnPage(
  page: Page,
  config: QaConfig,
  fromLabel: "A" | "B",
  toLabel: "A" | "B",
  options: AuthStageOptions & { stepRunner?: import("./auth-steps").StepRunner } = {},
): Promise<void> {
  await performSwitchQaUserOnPage(page, config, fromLabel, toLabel, {
    qaUserIds: options.qaUserIds ?? loadClerkQaUserIdsFromEnv(),
    deps: options.deps,
    stepRunner: options.stepRunner ?? playwrightStepRunner,
  });
}

export async function signOutQaUser(page: Page): Promise<void> {
  await clerk.signOut({ page });
}

export { getActiveClerkUserId };
