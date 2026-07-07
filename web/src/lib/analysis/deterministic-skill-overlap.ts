/**
 * Deterministic skill overlap for Smart Analysis guardrails.
 *
 * Compares résumé and job text with taxonomy keyword matching only.
 * Text is used in memory for matching; callers must not log or persist it.
 */

import type { AnalysisSkill, WebAnalysisInput } from "@/lib/analysis/types";

type TaxonomyEntry = {
  skill: string;
  category: string;
  keywords: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  programming: "Programming",
  data: "Data",
  ai_ml: "AI/ML",
  cloud_backend: "Backend",
  software_tools: "Tools",
  web: "Web",
  communication: "Communication",
};

/** Subset of production taxonomy skills used for overlap guardrails. */
const OVERLAP_TAXONOMY: TaxonomyEntry[] = [
  { skill: "Python", category: CATEGORY_LABELS.programming, keywords: ["python"] },
  { skill: "JavaScript", category: CATEGORY_LABELS.programming, keywords: ["javascript", "js"] },
  { skill: "TypeScript", category: CATEGORY_LABELS.programming, keywords: ["typescript", "ts"] },
  { skill: "Java", category: CATEGORY_LABELS.programming, keywords: ["java"] },
  { skill: "C", category: CATEGORY_LABELS.programming, keywords: ["c language", "c programming", "ansi c"] },
  { skill: "C#", category: CATEGORY_LABELS.programming, keywords: ["c#", "c sharp", "c-sharp"] },
  { skill: "C++", category: CATEGORY_LABELS.programming, keywords: ["c++", "c plus plus", "cpp"] },
  { skill: "Go", category: CATEGORY_LABELS.programming, keywords: ["golang", "go"] },
  { skill: "Rust", category: CATEGORY_LABELS.programming, keywords: ["rust"] },
  { skill: "Ruby", category: CATEGORY_LABELS.programming, keywords: ["ruby"] },
  { skill: "PHP", category: CATEGORY_LABELS.programming, keywords: ["php"] },
  { skill: "Swift", category: CATEGORY_LABELS.programming, keywords: ["swift"] },
  { skill: "Kotlin", category: CATEGORY_LABELS.programming, keywords: ["kotlin"] },
  { skill: "R", category: CATEGORY_LABELS.programming, keywords: ["r programming", "r language"] },
  { skill: "Node.js", category: CATEGORY_LABELS.programming, keywords: ["node.js", "node js", "nodejs"] },
  { skill: "Bash", category: CATEGORY_LABELS.programming, keywords: ["bash"] },
  { skill: "PowerShell", category: CATEGORY_LABELS.programming, keywords: ["powershell", "windows powershell"] },
  { skill: "MATLAB", category: CATEGORY_LABELS.programming, keywords: ["matlab"] },
  { skill: "SQL", category: CATEGORY_LABELS.data, keywords: ["sql", "structured query language"] },
  { skill: "Excel", category: CATEGORY_LABELS.data, keywords: ["excel", "microsoft excel", "ms excel"] },
  { skill: "Pandas", category: CATEGORY_LABELS.data, keywords: ["pandas"] },
  { skill: "Spark", category: CATEGORY_LABELS.data, keywords: ["spark", "apache spark"] },
  { skill: "Tableau", category: CATEGORY_LABELS.data, keywords: ["tableau"] },
  { skill: "Power BI", category: CATEGORY_LABELS.data, keywords: ["power bi"] },
  { skill: "Statistics", category: CATEGORY_LABELS.data, keywords: ["statistics"] },
  { skill: "Data analysis", category: CATEGORY_LABELS.data, keywords: ["data analysis"] },
  { skill: "Machine learning", category: CATEGORY_LABELS.ai_ml, keywords: ["machine learning", "machine-learning", "ml"] },
  { skill: "PyTorch", category: CATEGORY_LABELS.ai_ml, keywords: ["pytorch"] },
  { skill: "TensorFlow", category: CATEGORY_LABELS.ai_ml, keywords: ["tensorflow"] },
  { skill: "scikit-learn", category: CATEGORY_LABELS.ai_ml, keywords: ["scikit-learn", "sklearn"] },
  { skill: "AWS", category: CATEGORY_LABELS.cloud_backend, keywords: ["aws", "amazon web services"] },
  { skill: "Azure", category: CATEGORY_LABELS.cloud_backend, keywords: ["azure", "microsoft azure"] },
  { skill: "Docker", category: CATEGORY_LABELS.cloud_backend, keywords: ["docker"] },
  { skill: "Kubernetes", category: CATEGORY_LABELS.cloud_backend, keywords: ["kubernetes", "k8s"] },
  { skill: "FastAPI", category: CATEGORY_LABELS.cloud_backend, keywords: ["fastapi", "fast api"] },
  { skill: "Flask", category: CATEGORY_LABELS.cloud_backend, keywords: ["flask"] },
  { skill: "Django", category: CATEGORY_LABELS.cloud_backend, keywords: ["django"] },
  { skill: "Terraform", category: CATEGORY_LABELS.cloud_backend, keywords: ["terraform"] },
  { skill: "Postgres", category: CATEGORY_LABELS.cloud_backend, keywords: ["postgres", "postgresql"] },
  { skill: "REST APIs", category: CATEGORY_LABELS.cloud_backend, keywords: ["rest api", "rest apis"] },
  { skill: "GraphQL", category: CATEGORY_LABELS.cloud_backend, keywords: ["graphql"] },
  { skill: "Microservices", category: CATEGORY_LABELS.cloud_backend, keywords: ["microservices"] },
  { skill: "React", category: CATEGORY_LABELS.web, keywords: ["react", "reactjs", "react.js"] },
  { skill: "Next.js", category: CATEGORY_LABELS.web, keywords: ["next.js", "next js", "nextjs"] },
  { skill: "Vue", category: CATEGORY_LABELS.web, keywords: ["vue", "vue.js", "vuejs"] },
  { skill: "Angular", category: CATEGORY_LABELS.web, keywords: ["angular"] },
  { skill: "Git", category: CATEGORY_LABELS.software_tools, keywords: ["git"] },
  { skill: "GitHub", category: CATEGORY_LABELS.software_tools, keywords: ["github"] },
  { skill: "Linux", category: CATEGORY_LABELS.software_tools, keywords: ["linux"] },
  {
    skill: "Customer service",
    category: CATEGORY_LABELS.communication,
    keywords: ["customer service", "customer support"],
  },
];

