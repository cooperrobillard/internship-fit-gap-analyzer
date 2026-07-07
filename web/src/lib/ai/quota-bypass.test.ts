import assert from "node:assert/strict";
import test from "node:test";

import {
  __resetAiQuotaBypassCacheForTests,
  isAiQuotaBypassUser,
} from "@/lib/ai/quota-bypass";

const COOPER_USER_ID = "user_3FuilgIMls6NHMejlNAYDv6SATc";
const OTHER_USER_ID = "user_otherAccount123";

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
  __resetAiQuotaBypassCacheForTests();
});

test("isAiQuotaBypassUser returns false when env is unset", () => {
  delete process.env.AI_QUOTA_BYPASS_USER_IDS;
  assert.equal(isAiQuotaBypassUser(COOPER_USER_ID), false);
});

test("isAiQuotaBypassUser matches a single configured Clerk user ID", () => {
  process.env.AI_QUOTA_BYPASS_USER_IDS = COOPER_USER_ID;
  assert.equal(isAiQuotaBypassUser(COOPER_USER_ID), true);
  assert.equal(isAiQuotaBypassUser(OTHER_USER_ID), false);
});

test("isAiQuotaBypassUser parses comma-separated IDs with trimming", () => {
  process.env.AI_QUOTA_BYPASS_USER_IDS = ` ${COOPER_USER_ID} , ${OTHER_USER_ID} , `;
  assert.equal(isAiQuotaBypassUser(COOPER_USER_ID), true);
  assert.equal(isAiQuotaBypassUser(OTHER_USER_ID), true);
});

test("isAiQuotaBypassUser ignores empty and null user IDs", () => {
  process.env.AI_QUOTA_BYPASS_USER_IDS = COOPER_USER_ID;
  assert.equal(isAiQuotaBypassUser(null), false);
  assert.equal(isAiQuotaBypassUser(undefined), false);
  assert.equal(isAiQuotaBypassUser("   "), false);
});
