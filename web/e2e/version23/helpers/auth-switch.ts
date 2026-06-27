import { clerk } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";
import type { ClerkQaUserIds } from "./clerk-precheck";
import type { QaConfig } from "./config";
import {
  directStepRunner,
  playwrightStepRunner,
  runAuthStep,
  type StepRunner,
} from "./auth-steps";
import {
  CLERK_SIGN_IN_TIMEOUT_MS,
  getActiveClerkUserId,
  signOutByClerk,
  verifyAuthenticatedIdentity,
  waitForNoActiveClerkUser,
  withOperationTimeout,
  type AuthStageDeps,
} from "./auth-stages";

export type SwitchOptions = {
  qaUserIds: ClerkQaUserIds;
  deps?: AuthStageDeps;
  stepRunner?: StepRunner;
};

function switchFailureMessage(
  fromLabel: "A" | "B",
  toLabel: "A" | "B",
  detail: string,
): string {
  return `Clerk user switch from User ${fromLabel} to User ${toLabel} failed: ${detail}`;
}

export async function switchQaUserOnPage(
  page: Page,
  config: QaConfig,
  fromLabel: "A" | "B",
  toLabel: "A" | "B",
  options: SwitchOptions,
): Promise<void> {
  const {
    qaUserIds,
    deps = {},
    stepRunner = playwrightStepRunner,
  } = options;
  const clerkClient = deps.clerk ?? clerk;
  const toEmail = toLabel === "A" ? config.userAEmail : config.userBEmail;

  try {
    await runAuthStep(
      `verify User ${fromLabel} before switch`,
      async () => {
        const activeUserId = await getActiveClerkUserId(page);
        if (!activeUserId) {
          throw new Error(
            `User switch was attempted while signed out; expected User ${fromLabel}.`,
          );
        }
        await verifyAuthenticatedIdentity(page, fromLabel, qaUserIds);
      },
      stepRunner,
    );

    await runAuthStep(
      `sign out User ${fromLabel}`,
      async () => {
        await signOutByClerk(page, fromLabel, deps);
      },
      stepRunner,
    );

    await runAuthStep(
      "wait for signed-out state",
      async () => {
        await waitForNoActiveClerkUser(page, fromLabel);
      },
      stepRunner,
    );

    await runAuthStep(
      `sign in User ${toLabel}`,
      async () => {
        await withOperationTimeout(
          clerkClient.signIn({
            page,
            emailAddress: toEmail,
          }),
          CLERK_SIGN_IN_TIMEOUT_MS,
          `Clerk sign-in timed out while switching to User ${toLabel}.`,
        );
      },
      stepRunner,
    );

    await runAuthStep(
      `verify User ${toLabel} after switch`,
      async () => {
        try {
          await verifyAuthenticatedIdentity(page, toLabel, qaUserIds);
        } catch {
          throw new Error(
            `Authenticated identity did not match User ${toLabel} after switching.`,
          );
        }
      },
      stepRunner,
    );

    if (new URL(page.url()).pathname === "/") {
      throw new Error("User switch navigated to the landing page.");
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.split("\n")[0].trim() : "unknown failure";
    throw new Error(switchFailureMessage(fromLabel, toLabel, detail), {
      cause: error,
    });
  }
}

export async function assertInitialLoginPreconditions(page: Page): Promise<void> {
  const activeUserId = await getActiveClerkUserId(page);
  if (activeUserId) {
    throw new Error(
      "Initial login was attempted while a user is already signed in. Use switchQaUserOnPage() to change users on an existing session.",
    );
  }
}

export { directStepRunner, playwrightStepRunner, runAuthStep };
