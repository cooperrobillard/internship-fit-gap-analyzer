import { test } from "@playwright/test";
import { loadQaConfig } from "./helpers/config";
import { loadPersistedQaUserIds, signInQaUser } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

test("Version 23 Clerk auth smoke", async ({ browser }) => {
  const config = loadQaConfig({ requireMutationAck: false });
  const qaUserIds = loadPersistedQaUserIds();
  if (!qaUserIds) {
    throw new Error(
      "Clerk QA user IDs are missing. The auth-smoke runner must execute the Clerk precheck before Playwright.",
    );
  }

  const userA = await signInQaUser(browser, config, "A", { qaUserIds });
  await userA.context.close();

  const userB = await signInQaUser(browser, config, "B", { qaUserIds });
  await userB.context.close();
});
