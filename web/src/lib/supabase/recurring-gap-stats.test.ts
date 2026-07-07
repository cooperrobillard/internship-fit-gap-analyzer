import assert from "node:assert/strict";
import test from "node:test";

import { buildRecurringGapStats } from "@/lib/supabase/recurring-gap-stats";

test("recurring gaps group AI-assisted development aliases across analyses", () => {
  const stats = buildRecurringGapStats(
    [
      {
        skill: "AI-assisted development tools",
        category: "AI tools",
        job_analysis_id: "analysis-a",
      },
      {
        skill: "AI-assisted development",
        category: "Development workflow / AI tools",
        job_analysis_id: "analysis-b",
      },
    ],
    2,
  );

  assert.equal(stats.length, 1);
  assert.equal(stats[0]?.skill, "AI-assisted development");
  assert.equal(stats[0]?.category, "AI tools");
  assert.equal(stats[0]?.analysisCount, 2);
  assert.equal(stats[0]?.percentage, 100);
});

test("distinct skills remain separate in recurring gaps", () => {
  const stats = buildRecurringGapStats(
    [
      {
        skill: "AI-assisted development",
        category: "AI tools",
        job_analysis_id: "analysis-a",
      },
      {
        skill: "OpenAI API",
        category: "AI/ML",
        job_analysis_id: "analysis-a",
      },
      {
        skill: "Machine learning",
        category: "AI/ML",
        job_analysis_id: "analysis-b",
      },
    ],
    2,
  );

  assert.equal(stats.length, 3);
  assert.deepEqual(
    stats.map((item) => item.skill).sort(),
    ["AI-assisted development", "Machine learning", "OpenAI API"],
  );
});
