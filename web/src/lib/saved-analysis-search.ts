import { normalizeOptionalMetadata } from "@/lib/saved-analysis-metadata";
import type {
  SavedAnalysisSkill,
  SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";

/** Simple list filters — client-side only; does not affect recurring gap stats. */
export type SavedAnalysisListFilter =
  | "all"
  | "has_missing_skills"
  | "no_missing_skills"
  | "has_notes";

export const SAVED_ANALYSIS_FILTER_OPTIONS: {
  value: SavedAnalysisListFilter;
  label: string;
}[] = [
  { value: "all", label: "Show all" },
  { value: "has_missing_skills", label: "Has missing skills" },
  { value: "no_missing_skills", label: "No missing skills" },
  { value: "has_notes", label: "Has notes" },
];

function skillSearchTokens(skills: SavedAnalysisSkill[]): string[] {
  return skills.flatMap((item) => [item.skill, item.category]);
}

/** Lowercase haystack for case-insensitive client search. */
export function getSavedAnalysisSearchText(
  analysis: SavedCloudAnalysisListItem,
): string {
  const parts = [
    analysis.job_title,
    analysis.company,
    analysis.source_url,
    analysis.notes,
    ...skillSearchTokens(analysis.matchedSkills),
    ...skillSearchTokens(analysis.missingSkills),
  ];

  return parts
    .map((part) => normalizeOptionalMetadata(part))
    .filter((part): part is string => part !== null)
    .join(" ")
    .toLowerCase();
}

export function savedAnalysisMatchesSearch(
  analysis: SavedCloudAnalysisListItem,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return getSavedAnalysisSearchText(analysis).includes(normalizedQuery);
}

export function savedAnalysisMatchesFilter(
  analysis: SavedCloudAnalysisListItem,
  filter: SavedAnalysisListFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "has_missing_skills":
      return analysis.missing_skills_count > 0;
    case "no_missing_skills":
      return analysis.missing_skills_count === 0;
    case "has_notes":
      return normalizeOptionalMetadata(analysis.notes) !== null;
    default:
      return true;
  }
}

export function filterSavedAnalyses(
  analyses: SavedCloudAnalysisListItem[],
  query: string,
  filter: SavedAnalysisListFilter,
): SavedCloudAnalysisListItem[] {
  return analyses.filter(
    (analysis) =>
      savedAnalysisMatchesFilter(analysis, filter) &&
      savedAnalysisMatchesSearch(analysis, query),
  );
}

export function hasActiveSavedAnalysisSearch(
  query: string,
  filter: SavedAnalysisListFilter,
): boolean {
  return query.trim().length > 0 || filter !== "all";
}
