import assert from "node:assert/strict";
import test from "node:test";

import {
  loadWorkspaceResumePreference,
  saveWorkspaceResumePreference,
  workspaceResumePreferenceStorageKey,
} from "@/lib/workspace-resume-preferences";

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    raw() {
      return map;
    },
  };
}

test("selecting saved profile persists mode and profile id", () => {
  const storage = createMemoryStorage();
  saveWorkspaceResumePreference(storage, "user_1", {
    inputMode: "saved_profile",
    selectedProfileId: "profile_123",
  });

  const restored = loadWorkspaceResumePreference(storage, "user_1");
  assert.deepEqual(restored, {
    inputMode: "saved_profile",
    selectedProfileId: "profile_123",
  });
});

test("pasted mode stores no profile id and no raw text fields", () => {
  const storage = createMemoryStorage();
  saveWorkspaceResumePreference(storage, "user_1", {
    inputMode: "pasted",
    selectedProfileId: "profile_123",
  });

  const key = workspaceResumePreferenceStorageKey("user_1");
  const raw = storage.raw().get(key);
  assert.ok(raw);
  assert.equal(raw?.includes("resumeText"), false);
  assert.equal(raw?.includes("jobText"), false);

  const restored = loadWorkspaceResumePreference(storage, "user_1");
  assert.deepEqual(restored, {
    inputMode: "pasted",
    selectedProfileId: null,
  });
});

test("invalid stored payload safely falls back to null", () => {
  const storage = createMemoryStorage();
  const key = workspaceResumePreferenceStorageKey("user_1");
  storage.setItem(key, "{\"inputMode\":\"unknown\"}");
  assert.equal(loadWorkspaceResumePreference(storage, "user_1"), null);
});
