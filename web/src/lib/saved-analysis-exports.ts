import type { SavedAnalysisComparisonResult } from "@/lib/saved-analysis-comparison";
import {
  formatOptionalMetadata,
  formatSavedAnalysisDate,
  getSavedAnalysisCompanyLabel,
  getSavedAnalysisDisplayTitle,
  normalizeOptionalMetadata,
  type SavedAnalysisSkill,
  type SavedCloudAnalysisListItem,
} from "@/lib/supabase/saved-analyses";
import type { RecurringGapStat } from "@/lib/supabase/recurring-gap-stats";

export type SavedAnalysisExportRecord = SavedCloudAnalysisListItem;

export type ComparisonExportInput = {
  firstLabel: string;
  secondLabel: string;
  comparison: SavedAnalysisComparisonResult;
};

const SKILL_JOINER = "; ";

/** RFC 4180-style CSV cell escaping. */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

/** Trigger a browser download for generated text content. */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function sanitizeFilenamePart(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 48) || "export";
}

function formatSkillToken(skill: SavedAnalysisSkill): string {
  return `${skill.skill} (${skill.category})`;
}

function joinSkillsForExport(skills: SavedAnalysisSkill[]): string {
  return skills.map(formatSkillToken).join(SKILL_JOINER);
}

function formatIsoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString().slice(0, 10);
}

export function buildSavedAnalysisExportBasename(
  analysis: Pick<SavedCloudAnalysisListItem, "job_title" | "created_at">,
): string {
  const titlePart = sanitizeFilenamePart(getSavedAnalysisDisplayTitle(analysis));
  const datePart = formatIsoDate(analysis.created_at);
  return `saved-analysis-${titlePart}-${datePart}`;
}

function markdownSkillList(skills: SavedAnalysisSkill[], emptyLine: string): string {
  if (skills.length === 0) {
    return emptyLine;
  }

  return skills.map((skill) => `- ${formatSkillToken(skill)}`).join("\n");
}

/** Markdown export for one saved analysis (structured fields only). */
export function buildSavedAnalysisMarkdown(analysis: SavedAnalysisExportRecord): string {
  const title = getSavedAnalysisDisplayTitle(analysis);
  const company = getSavedAnalysisCompanyLabel(analysis);
  const savedDate = formatSavedAnalysisDate(analysis.created_at);
  const sourceUrl = normalizeOptionalMetadata(analysis.source_url);
  const notes = normalizeOptionalMetadata(analysis.notes);

  const lines = [
    "# Saved analysis export",
    "",
    "_Structured results and metadata only. No resume or job description body text._",
    "",
    "## Job metadata",
    "",
    `- **Job title:** ${title}`,
    `- **Company:** ${company}`,
    `- **Saved:** ${savedDate}`,
    `- **Source URL:** ${sourceUrl ?? "Not provided"}`,
    `- **Notes:** ${notes ?? "Not provided"}`,
    "",
    "## Skill summary",
    "",
    `- **Matched skills:** ${analysis.matched_skills_count}`,
    `- **Missing skills:** ${analysis.missing_skills_count}`,
    "",
    "## Matched skills",
    "",
    markdownSkillList(
      analysis.matchedSkills,
      "_No matched skills stored for this analysis._",
    ),
    "",
    "## Missing skills",
    "",
    markdownSkillList(
      analysis.missingSkills,
      "_No missing skills stored for this analysis._",
    ),
    "",
  ];

  return lines.join("\n");
}

/** Single-row CSV export for one saved analysis. */
export function buildSavedAnalysisCsv(analysis: SavedAnalysisExportRecord): string {
  const headers = [
    "saved_date",
    "job_title",
    "company",
    "source_url",
    "notes",
    "matched_skill_count",
    "missing_skill_count",
    "matched_skills",
    "missing_skills",
  ];

  const row = [
    formatSavedAnalysisDate(analysis.created_at),
    getSavedAnalysisDisplayTitle(analysis),
    getSavedAnalysisCompanyLabel(analysis),
    formatOptionalMetadata(analysis.source_url) === "Not provided"
      ? ""
      : normalizeOptionalMetadata(analysis.source_url),
    normalizeOptionalMetadata(analysis.notes) ?? "",
    analysis.matched_skills_count,
    analysis.missing_skills_count,
    joinSkillsForExport(analysis.matchedSkills),
    joinSkillsForExport(analysis.missingSkills),
  ];

  return toCsv([headers, row]);
}

/** Summary CSV with one row per saved analysis. */
export function buildAllSavedAnalysesCsv(analyses: SavedAnalysisExportRecord[]): string {
  const headers = [
    "saved_date",
    "job_title",
    "company",
    "source_url",
    "notes",
    "matched_skill_count",
    "missing_skill_count",
    "matched_skills",
    "missing_skills",
  ];

  const rows = analyses.map((analysis) => [
    formatSavedAnalysisDate(analysis.created_at),
    getSavedAnalysisDisplayTitle(analysis),
    getSavedAnalysisCompanyLabel(analysis),
    normalizeOptionalMetadata(analysis.source_url) ?? "",
    normalizeOptionalMetadata(analysis.notes) ?? "",
    analysis.matched_skills_count,
    analysis.missing_skills_count,
    joinSkillsForExport(analysis.matchedSkills),
    joinSkillsForExport(analysis.missingSkills),
  ]);

  return toCsv([headers, ...rows]);
}

/** CSV export for recurring missing-skill stats. */
export function buildRecurringGapsCsv(stats: RecurringGapStat[]): string {
  const headers = ["skill", "category", "count"];
  const rows = stats.map((stat) => [stat.skill, stat.category, stat.analysisCount]);
  return toCsv([headers, ...rows]);
}

