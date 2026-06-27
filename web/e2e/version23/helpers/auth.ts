import { clerk } from "@clerk/testing/playwright";
import { test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { QaConfig } from "./config";
import {
  CLERK_QA_USERS_RELATIVE,
  type ClerkQaUserIds,
} from "./clerk-precheck";
import {
  assertSavedAuthenticatedState,
  mapLandingNavigationError,
  mapSavedNavigationError,
  navigateToLandingPage,
  navigateToSavedWorkspace,
  safeAuthErrorDetail,
  signInByEmail,
  waitForClerkOnLandingPage,
  type AuthStageDeps,
} from "./auth-stages";

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

async function runAuthStep<T>(
  title: string,
  body: () => Promise<T>,
): Promise<T> {
  try {
    return await test.step(title, body);
  } catch {
    return body();
  }
}

export function loadPersistedQaUserIds(
  webRoot = process.cwd(),
): ClerkQaUserIds | undefined {
  const path = resolve(webRoot, CLERK_QA_USERS_RELATIVE);
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ClerkQaUserIds;
  } catch {
    return undefined;
  }
}

function resolveQaUserIds(options: AuthStageOptions = {}): ClerkQaUserIds {
  const qaUserIds = options.qaUserIds ?? loadPersistedQaUserIds();
  if (!qaUserIds) {
    throw new Error(
      "Clerk QA user IDs are not available. Run the Clerk authentication precheck before browser sign-in.",
    );
  }
  return qaUserIds;
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
  const resolvedUserIds = qaUserIds ?? loadPersistedQaUserIds();
  if (!resolvedUserIds) {
    throw new Error(
      "Clerk QA user IDs are not available for authenticated identity verification.",
    );
  }
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

export async function signOutQaUser(page: Page): Promise<void> {
  await clerk.signOut({ page });
}
