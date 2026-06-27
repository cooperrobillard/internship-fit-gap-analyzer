import { clerk as defaultClerk } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";
import type { QaConfig } from "./config";
import type { ClerkQaUserIds } from "./clerk-precheck";

export const LANDING_NAV_TIMEOUT_MS = 45_000;
export const CLERK_LOAD_TIMEOUT_MS = 60_000;
export const CLERK_SIGN_IN_TIMEOUT_MS = 60_000;
export const SAVED_NAV_TIMEOUT_MS = 45_000;
export const SAVED_UI_TIMEOUT_MS = 60_000;

export const CLERK_SIGN_OUT_TIMEOUT_MS = 30_000;

export type ClerkStageClient = {
  loaded: (options: { page: Page }) => Promise<void>;
  signIn: (options: { page: Page; emailAddress: string }) => Promise<void>;
  signOut: (options: {
    page: Page;
    signOutOptions?: { redirectUrl: string };
  }) => Promise<void>;
};

export type AuthStageDeps = {
  clerk?: ClerkStageClient;
};

export function safeAuthErrorDetail(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown Clerk sign-in error";
  }
  if (
    error.message.includes("browserContext.close") ||
    error.message.includes("Target page, context or browser has been closed")
  ) {
    if (error.cause) {
      return safeAuthErrorDetail(error.cause);
    }
    return "Authentication failed after the browser context closed.";
  }
  return error.message.split("\n")[0].trim();
}

export async function withOperationTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function collectClerkLoadDiagnostics(page: Page): Promise<string> {
  const url = new URL(page.url());
  const title = await page.title().catch(() => "unavailable");
  const landingHeadingVisible = await page
    .getByRole("heading", { name: /job fit|skill-gap|analyzer/i })
    .isVisible()
    .catch(() => false);
  const vercelLoginVisible = await page
    .getByRole("heading", { name: /log in to vercel/i })
    .isVisible()
    .catch(() => false);
  const clerkLoaded = await page
    .evaluate(() => typeof window.Clerk !== "undefined" && Boolean(window.Clerk?.loaded))
    .catch(() => false);

  return [
    `hostname=${url.hostname}`,
    `pathname=${url.pathname}`,
    `title=${title}`,
    `landingHeadingVisible=${landingHeadingVisible}`,
    `vercelLoginVisible=${vercelLoginVisible}`,
    `clerkLoaded=${clerkLoaded}`,
  ].join("; ");
}

export async function navigateToLandingPage(
  page: Page,
  config: QaConfig,
  label: "A" | "B",
): Promise<void> {
  const response = await page.goto(`${config.baseUrl}/`, {
    waitUntil: "domcontentloaded",
    timeout: LANDING_NAV_TIMEOUT_MS,
  });
  const status = response?.status();
  if (status && status >= 400) {
    throw new Error(
      `Clerk landing-page navigation returned HTTP ${status} for User ${label}.`,
    );
  }
}

export async function waitForClerkOnLandingPage(
  page: Page,
  label: "A" | "B",
  deps: AuthStageDeps = {},
): Promise<void> {
  const clerkClient = deps.clerk ?? defaultClerk;

  const vercelLoginVisible = await page
    .getByRole("heading", { name: /log in to vercel/i })
    .isVisible()
    .catch(() => false);
  if (vercelLoginVisible) {
    throw new Error(
      `Clerk landing-page navigation reached Vercel SSO instead of the application landing page for User ${label}.`,
    );
  }

  try {
    await withOperationTimeout(
      clerkClient.loaded({ page }),
      CLERK_LOAD_TIMEOUT_MS,
      `Clerk did not load on the production landing page for User ${label}.`,
    );
  } catch (error) {
    const diagnostics = await collectClerkLoadDiagnostics(page);
    const detail = safeAuthErrorDetail(error);
    throw new Error(`${detail} (${diagnostics})`);
  }
}

export async function getActiveClerkUserId(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const clerkApi = (
      window as unknown as {
        Clerk?: {
          loaded: Promise<void> | (() => Promise<void>);
          user?: { id?: string } | null;
        };
      }
    ).Clerk;
    if (!clerkApi) {
      return null;
    }
    await clerkApi.loaded;
    return clerkApi.user?.id ?? null;
  });
}

export async function waitForNoActiveClerkUser(
  page: Page,
  fromLabel: "A" | "B",
): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const clerkApi = (
          window as unknown as {
            Clerk?: { user?: { id?: string } | null };
          }
        ).Clerk;
        return !clerkApi?.user?.id;
      },
      undefined,
      { timeout: CLERK_SIGN_OUT_TIMEOUT_MS },
    );
  } catch {
    throw new Error(
      `Clerk remained authenticated as User ${fromLabel} after sign-out.`,
    );
  }
}

export async function assertNotVercelSsoPage(page: Page): Promise<void> {
  const vercelLoginVisible = await page
    .getByRole("heading", { name: /log in to vercel/i })
    .isVisible()
    .catch(() => false);
  if (vercelLoginVisible) {
    throw new Error(
      "Sign-out redirect reached Vercel SSO instead of the application landing page.",
    );
  }
}