function comparisonSkillLines(skills: SavedAnalysisSkill[]): string {
  if (skills.length === 0) {
    return "_None_";
  }
  return skills.map((skill) => `- ${formatSkillToken(skill)}`).join("\n");
}

/** Markdown export for a two-analysis skill comparison. */
export function buildComparisonMarkdown(input: ComparisonExportInput): string {
  const { firstLabel, secondLabel, comparison } = input;

  return [
    "# Saved analysis comparison export",
    "",
    "_Structured skill comparison only. No resume or job description body text._",
    "",
    `- **First analysis:** ${firstLabel}`,
    `- **Second analysis:** ${secondLabel}`,
    "",
    "## Missing skills",
    "",
    `### Shared missing skills (${comparison.missing.shared.length})`,
    "",
    comparisonSkillLines(comparison.missing.shared),
    "",
    `### Missing only in first (${comparison.missing.onlyFirst.length})`,
    "",
    comparisonSkillLines(comparison.missing.onlyFirst),
    "",
    `### Missing only in second (${comparison.missing.onlySecond.length})`,
    "",
    comparisonSkillLines(comparison.missing.onlySecond),
    "",
    "## Matched skills",
    "",
    `### Shared matched skills (${comparison.matched.shared.length})`,
    "",
    comparisonSkillLines(comparison.matched.shared),
    "",
    `### Matched only in first (${comparison.matched.onlyFirst.length})`,
    "",
    comparisonSkillLines(comparison.matched.onlyFirst),
    "",
    `### Matched only in second (${comparison.matched.onlySecond.length})`,
    "",
    comparisonSkillLines(comparison.matched.onlySecond),
    "",
  ].join("\n");
}

function comparisonCsvSectionRows(
  group: string,
  skills: SavedAnalysisSkill[],
): (string | number)[][] {
  return skills.map((skill) => [group, skill.skill, skill.category, 1]);
}

/** Long-format CSV export for a two-analysis skill comparison. */
export function buildComparisonCsv(input: ComparisonExportInput): string {
  const headers = [
    "first_analysis",
    "second_analysis",
    "group",
    "skill",
    "category",
    "count",
  ];

  const { firstLabel, secondLabel, comparison } = input;
  const meta = [firstLabel, secondLabel];

  const rows: (string | number)[][] = [
    ...comparisonCsvSectionRows("shared_missing", comparison.missing.shared).map(
      (row) => [...meta, ...row],
    ),
    ...comparisonCsvSectionRows("missing_only_first", comparison.missing.onlyFirst).map(
      (row) => [...meta, ...row],
    ),
    ...comparisonCsvSectionRows("missing_only_second", comparison.missing.onlySecond).map(
      (row) => [...meta, ...row],
    ),
    ...comparisonCsvSectionRows("shared_matched", comparison.matched.shared).map(
      (row) => [...meta, ...row],
    ),
    ...comparisonCsvSectionRows("matched_only_first", comparison.matched.onlyFirst).map(
      (row) => [...meta, ...row],
    ),
    ...comparisonCsvSectionRows("matched_only_second", comparison.matched.onlySecond).map(
      (row) => [...meta, ...row],
    ),
  ];

  return toCsv([headers, ...rows]);
}

export function downloadSavedAnalysisMarkdown(analysis: SavedAnalysisExportRecord): void {
  const basename = buildSavedAnalysisExportBasename(analysis);
  downloadTextFile(`${basename}.md`, buildSavedAnalysisMarkdown(analysis), "text/markdown;charset=utf-8");
}

export function downloadSavedAnalysisCsv(analysis: SavedAnalysisExportRecord): void {
  const basename = buildSavedAnalysisExportBasename(analysis);
  downloadTextFile(`${basename}.csv`, buildSavedAnalysisCsv(analysis), "text/csv;charset=utf-8");
}

export function downloadAllSavedAnalysesCsv(analyses: SavedAnalysisExportRecord[]): void {
  downloadTextFile(
    `saved-analyses-summary-${formatIsoDate(new Date().toISOString())}.csv`,
    buildAllSavedAnalysesCsv(analyses),
    "text/csv;charset=utf-8",
  );
}

export function downloadSelectedSavedAnalysesCsv(analyses: SavedAnalysisExportRecord[]): void {
  if (analyses.length === 0) {
    return;
  }

  downloadTextFile(
    `selected-saved-analyses-${analyses.length}-${formatIsoDate(new Date().toISOString())}.csv`,
    buildAllSavedAnalysesCsv(analyses),
    "text/csv;charset=utf-8",
  );
}

export function downloadRecurringGapsCsv(stats: RecurringGapStat[]): void {
  downloadTextFile(
    `recurring-missing-skills-${formatIsoDate(new Date().toISOString())}.csv`,
    buildRecurringGapsCsv(stats),
    "text/csv;charset=utf-8",
  );
}

export function downloadComparisonMarkdown(input: ComparisonExportInput): void {
  const basename = sanitizeFilenamePart(`${input.firstLabel}-vs-${input.secondLabel}`);
  downloadTextFile(
    `saved-analysis-comparison-${basename}.md`,
    buildComparisonMarkdown(input),
    "text/markdown;charset=utf-8",
  );
}

export function downloadComparisonCsv(input: ComparisonExportInput): void {
  const basename = sanitizeFilenamePart(`${input.firstLabel}-vs-${input.secondLabel}`);
  downloadTextFile(
    `saved-analysis-comparison-${basename}.csv`,
    buildComparisonCsv(input),
    "text/csv;charset=utf-8",
  );
}
