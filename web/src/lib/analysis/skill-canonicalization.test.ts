import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeSkillList,
  canonicalizeSkillName,
  canonicalizeSkillCategory,
} from "@/lib/analysis/skill-canonicalization";

test("AI-assisted development aliases collapse to one concept", () => {
  assert.equal(
    canonicalizeSkillName("AI-assisted development tools"),
    "AI-assisted development",
  );
  assert.equal(
    canonicalizeSkillName("AI tools for development productivity"),
    "AI-assisted development",
  );
  assert.equal(canonicalizeSkillName("LLM-assisted coding"), "AI-assisted development");
});

test("distinct AI concepts remain separate", () => {
  assert.equal(canonicalizeSkillName("OpenAI API"), "OpenAI API");
  assert.equal(canonicalizeSkillName("Large language models"), "Large language models");
  assert.equal(canonicalizeSkillName("Machine learning"), "Machine learning");
  assert.equal(canonicalizeSkillName("Computer vision"), "Computer vision");
  assert.notEqual(
    canonicalizeSkillName("AI-assisted development tools"),
    canonicalizeSkillName("Machine learning"),
  );
});

test("C# and C++ variants group", () => {
  assert.equal(canonicalizeSkillName("C Sharp"), "C#");
  assert.equal(canonicalizeSkillName("C plus plus"), "C++");
});

test("canonical skill list dedupes equivalent variants in one result", () => {
  const deduped = canonicalizeSkillList([
    { skill: "AI-assisted development tools", category: "AI tools" },
    { skill: "AI-assisted development", category: "Development workflow / AI tools" },
    { skill: "C Sharp", category: "Programming" },
    { skill: "c#", category: "Languages" },
  ]);

  assert.deepEqual(
    deduped.map((item) => item.skill).sort(),
    ["AI-assisted development", "C#"],
  );
  const aiDev = deduped.find((item) => item.skill === "AI-assisted development");
  assert.equal(aiDev?.category, "AI tools");
});

test("preferred category is applied for canonical concepts", () => {
  assert.equal(
    canonicalizeSkillCategory("AI-assisted development", "Developer productivity"),
    "AI tools",
  );
});
