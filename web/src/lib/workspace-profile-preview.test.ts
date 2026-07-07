import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKSPACE_PROFILE_PREVIEW_SKILL_LIMIT,
  getWorkspaceProfilePreviewSkills,
} from "@/lib/workspace-profile-preview";

test("selected profile preview limits displayed skills", () => {
  const skills = Array.from({ length: 12 }, (_, index) => `Skill ${index + 1}`);
  const preview = getWorkspaceProfilePreviewSkills(skills);

  assert.equal(preview.visible.length, WORKSPACE_PROFILE_PREVIEW_SKILL_LIMIT);
  assert.equal(preview.hiddenCount, 4);
});

test("+N more appears for long skill lists", () => {
  const preview = getWorkspaceProfilePreviewSkills(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  assert.equal(preview.hiddenCount, 1);
});

test("short skill lists do not show hidden count", () => {
  const preview = getWorkspaceProfilePreviewSkills(["Python", "SQL"]);
  assert.deepEqual(preview.visible, ["Python", "SQL"]);
  assert.equal(preview.hiddenCount, 0);
});
