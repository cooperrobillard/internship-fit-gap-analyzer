import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSavedAnalyses,
  dedupeSkills,
  formatComparisonSkillFrequency,
} from "@/lib/saved-analysis-comparison";
import type { SavedAnalysisSkill } from "@/lib/supabase/saved-analyses";

function skill(name: string, category = "Programming"): SavedAnalysisSkill {
  return { skill: name, category };
}

test("shared missing skills include C# and C++ when both analyses lack them", () => {
  const first = {
    missingSkills: [skill("C#"), skill("C++"), skill("AWS")],
    matchedSkills: [],
  };
  const second = {
    missingSkills: [skill("C#"), skill("C++"), skill("Autonomous navigation", "Domain")],
    matchedSkills: [],
  };

  const comparison = compareSavedAnalyses(first, second);

  assert.deepEqual(
    comparison.missing.shared.map((item) => item.skill).sort(),
    ["C#", "C++"],
  );
  assert.ok(
    comparison.missing.shared.every((item) => item.analysisCount === 2),
  );
  assert.deepEqual(
    comparison.missing.other.map((item) => item.skill).sort(),
    ["AWS", "Autonomous navigation"],
  );
  assert.ok(
    comparison.missing.other.every((item) => item.analysisCount === 1),
  );
});

test("AWS appears under other missing skills when only one analysis lacks it", () => {
  const comparison = compareSavedAnalyses(
    {
      missingSkills: [skill("AWS")],
      matchedSkills: [],
    },
    {
      missingSkills: [skill("Python")],
      matchedSkills: [],
    },
  );

  assert.equal(comparison.missing.shared.length, 0);
  assert.deepEqual(
    comparison.missing.other.map((item) => item.skill).sort(),
    ["AWS", "Python"],
  );
});

test("C-sharp and C# variants group to one shared missing skill", () => {
  const comparison = compareSavedAnalyses(
    {
      missingSkills: [skill("C-sharp")],
      matchedSkills: [],
    },
    {
      missingSkills: [skill("C#")],
      matchedSkills: [],
    },
  );

  assert.equal(comparison.missing.shared.length, 1);
  assert.equal(comparison.missing.shared[0]?.skill, "C#");
  assert.equal(comparison.missing.shared[0]?.analysisCount, 2);
  assert.equal(comparison.missing.other.length, 0);
});

test("no duplicate shared missing skills", () => {
  const comparison = compareSavedAnalyses(
    {
      missingSkills: [skill("C#"), skill("c#"), skill("C-sharp")],
      matchedSkills: [],
    },
    {
      missingSkills: [skill("C#", "General"), skill("csharp")],
      matchedSkills: [],
    },
  );

  assert.equal(comparison.missing.shared.length, 1);
  assert.equal(comparison.missing.shared[0]?.skill, "C#");
});

test("formatComparisonSkillFrequency renders missing counts", () => {
  const line = formatComparisonSkillFrequency(
    { skill: "C#", category: "Programming", analysisCount: 2 },
    2,
    "missing",
  );
  assert.equal(line, "missing in 2 of 2 selected analyses");
});

test("compare view treats AI-assisted development aliases as shared missing skills", () => {
  const comparison = compareSavedAnalyses(
    {
      missingSkills: [
        { skill: "AI-assisted development tools", category: "AI tools" },
      ],
      matchedSkills: [],
    },
    {
      missingSkills: [
        { skill: "AI-assisted development", category: "Development workflow / AI tools" },
      ],
      matchedSkills: [],
    },
  );

  assert.equal(comparison.missing.shared.length, 1);
  assert.equal(comparison.missing.shared[0]?.skill, "AI-assisted development");
  assert.equal(comparison.missing.shared[0]?.category, "AI tools");
  assert.equal(comparison.missing.shared[0]?.analysisCount, 2);
  assert.equal(comparison.missing.other.length, 0);
});

test("dedupeSkills collapses equivalent variants within one analysis", () => {
  const deduped = dedupeSkills([
    { skill: "C Sharp", category: "Programming" },
    { skill: "c#", category: "Languages" },
    { skill: "AI-assisted development tools", category: "AI tools" },
    { skill: "AI-assisted development", category: "Developer productivity" },
  ]);

  assert.deepEqual(
    deduped.map((item) => item.skill).sort(),
    ["AI-assisted development", "C#"],
  );
});

test("distinct skills remain separate in comparison", () => {
  const comparison = compareSavedAnalyses(
    {
      missingSkills: [{ skill: "OpenAI API", category: "AI/ML" }],
      matchedSkills: [],
    },
    {
      missingSkills: [{ skill: "Large language models", category: "AI/ML" }],
      matchedSkills: [],
    },
  );

  assert.equal(comparison.missing.shared.length, 0);
  assert.equal(comparison.missing.other.length, 2);
});
