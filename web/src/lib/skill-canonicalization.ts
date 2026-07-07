/**
 * Lightweight skill-name canonicalization for comparison and recurring-gap alignment.
 * Mirrors a focused subset of api/ai_skill_canonicalization.py alias rules.
 */

const SKILL_PREFIX_RE =
  /^(?:experience with|knowledge of|familiarity with|proficiency in|working with|expertise in|skills? in)\s+/i;

const TRAILING_PUNCTUATION_RE = /[.,;:!?]+$/;

const CANONICAL_ALIASES: Record<string, string> = {
  "c sharp": "C#",
  "c-sharp": "C#",
  "c#": "C#",
  csharp: "C#",
  "c plus plus": "C++",
  "c-plus-plus": "C++",
  "c++": "C++",
  cpp: "C++",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  nextjs: "Next.js",
  "next js": "Next.js",
  "next.js": "Next.js",
  reactjs: "React",
  "react js": "React",
  "react.js": "React",
  nodejs: "Node.js",
  "node js": "Node.js",
  "node.js": "Node.js",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  restapi: "REST APIs",
  restapis: "REST APIs",
  sql: "SQL",
  "structured query language": "SQL",
  ml: "Machine learning",
  "machine learning": "Machine learning",
  "machine-learning": "Machine learning",
  aws: "AWS",
  "amazon web services": "AWS",
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
  value = SKILL_PREFIX_RE.test(value)
    ? collapseWhitespace(value.replace(SKILL_PREFIX_RE, ""))
    : value;
  value = TRAILING_PUNCTUATION_RE.test(value)
    ? value.replace(TRAILING_PUNCTUATION_RE, "").trim()
    : value;
  return value.toLowerCase();
}

/** Return a stable display label for grouping saved-analysis skills. */
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

/** Case-insensitive grouping key aligned with recurring-gap stats. */
export function comparisonSkillKey(raw: string): string {
  return canonicalizeSkillName(raw).toLowerCase();
}
