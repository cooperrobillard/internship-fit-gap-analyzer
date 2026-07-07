/**
 * Deterministic skill-name canonicalization for saved analyses, recurring gaps,
 * comparison, exports, and overlap guardrails.
 *
 * Keep alias mappings aligned with api/ai_skill_canonicalization.py.
 */

export type CanonicalSkill = {
  skill: string;
  category: string;
};

const SKILL_PREFIX_RE =
  /^(?:experience with|knowledge of|familiarity with|proficiency in|working with|expertise in|skills? in)\s+/i;

const TRAILING_PUNCTUATION_RE = /[.,;:!?]+$/;

const CANONICAL_ALIASES: Record<string, string> = {
  "ai assisted development": "AI-assisted development",
  "ai assisted development tool": "AI-assisted development",
  "ai assisted development tools": "AI-assisted development",
  "ai assisted coding": "AI-assisted development",
  "ai assisted software development": "AI-assisted development",
  "ai coding assistants": "AI-assisted development",
  "ai coding tools": "AI-assisted development",
  "ai developer tools": "AI-assisted development",
  "ai development tools": "AI-assisted development",
  "ai productivity tools for development": "AI-assisted development",
  "ai tools for developer productivity": "AI-assisted development",
  "ai tools for development productivity": "AI-assisted development",
  "coding with ai tools": "AI-assisted development",
  "generative ai development tools": "AI-assisted development",
  "llm assisted coding": "AI-assisted development",
  "llm assisted development": "AI-assisted development",
  "llm assisted prototyping": "AI-assisted development",
  "llm assisted software development": "AI-assisted development",
  "large language model": "Large language models",
  "large language models": "Large language models",
  llm: "Large language models",
  llms: "Large language models",
  "openai api": "OpenAI API",
  "openai apis": "OpenAI API",
  "openai integration": "OpenAI API",
  "openai platform api": "OpenAI API",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  restapi: "REST APIs",
  restapis: "REST APIs",
  "restful api": "REST APIs",
  "restful apis": "REST APIs",
  "machine learning": "Machine learning",
  "machine-learning": "Machine learning",
  ml: "Machine learning",
  "computer vision": "Computer vision",
  "visual perception": "Computer vision",
  "c sharp": "C#",
  "c sharp programming": "C#",
  "c#": "C#",
  "c# programming": "C#",
  "c-sharp": "C#",
  csharp: "C#",
  "c plus plus": "C++",
  "c++": "C++",
  "c++ programming": "C++",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  "next js": "Next.js",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "react js": "React",
  "react.js": "React",
  reactjs: "React",
  "node js": "Node.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  powershell: "PowerShell",
  "powershell scripting": "PowerShell",
  "windows powershell": "PowerShell",
  sql: "SQL",
  "structured query language": "SQL",
  "ci/cd": "CI/CD",
  "continuous deployment": "CI/CD",
  "continuous integration": "CI/CD",
  "continuous integration and deployment": "CI/CD",
  "continuous integration / continuous deployment": "CI/CD",
  "algorithms and data structures": "Data structures and algorithms",
  "data structures & algorithms": "Data structures and algorithms",
  "data structures and algorithms": "Data structures and algorithms",
  "embedded software systems": "Embedded systems",
  "embedded system": "Embedded systems",
  "embedded systems": "Embedded systems",
  "firmware test": "Firmware testing",
  "firmware testing": "Firmware testing",
  "firmware validation": "Firmware testing",
  "3-d printing": "3D printing",
  "3d printing": "3D printing",
  "adobe after effects": "Adobe After Effects",
  "adobe photoshop": "Adobe Photoshop",
  "after effects": "Adobe After Effects",
  cad: "CAD",
  cfd: "CFD",
  "computer aided design": "CAD",
  "computer-aided design": "CAD",
  "computational fluid dynamics": "CFD",
  photoshop: "Adobe Photoshop",
  sysinternals: "Sysinternals",
  "sysinternals suite": "Sysinternals",
  "three dimensional printing": "3D printing",
};

const CANONICAL_SKILL_CATEGORIES: Record<string, string> = {
  "AI-assisted development": "AI tools",
  "Large language models": "AI/ML",
  "OpenAI API": "AI/ML",
  "Machine learning": "AI/ML",
  "Computer vision": "AI/ML",
  "REST APIs": "Backend",
  "CI/CD": "Backend",
  "C#": "Programming",
  "C++": "Programming",
  PowerShell: "Programming",
  SQL: "Data",
  "Data structures and algorithms": "Programming",
  "Embedded systems": "Engineering",
  "Firmware testing": "Engineering",
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lookupKeys(value: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  const add = (key: string) => {
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  };

  add(value);
  add(value.replace(/-/g, " "));
  add(value.replace(/ /g, "-"));
  add(value.replace(/[\s.\-/]+/g, ""));
  return keys;
}

function prepareLookupValue(raw: string): string {
  let value = collapseWhitespace(raw);
  value = value.replace(SKILL_PREFIX_RE, "").trim();
  value = collapseWhitespace(value);
  value = value.replace(TRAILING_PUNCTUATION_RE, "").trim();
  return value.toLowerCase();
}

/** Return a stable display label for a skill name. */
export function canonicalizeSkillName(raw: string): string {
  const prepared = prepareLookupValue(raw);
  if (!prepared) {
    return "";
  }

  for (const key of lookupKeys(prepared)) {
    const canonical = CANONICAL_ALIASES[key];
    if (canonical) {
      return canonical;
    }
  }

  return collapseWhitespace(raw.trim().replace(TRAILING_PUNCTUATION_RE, ""));
}

/** Prefer a stable category for canonical skill concepts. */
export function canonicalizeSkillCategory(skill: string, category: string): string {
  const preferred = CANONICAL_SKILL_CATEGORIES[skill];
  if (preferred) {
    return preferred;
  }

  const trimmed = category.trim();
  return trimmed || "General";
}

/** Lowercase canonical key for grouping and deduplication. */
export function canonicalSkillKey(skill: string): string {
  return canonicalizeSkillName(skill).toLowerCase();
}

export function canonicalizeSkill(skill: CanonicalSkill): CanonicalSkill {
  const canonicalSkill = canonicalizeSkillName(skill.skill);
  return {
    skill: canonicalSkill,
    category: canonicalizeSkillCategory(canonicalSkill, skill.category),
  };
}

function sortCanonicalSkills(skills: CanonicalSkill[]): CanonicalSkill[] {
  return [...skills].sort((left, right) => {
    const bySkill = left.skill.localeCompare(right.skill);
    if (bySkill !== 0) {
      return bySkill;
    }
    return left.category.localeCompare(right.category);
  });
}

/** Canonicalize and deduplicate skill rows by canonical skill name. */
export function canonicalizeSkillList(skills: CanonicalSkill[]): CanonicalSkill[] {
  const seen = new Map<string, CanonicalSkill>();

  for (const item of skills) {
    const canonical = canonicalizeSkill(item);
    if (!canonical.skill) {
      continue;
    }

    const key = canonicalSkillKey(canonical.skill);
    if (!seen.has(key)) {
      seen.set(key, canonical);
    }
  }

  return sortCanonicalSkills([...seen.values()]);
}

/** Canonicalize profile skill strings and deduplicate variants. */
export function canonicalizeSkillNameList(rawNames: string[]): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawNames) {
    const canonical = canonicalizeSkillName(raw);
    const key = canonical.toLowerCase();
    if (!canonical || seen.has(key)) {
      continue;
    }
    seen.add(key);
    values.push(canonical);
  }

  return values;
}
