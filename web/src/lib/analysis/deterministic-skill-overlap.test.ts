import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDeterministicGuardrails,
  computeDeterministicSkillOverlap,
  isAiAnalysisPayloadInvalid,
  mergeAiResultWithDeterministicOverlap,
} from "@/lib/analysis/deterministic-skill-overlap";

const EMPTY_AI = {
  matchedSkills: [],
  missingSkills: [],
  transferableSkills: [],
  resumeSkills: [],
  jobSkills: [],
  ignoredBoilerplate: [],
  summary: "Smart AI summary.",
  limitations: [],
  matchedSkillsCount: 0,
  missingSkillsCount: 0,
};

test("case 1: single shared Python skill is matched with score > 0", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "Python",
    jobText: "Python",
  });

  assert.deepEqual(
    overlap.matchedSkills.map((item) => item.skill),
    ["Python"],
  );
  assert.equal(overlap.missingSkills.length, 0);

  const guarded = applyDeterministicGuardrails(EMPTY_AI, {
    resumeText: "Python",
    jobText: "Python",
  });
  assert.equal(guarded.ok, true);
  if (!guarded.ok) {
    return;
  }
  assert.ok(guarded.result.matchedSkillsCount > 0);
  assert.ok(guarded.result.matchedSkills.some((item) => item.skill === "Python"));
});

test("case 2: Python and SQL match; React is missing only", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "Experienced with Python and SQL.",
    jobText: "Looking for Python, SQL, and React.",
  });

  assert.deepEqual(
    overlap.matchedSkills.map((item) => item.skill).sort(),
    ["Python", "SQL"],
  );
  assert.deepEqual(
    overlap.missingSkills.map((item) => item.skill),
    ["React"],
  );

  const guarded = applyDeterministicGuardrails(EMPTY_AI, {
    resumeText: "Experienced with Python and SQL.",
    jobText: "Looking for Python, SQL, and React.",
  });
  assert.equal(guarded.ok, true);
  if (!guarded.ok) {
    return;
  }
  assert.ok(guarded.result.matchedSkillsCount > 0);
  assert.ok(guarded.result.matchedSkills.some((item) => item.skill === "Python"));
  assert.ok(guarded.result.matchedSkills.some((item) => item.skill === "SQL"));
  assert.ok(guarded.result.missingSkills.some((item) => item.skill === "React"));
});

test("case 2b: résumé-only skill (Git) never appears in matched or missing", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "Python, SQL, Git, Docker",
    jobText: "Python, SQL, Docker, AWS",
  });

  assert.deepEqual(
    overlap.matchedSkills.map((item) => item.skill).sort(),
    ["Docker", "Python", "SQL"],
  );
  assert.deepEqual(
    overlap.missingSkills.map((item) => item.skill),
    ["AWS"],
  );
  assert.ok(!overlap.matchedSkills.some((item) => item.skill === "Git"));
  assert.ok(!overlap.missingSkills.some((item) => item.skill === "Git"));
});

test("case 3: React and TypeScript match from punctuation-heavy lists", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "React, TypeScript, Node.js",
    jobText: "Need React and TypeScript experience",
  });

  assert.deepEqual(
    overlap.matchedSkills.map((item) => item.skill).sort(),
    ["React", "TypeScript"],
  );
  assert.ok(overlap.matchedSkills.length > 0);

  const guarded = applyDeterministicGuardrails(EMPTY_AI, {
    resumeText: "React, TypeScript, Node.js",
    jobText: "Need React and TypeScript experience",
  });
  assert.equal(guarded.ok, true);
  if (!guarded.ok) {
    return;
  }
  assert.ok(guarded.result.matchedSkillsCount > 0);
});

test("case 4: no false positives when only job mentions Python and Kubernetes", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "Customer service and Excel",
    jobText: "Python and Kubernetes",
  });

  assert.equal(overlap.matchedSkills.length, 0);
  assert.deepEqual(
    overlap.missingSkills.map((item) => item.skill).sort(),
    ["Kubernetes", "Python"],
  );
});

test("case 5: malformed AI with empty matches still recovers Python overlap", () => {
  const overlap = computeDeterministicSkillOverlap({
    resumeText: "Python developer",
    jobText: "Requires Python",
  });
  assert.ok(overlap.matchedSkills.some((item) => item.skill === "Python"));

  const merged = mergeAiResultWithDeterministicOverlap(EMPTY_AI, overlap);
  assert.ok(merged.matchedSkillsCount > 0);
  assert.ok(merged.matchedSkills.some((item) => item.skill === "Python"));
});

test("invalid AI payload without summary is rejected for fallback", () => {
  assert.equal(
    isAiAnalysisPayloadInvalid({
      matchedSkills: [],
      missingSkills: [],
      summary: "",
    }),
    true,
  );
  assert.equal(
    applyDeterministicGuardrails(
      { matchedSkills: [], missingSkills: [], summary: "" },
      { resumeText: "Python", jobText: "Python" },
    ).ok,
    false,
  );
});

test("AI matches are preserved and merged with deterministic matches", () => {
  const merged = mergeAiResultWithDeterministicOverlap(
    {
      ...EMPTY_AI,
      matchedSkills: [{ skill: "Docker", category: "Backend", evidence: "Listed in résumé." }],
      matchedSkillsCount: 1,
    },
    computeDeterministicSkillOverlap({
      resumeText: "Python and Docker",
      jobText: "Python, Docker, Kubernetes",
    }),
  );

  assert.deepEqual(
    merged.matchedSkills.map((item) => item.skill).sort(),
    ["Docker", "Python"],
  );
  assert.deepEqual(
    merged.missingSkills.map((item) => item.skill),
    ["Kubernetes"],
  );
  assert.equal(merged.matchedSkillsCount, 2);
});
