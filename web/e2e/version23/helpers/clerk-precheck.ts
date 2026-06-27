import type { QaConfig } from "./config";

export type ClerkQaUserIds = {
  A: string;
  B: string;
};

export const CLERK_QA_USERS_RELATIVE =
  "test-results/version23-clerk-qa-users.json";

type ClerkUserSummary = {
  id: string;
};

function clerkEnvironmentFromKey(
  key: string,
  prefix: "pk" | "sk",
): "live" | "test" | undefined {
  if (key.startsWith(`${prefix}_live_`)) {
    return "live";
  }
  if (key.startsWith(`${prefix}_test_`)) {
    return "test";
  }
  return undefined;
}

export async function verifyClerkPrecheck(
  config: Pick<
    QaConfig,
    "clerkSecretKey" | "clerkPublishableKey" | "userAEmail" | "userBEmail"
  >,
  fetchFn: typeof fetch = fetch,
): Promise<ClerkQaUserIds> {
  const headers = { Authorization: `Bearer ${config.clerkSecretKey}` };

  const instanceResponse = await fetchFn("https://api.clerk.com/v1/instance", {
    headers,
  });
  if (!instanceResponse.ok) {
    throw new Error(
      "Clerk production credentials were rejected by the Backend API.",
    );
  }

  const secretEnvironment = clerkEnvironmentFromKey(config.clerkSecretKey, "sk");
  const publishableEnvironment = clerkEnvironmentFromKey(
    config.clerkPublishableKey,
    "pk",
  );
  if (
    secretEnvironment &&
    publishableEnvironment &&
    secretEnvironment !== publishableEnvironment
  ) {
    throw new Error(
      "CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY appear to target different Clerk environments.",
    );
  }

  async function resolveUser(
    email: string,
    label: "A" | "B",
  ): Promise<string> {
    const response = await fetchFn(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers },
    );
    if (!response.ok) {
      throw new Error(`Clerk Backend API user lookup failed (${response.status}).`);
    }
    const users = (await response.json()) as ClerkUserSummary[];
    if (users.length === 0) {
      throw new Error(
        `Configured QA User ${label} was not found in the Clerk instance associated with CLERK_SECRET_KEY.`,
      );
    }
    if (users.length !== 1) {
      throw new Error(
        `Configured QA User ${label} matched multiple Clerk users; expected exactly one.`,
      );
    }
    return users[0].id;
  }

  const userIds = {
    A: await resolveUser(config.userAEmail, "A"),
    B: await resolveUser(config.userBEmail, "B"),
  };

  if (userIds.A === userIds.B) {
    throw new Error("QA User A and QA User B resolved to the same Clerk user ID.");
  }

  console.log("Clerk production credentials accepted.");
  console.log("QA User A found.");
  console.log("QA User B found.");
  console.log("QA users are distinct.");

  return userIds;
}
