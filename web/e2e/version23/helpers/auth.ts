import { clerk } from "@clerk/testing/playwright";
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { QaConfig } from "./config";

export type SignedInQaUser = {
  context: BrowserContext;
  page: Page;
  label: "A" | "B";
  email: string;
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

export async function assertAuthenticatedApplicationState(
  page: Page,
  label: "A" | "B",
): Promise<void> {
  await expect(page.getByRole("button", { name: /open user menu/i })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByText("Sign in required")).toHaveCount(0);
  await expect(page.getByText(/signed in as/i)).toHaveCount(0);
  if (label !== "A" && label !== "B") {
    throw new Error(`Unexpected QA user label: ${label}`);
  }
}

export async function signInQaUser(
  browser: Browser,
  config: QaConfig,
  label: "A" | "B",
): Promise<SignedInQaUser> {
  const email = label === "A" ? config.userAEmail : config.userBEmail;
  const context = await browser.newContext();
  const page = await context.newPage();

  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    await context.close();
    throw new Error(
      clerkConfigurationMessage(
        label,
        "CLERK_SECRET_KEY is not set in the Node test process.",
      ),
    );
  }

  try {
    await page.goto(`${config.baseUrl}/`);
    await clerk.signIn({
      page,
      emailAddress: email,
    });
  } catch (error) {
    await context.close();
    const detail =
      error instanceof Error ? error.message : "Unknown Clerk sign-in error";
    throw new Error(clerkConfigurationMessage(label, detail));
  }

  await page.goto(`${config.baseUrl}/dashboard/saved`);
  await expect(
    page.getByRole("heading", { name: "Saved analyses" }),
  ).toBeVisible({ timeout: 60_000 });
  await assertAuthenticatedApplicationState(page, label);

  return { context, page, label, email };
}
