import type { SavedAnalysisSkill } from "@/lib/supabase/saved-analyses";

export type SavedAnalysisComparisonInput = {
  missingSkills: SavedAnalysisSkill[];
  matchedSkills: SavedAnalysisSkill[];
};

export type SkillSetComparison = {
  shared: SavedAnalysisSkill[];
  onlyFirst: SavedAnalysisSkill[];
  onlySecond: SavedAnalysisSkill[];
};

export type SavedAnalysisComparisonResult = {
  missing: SkillSetComparison;
  matched: SkillSetComparison;
};

function skillKey(skill: SavedAnalysisSkill): string {
  return `${skill.skill.trim().toLowerCase()}|${skill.category.trim().toLowerCase()}`;
}

function sortSkills(skills: SavedAnalysisSkill[]): SavedAnalysisSkill[] {
  return [...skills].sort((left, right) => {
    const bySkill = left.skill.localeCompare(right.skill, undefined, {
      sensitivity: "base",
    });
    if (bySkill !== 0) {
      return bySkill;
    }
    return left.category.localeCompare(right.category, undefined, {
      sensitivity: "base",
    });
  });
}

/** Case-insensitive dedupe by skill name + category. */
export function dedupeSkills(skills: SavedAnalysisSkill[]): SavedAnalysisSkill[] {
  const seen = new Map<string, SavedAnalysisSkill>();

  for (const item of skills) {
    const normalized: SavedAnalysisSkill = {
      skill: item.skill.trim(),
      category: item.category.trim(),
    };
    if (!normalized.skill || !normalized.category) {
      continue;
    }
    const key = skillKey(normalized);
    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  }

  return sortSkills([...seen.values()]);
}

/** Compare two skill lists: shared, first-only, second-only (case-insensitive keys). */
export function compareSkillSets(
  firstSkills: SavedAnalysisSkill[],
  secondSkills: SavedAnalysisSkill[],
): SkillSetComparison {
  const firstMap = new Map(
    dedupeSkills(firstSkills).map((skill) => [skillKey(skill), skill]),
  );
  const secondMap = new Map(
    dedupeSkills(secondSkills).map((skill) => [skillKey(skill), skill]),
  );

  const shared: SavedAnalysisSkill[] = [];
  const onlyFirst: SavedAnalysisSkill[] = [];
  const onlySecond: SavedAnalysisSkill[] = [];

  for (const [key, skill] of firstMap) {
    if (secondMap.has(key)) {
      shared.push(skill);
    } else {
      onlyFirst.push(skill);
    }
  }

  for (const [key, skill] of secondMap) {
    if (!firstMap.has(key)) {
      onlySecond.push(skill);
    }
  }

  return {
    shared: sortSkills(shared),
    onlyFirst: sortSkills(onlyFirst),
    onlySecond: sortSkills(onlySecond),
  };
}

/** Compare missing and matched skills between two saved analyses. */
export function compareSavedAnalyses(
  first: SavedAnalysisComparisonInput,
  second: SavedAnalysisComparisonInput,
): SavedAnalysisComparisonResult {
  return {
    missing: compareSkillSets(first.missingSkills, second.missingSkills),
    matched: compareSkillSets(first.matchedSkills, second.matchedSkills),
  };
}
