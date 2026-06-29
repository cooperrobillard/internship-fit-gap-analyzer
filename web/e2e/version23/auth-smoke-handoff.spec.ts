import { test, expect } from "@playwright/test";
import { loadClerkQaUserIdsFromEnv } from "./helpers/clerk-precheck";

test("receives prechecked Clerk IDs from environment", () => {
  const ids = loadClerkQaUserIdsFromEnv();
  expect(ids.A).toBeTruthy();
  expect(ids.B).toBeTruthy();
  expect(ids.A).not.toBe(ids.B);
});
