import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

import { isAiFeaturesEnabled } from "./features";

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  process.env = originalEnv;
});

test("AI_FEATURES_ENABLED requires exact true", () => {
  assert.equal(isAiFeaturesEnabled(), false);
  process.env.AI_FEATURES_ENABLED = "true";
  assert.equal(isAiFeaturesEnabled(), true);
  process.env.AI_FEATURES_ENABLED = "TRUE";
  assert.equal(isAiFeaturesEnabled(), false);
});