export type DeterministicOverlapResult = {
  matchedSkills: AnalysisSkill[];
  missingSkills: AnalysisSkill[];
};

export type AiSkillPayload = {
  skill: string;
  category: string;
  evidence?: string | null;
};

export type GuardedAiAnalysisPayload = {
  matchedSkills: AiSkillPayload[];
  missingSkills: AiSkillPayload[];
  transferableSkills?: AiSkillPayload[];
  resumeSkills?: AiSkillPayload[];
  jobSkills?: AiSkillPayload[];
  ignoredBoilerplate?: string[];
  summary: string;
  limitations?: string[];
  matchedSkillsCount: number;
  missingSkillsCount: number;
  usage?: {
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
  };
  model?: string;
};

/** Lowercase and collapse whitespace for substring matching. */
export function normalizeAnalysisText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Word-boundary-safe phrase check aligned with the Python analyzer. */
export function phraseAppearsInText(phrase: string, normalizedText: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().trim();
  if (!normalizedPhrase) {
    return false;
  }

  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<!\\w)${escaped}(?!\\w)`);
  return pattern.test(normalizedText);
}

function entryMentionedInText(entry: TaxonomyEntry, normalizedText: string): boolean {
  return entry.keywords.some((keyword) => phraseAppearsInText(keyword, normalizedText));
}

export function skillNormalizeKey(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Deterministic overlap between résumé and job description text.
 * Only skills present in both sides are matched; job-only skills are missing.
 */
export function computeDeterministicSkillOverlap(
  input: Pick<WebAnalysisInput, "resumeText" | "jobText">,
): DeterministicOverlapResult {
  const resumeNormalized = normalizeAnalysisText(input.resumeText);
  const jobNormalized = normalizeAnalysisText(input.jobText);

  const matchedSkills: AnalysisSkill[] = [];
  const missingSkills: AnalysisSkill[] = [];

  for (const entry of OVERLAP_TAXONOMY) {
    const inJob = entryMentionedInText(entry, jobNormalized);
    if (!inJob) {
      continue;
    }

    const skill: AnalysisSkill = { skill: entry.skill, category: entry.category };
    if (entryMentionedInText(entry, resumeNormalized)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  return { matchedSkills, missingSkills };
}

function normalizeAiSkillItems(items: unknown): AiSkillPayload[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized: AiSkillPayload[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const skill = typeof record.skill === "string" ? record.skill.trim() : "";
    const category = typeof record.category === "string" ? record.category.trim() : "";
    if (!skill) {
      continue;
    }
    const key = skillNormalizeKey(skill);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({
      skill,
      category: category || "General",
      evidence:
        typeof record.evidence === "string" && record.evidence.trim()
          ? record.evidence.trim()
          : undefined,
    });
  }

  return normalized;
}

/** True when the AI payload cannot be safely shown without rule-based fallback. */
export function isAiAnalysisPayloadInvalid(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") {
    return true;
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.matchedSkills) || !Array.isArray(record.missingSkills)) {
    return true;
  }

  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  return !summary;
}

/**
 * Merge advisory AI skills with deterministic overlap so obvious matches are never dropped.
 */
export function mergeAiResultWithDeterministicOverlap(
  aiPayload: GuardedAiAnalysisPayload,
  overlap: DeterministicOverlapResult,
): GuardedAiAnalysisPayload {
  const matchedMap = new Map<string, AiSkillPayload>();

  for (const item of normalizeAiSkillItems(aiPayload.matchedSkills)) {
    matchedMap.set(skillNormalizeKey(item.skill), item);
  }

  for (const item of overlap.matchedSkills) {
    const key = skillNormalizeKey(item.skill);
    if (!matchedMap.has(key)) {
      matchedMap.set(key, {
        skill: item.skill,
        category: item.category,
        evidence: "Found in both résumé and job description.",
      });
    }
  }

  const matchedSkills = Array.from(matchedMap.values());
  const matchedKeys = new Set(matchedSkills.map((item) => skillNormalizeKey(item.skill)));

  const missingMap = new Map<string, AiSkillPayload>();
  for (const item of normalizeAiSkillItems(aiPayload.missingSkills)) {
    const key = skillNormalizeKey(item.skill);
    if (!matchedKeys.has(key)) {
      missingMap.set(key, item);
    }
  }
  for (const item of overlap.missingSkills) {
    const key = skillNormalizeKey(item.skill);
    if (!matchedKeys.has(key) && !missingMap.has(key)) {
      missingMap.set(key, { skill: item.skill, category: item.category });
    }
  }

  const missingSkills = Array.from(missingMap.values());
  const corrected =
    overlap.matchedSkills.length > 0 &&
    normalizeAiSkillItems(aiPayload.matchedSkills).length === 0;

  const limitations = Array.isArray(aiPayload.limitations)
    ? [...aiPayload.limitations]
    : [];
  if (corrected && !limitations.some((item) => item.includes("deterministic overlap"))) {
    limitations.push(
      "Some matched skills were confirmed with deterministic overlap because Smart AI returned no direct matches.",
    );
  }

  return {
    ...aiPayload,
    matchedSkills,
    missingSkills,
    matchedSkillsCount: matchedSkills.length,
    missingSkillsCount: missingSkills.length,
    limitations,
  };
}

export function applyDeterministicGuardrails(
  aiPayload: unknown,
  input: Pick<WebAnalysisInput, "resumeText" | "jobText">,
): { ok: true; result: GuardedAiAnalysisPayload } | { ok: false } {
  if (isAiAnalysisPayloadInvalid(aiPayload)) {
    return { ok: false };
  }

  const record = aiPayload as GuardedAiAnalysisPayload;
  const overlap = computeDeterministicSkillOverlap(input);
  const result = mergeAiResultWithDeterministicOverlap(record, overlap);

  return { ok: true, result };
}
