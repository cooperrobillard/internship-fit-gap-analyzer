/**
 * Temporary rule-based web demo analyzer.
 *
 * This is NOT the full Python analyzer in `src/`. It uses a small hardcoded
 * skill list and simple substring matching so the dashboard can prototype the
 * web analysis boundary before a Python analysis service exists.
 *
 * - No network calls, no Supabase, no persistence of resume/job text.
 * - Replace or delegate to a Python API in a future branch.
 */

import type {
  AnalysisSkill,
  WebAnalysisInput,
  WebAnalysisResult,
} from "@/lib/analysis/types";

type TaxonomyEntry = {
  skill: string;
  category: string;
  keywords: string[];
};

const DEMO_TAXONOMY: TaxonomyEntry[] = [
  { skill: "Python", category: "Programming", keywords: ["python"] },
  { skill: "SQL", category: "Data", keywords: ["sql"] },
  { skill: "JavaScript", category: "Web", keywords: ["javascript", "js"] },
  { skill: "React", category: "Web", keywords: ["react"] },
  { skill: "Git", category: "Tools", keywords: ["git"] },
  { skill: "Docker", category: "DevOps", keywords: ["docker"] },
  {
    skill: "Cloud Databases",
    category: "Data",
    keywords: ["cloud databases", "postgres", "supabase"],
  },
  { skill: "APIs", category: "Backend", keywords: ["api", "apis", "rest api"] },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function textMentionsKeyword(normalizedText: string, keyword: string): boolean {
  return normalizedText.includes(keyword.toLowerCase());
}

function entryMentionedInText(
  entry: TaxonomyEntry,
  normalizedText: string,
): boolean {
  return entry.keywords.some((keyword) =>
    textMentionsKeyword(normalizedText, keyword),
  );
}

function toAnalysisSkill(entry: TaxonomyEntry): AnalysisSkill {
  return { skill: entry.skill, category: entry.category };
}

/**
 * Run the demo rule-based analysis on pasted resume and job text.
 * Text is used only for in-memory matching; this function does not store it.
 */
export function runDemoRuleAnalysis(input: WebAnalysisInput): WebAnalysisResult {
  const resumeNormalized = normalizeText(input.resumeText);
  const jobNormalized = normalizeText(input.jobText);

  const matchedSkills: AnalysisSkill[] = [];
  const missingSkills: AnalysisSkill[] = [];

  for (const entry of DEMO_TAXONOMY) {
    const inJob = entryMentionedInText(entry, jobNormalized);
    if (!inJob) {
      continue;
    }

    const inResume = entryMentionedInText(entry, resumeNormalized);
    const skill = toAnalysisSkill(entry);

    if (inResume) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchedSkillsCount = matchedSkills.length;
  const missingSkillsCount = missingSkills.length;

  const summary =
    matchedSkillsCount === 0 && missingSkillsCount === 0
      ? "No demo taxonomy skills were found in the job description. Try mentioning skills like Python, SQL, or React in the pasted texts."
      : `Demo analysis found ${matchedSkillsCount} matched skill${matchedSkillsCount === 1 ? "" : "s"} and ${missingSkillsCount} missing skill${missingSkillsCount === 1 ? "" : "s"} from a small hardcoded taxonomy. This is not the full Python analyzer.`;

  return {
    matchedSkills,
    missingSkills,
    matchedSkillsCount,
    missingSkillsCount,
    summary,
  };
}