export async function assertExpectedProductionHostname(
  page: Page,
  config: QaConfig,
): Promise<void> {
  const expectedHost = new URL(config.baseUrl).hostname;
  const actualHost = new URL(page.url()).hostname;
  if (actualHost !== expectedHost) {
    throw new Error(
      `Unexpected redirect hostname during user switch: ${actualHost}.`,
    );
  }
}

export async function waitForExpectedSignOutRedirect(
  page: Page,
  config: QaConfig,
): Promise<void> {
  await page.waitForURL(
    (url) => {
      const parsed = new URL(url);
      return (
        parsed.hostname === new URL(config.baseUrl).hostname &&
        parsed.pathname === "/"
      );
    },
    { timeout: LANDING_NAV_TIMEOUT_MS },
  );
  await assertExpectedProductionHostname(page, config);
  await assertNotVercelSsoPage(page);
}

export async function signOutWithRedirect(
  page: Page,
  config: QaConfig,
  fromLabel: "A" | "B",
  deps: AuthStageDeps = {},
): Promise<void> {
  const clerkClient = deps.clerk ?? defaultClerk;
  await withOperationTimeout(
    clerkClient.signOut({
      page,
      signOutOptions: {
        redirectUrl: `${config.baseUrl}/`,
      },
    }),
    CLERK_SIGN_OUT_TIMEOUT_MS,
    `Clerk sign-out timed out while switching from User ${fromLabel}.`,
  );
}

export async function signOutByClerk(
  page: Page,
  fromLabel: "A" | "B",
  deps: AuthStageDeps = {},
): Promise<void> {
  const clerkClient = deps.clerk ?? defaultClerk;
  await withOperationTimeout(
    clerkClient.signOut({ page }),
    CLERK_SIGN_OUT_TIMEOUT_MS,
    `Clerk sign-out timed out while switching from User ${fromLabel}.`,
  );
}

export async function signInByEmail(
  page: Page,
  email: string,
  label: "A" | "B",
  deps: AuthStageDeps = {},
): Promise<void> {
  const clerkClient = deps.clerk ?? defaultClerk;
  await withOperationTimeout(
    clerkClient.signIn({
      page,
      emailAddress: email,
    }),
    CLERK_SIGN_IN_TIMEOUT_MS,
    `Clerk direct email sign-in timed out for User ${label}.`,
  );
}

export async function navigateToSavedWorkspace(
  page: Page,
  config: QaConfig,
): Promise<void> {
  await page.goto(`${config.baseUrl}/dashboard/saved`, {
    waitUntil: "domcontentloaded",
    timeout: SAVED_NAV_TIMEOUT_MS,
  });
}

export async function verifyAuthenticatedIdentity(
  page: Page,
  label: "A" | "B",
  qaUserIds: ClerkQaUserIds,
): Promise<void> {
  const expectedUserId = qaUserIds[label];
  const activeUserId = await page.evaluate(async () => {
    const clerkApi = (window as unknown as {
      Clerk?: {
        loaded: Promise<void> | (() => Promise<void>);
        user?: { id?: string };
      };
    }).Clerk;
    if (!clerkApi) {
      return null;
    }
    await clerkApi.loaded;
    return clerkApi.user?.id ?? null;
  });

  if (activeUserId !== expectedUserId) {
    throw new Error(`Authenticated identity did not match User ${label}.`);
  }
}

export async function assertSavedAuthenticatedState(
  page: Page,
  label: "A" | "B",
  qaUserIds: ClerkQaUserIds,
): Promise<void> {
  await expect(page.getByRole("button", { name: /open user menu/i })).toBeVisible({
    timeout: SAVED_UI_TIMEOUT_MS,
  });
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByText("Sign in required")).toHaveCount(0);
  await expect(page.getByText(/signed in as/i)).toHaveCount(0);

  try {
    await expect(
      page.getByRole("heading", { name: "Saved analyses" }),
    ).toBeVisible({ timeout: SAVED_UI_TIMEOUT_MS });
  } catch {
    throw new Error(`Authenticated Saved UI did not appear for User ${label}.`);
  }

  await verifyAuthenticatedIdentity(page, label, qaUserIds);
}

export function mapLandingNavigationError(
  error: unknown,
  label: "A" | "B",
): Error {
  const detail = safeAuthErrorDetail(error);
  if (detail.includes("Timeout")) {
    return new Error(`Clerk landing-page navigation timed out for User ${label}.`);
  }
  return error instanceof Error ? error : new Error(detail);
}

export function mapSavedNavigationError(
  error: unknown,
  label: "A" | "B",
): Error {
  const detail = safeAuthErrorDetail(error);
  if (detail.includes("Timeout")) {
    return new Error(`Protected Saved navigation timed out for User ${label}.`);
  }
  return error instanceof Error ? error : new Error(detail);
}
