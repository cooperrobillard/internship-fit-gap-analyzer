import { test } from "@playwright/test";
import { loadQaConfig } from "./helpers/config";
import { loadClerkQaUserIdsFromEnv } from "./helpers/clerk-precheck";
import { signInQaUser } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

test("Version 23 Clerk auth smoke", async ({ browser }) => {
  const config = loadQaConfig({ requireMutationAck: false });
  const qaUserIds = loadClerkQaUserIdsFromEnv();

  const userA = await signInQaUser(browser, config, "A", { qaUserIds });
  await userA.context.close();

  const userB = await signInQaUser(browser, config, "B", { qaUserIds });
  await userB.context.close();
});
