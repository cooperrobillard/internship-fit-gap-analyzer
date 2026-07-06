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

export type AnalysisSkillWithEvidence = AnalysisSkill & {
  evidence?: string;
};

export type AnalysisMode = "rule_based" | "ai_smart" | "rule_based_fallback";

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
  analysisMode?: AnalysisMode;
  transferableSkills?: AnalysisSkillWithEvidence[];
  resumeSkills?: AnalysisSkillWithEvidence[];
  jobSkills?: AnalysisSkillWithEvidence[];
  ignoredBoilerplate?: string[];
  limitations?: string[];
  model?: string;
  fallbackReason?: string;
};

export type UserAnalysisModeChoice = "smart_ai" | "rule_based";

export type AiProfileExtractionResult = {
  candidateName: string;
  skills: string[];
  summary: string;
  extractionMethod: "ai" | "rule_based";
  model?: string;
};
