/**
 * Web analysis boundary types.
 *
 * Shapes are intentionally close to the cloud save contract
 * (`SkillResult` / `CloudAnalysisSaveInput`) so a future branch can map
 * `WebAnalysisResult` into `saveCloudAnalysis` without raw resume/job text.
 */

export type AnalysisSkill = {
  skill: string;
  category: string;
};

export type WebAnalysisInput = {
  resumeText: string;
  jobText: string;
  jobTitle?: string;
  company?: string;
  sourceUrl?: string;
  notes?: string;
};

export type WebAnalysisResult = {
  matchedSkills: AnalysisSkill[];
  missingSkills: AnalysisSkill[];
  matchedSkillsCount: number;
  missingSkillsCount: number;
  summary: string;
};
