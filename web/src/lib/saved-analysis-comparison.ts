import {
  canonicalizeSkill,
  canonicalSkillKey,
} from "@/lib/analysis/skill-canonicalization";
import type { SavedAnalysisSkill } from "@/lib/supabase/saved-analyses";

export type SavedAnalysisComparisonInput = {
  missingSkills: SavedAnalysisSkill[];
  matchedSkills: SavedAnalysisSkill[];
};

export type ComparedSkillEntry = {
  skill: string;
  category: string;
  analysisCount: number;
};

export type GroupedSkillComparison = {
  shared: ComparedSkillEntry[];
  other: ComparedSkillEntry[];
  totalAnalyses: number;
};

export type SavedAnalysisComparisonResult = {
  missing: GroupedSkillComparison;
  matched: GroupedSkillComparison;
};

function sortComparedSkills(skills: ComparedSkillEntry[]): ComparedSkillEntry[] {
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

/** Canonical dedupe by skill concept (aliases collapse to one row). */
export function dedupeSkills(skills: SavedAnalysisSkill[]): SavedAnalysisSkill[] {
  const seen = new Map<string, SavedAnalysisSkill>();

  for (const item of skills) {
    const normalized = canonicalizeSkill({
      skill: item.skill,
      category: item.category,
    });
    if (!normalized.skill || !normalized.category) {
      continue;
    }
    const key = canonicalSkillKey(normalized.skill);
    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  }

  return [...seen.values()].sort((left, right) =>
    left.skill.localeCompare(right.skill, undefined, { sensitivity: "base" }),
  );
}

function groupSkillsAcrossAnalyses(
  analysisSkillLists: SavedAnalysisSkill[][],
): GroupedSkillComparison {
  const totalAnalyses = analysisSkillLists.length;
  const grouped = new Map<
    string,
    { skill: string; category: string; analysisIndices: Set<number> }
  >();

  for (let analysisIndex = 0; analysisIndex < analysisSkillLists.length; analysisIndex += 1) {
    const seenInAnalysis = new Set<string>();
    for (const item of analysisSkillLists[analysisIndex]) {
      const normalized = canonicalizeSkill({
        skill: item.skill,
        category: item.category,
      });
      if (!normalized.skill) {
        continue;
      }
      const key = canonicalSkillKey(normalized.skill);
      if (seenInAnalysis.has(key)) {
        continue;
      }
      seenInAnalysis.add(key);

      let entry = grouped.get(key);
      if (!entry) {
        entry = {
          skill: normalized.skill,
          category: normalized.category,
          analysisIndices: new Set<number>(),
        };
        grouped.set(key, entry);
      }
      entry.analysisIndices.add(analysisIndex);
    }
  }

  const shared: ComparedSkillEntry[] = [];
  const other: ComparedSkillEntry[] = [];

  for (const entry of grouped.values()) {
    const analysisCount = entry.analysisIndices.size;
    const compared: ComparedSkillEntry = {
      skill: entry.skill,
      category: entry.category,
      analysisCount,
    };
    if (analysisCount >= 2) {
      shared.push(compared);
    } else {
      other.push(compared);
    }
  }

  return {
    shared: sortComparedSkills(shared),
    other: sortComparedSkills(other),
    totalAnalyses,
  };
}

/** Compare missing and matched skills between two saved analyses. */
export function compareSavedAnalyses(
  first: SavedAnalysisComparisonInput,
  second: SavedAnalysisComparisonInput,
): SavedAnalysisComparisonResult {
  return {
    missing: groupSkillsAcrossAnalyses([first.missingSkills, second.missingSkills]),
    matched: groupSkillsAcrossAnalyses([first.matchedSkills, second.matchedSkills]),
  };
}

export function formatComparisonSkillFrequency(
  entry: ComparedSkillEntry,
  totalAnalyses: number,
  kind: "missing" | "matched",
): string {
  const verb = kind === "missing" ? "missing" : "matched";
  const analysisLabel = totalAnalyses === 1 ? "analysis" : "analyses";
  return `${verb} in ${entry.analysisCount} of ${totalAnalyses} selected ${analysisLabel}`;
}
