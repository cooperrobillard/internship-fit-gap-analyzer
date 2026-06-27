import type { QaConfig } from "./config";

export type ClerkQaUserIds = {
  A: string;
  B: string;
};

export const QA_USER_A_CLERK_ID_ENV = "QA_USER_A_CLERK_ID";
export const QA_USER_B_CLERK_ID_ENV = "QA_USER_B_CLERK_ID";

type ClerkUserSummary = {
  id: string;
};

export function setClerkQaUserIdsInEnv(userIds: ClerkQaUserIds): void {
  process.env[QA_USER_A_CLERK_ID_ENV] = userIds.A;
  process.env[QA_USER_B_CLERK_ID_ENV] = userIds.B;
}

export function clearClerkQaUserIdsFromEnv(): void {
  delete process.env[QA_USER_A_CLERK_ID_ENV];
  delete process.env[QA_USER_B_CLERK_ID_ENV];
}

export function loadClerkQaUserIdsFromEnv(): ClerkQaUserIds {
  const userAId = process.env[QA_USER_A_CLERK_ID_ENV]?.trim();
  const userBId = process.env[QA_USER_B_CLERK_ID_ENV]?.trim();

  if (!userAId) {
    throw new Error(
      "Clerk QA User A ID is not available in the test process environment.",
    );
  }
  if (!userBId) {
    throw new Error(
      "Clerk QA User B ID is not available in the test process environment.",
    );
  }
  if (userAId === userBId) {
    throw new Error("Clerk QA User A and User B IDs must be different.");
  }

  return { A: userAId, B: userBId };
}

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
