export const CANONICAL_ORIGIN = "https://jobfit.cooperrobillard.com";
export const OLD_VERCEL_ORIGIN = "https://internship-fit-gap-analyzer.vercel.app";

export const EXPECTED_HOME_CANONICAL = `${CANONICAL_ORIGIN}/`;
export const EXPECTED_PRIVACY_CANONICAL = `${CANONICAL_ORIGIN}/privacy`;
export const EXPECTED_SITEMAP_URLS = [EXPECTED_HOME_CANONICAL, EXPECTED_PRIVACY_CANONICAL];
export const EXPECTED_MATCHED_SKILLS = ["excel", "inventory management", "logistics", "procurement"];
export const EXPECTED_MISSING_SKILLS = ["demand planning", "erp", "forecasting", "sap erp", "supplier management"];

const FORBIDDEN_CANONICAL_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /\.vercel\.app/i,
  /\*\./,
  /internship-fit-gap-analyzer\.vercel\.app/i,
];

export type MetadataSnapshot = {
  canonical?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphUrl?: string | null;
  openGraphImage?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  robots?: string | null;
};

export function assertCanonicalBaseUrl(baseUrl: string): void {
  if (baseUrl !== CANONICAL_ORIGIN) {
    throw new Error(`QA_BASE_URL must be exactly ${CANONICAL_ORIGIN}; received ${baseUrl}`);
  }
}

export function assertCanonicalUrl(actual: string | null | undefined, expected: string): void {
  if (!actual) {
    throw new Error(`Missing canonical URL; expected ${expected}`);
  }
  const normalized = normalizeCanonical(actual);
  if (normalized !== expected) {
    throw new Error(`Unexpected canonical URL: ${normalized}; expected ${expected}`);
  }
  assertNoForbiddenCanonical(normalized);
}

export function assertNoForbiddenCanonical(value: string): void {
  const offenders = FORBIDDEN_CANONICAL_PATTERNS.filter((pattern) => pattern.test(value));
  if (offenders.length > 0) {
    throw new Error(`Canonical metadata contains a forbidden host pattern: ${value}`);
  }
}

export function normalizeCanonical(value: string): string {
  const parsed = new URL(value);
  if (parsed.origin !== CANONICAL_ORIGIN) {
    return parsed.toString();
  }
  // Next.js 16.2.9 serializes an absolute queryless root URL as its origin; normalize
  // both equivalent HTML forms to the slash-root canonical representation.
  if (parsed.pathname === "/") {
    return `${CANONICAL_ORIGIN}/`;
  }
  return `${CANONICAL_ORIGIN}${parsed.pathname.replace(/\/$/, "")}`;
}

export function extractSitemapUrls(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim()).sort();
}

export function assertExactSitemap(xml: string): void {
  const actual = extractSitemapUrls(xml);
  const expected = [...EXPECTED_SITEMAP_URLS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected sitemap URLs: ${JSON.stringify(actual)}`);
  }
}

export function assertRobotsTxt(robots: string): void {
  if (!robots.includes(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`)) {
    throw new Error("robots.txt does not point to the canonical sitemap.");
  }
  for (const path of ["/dashboard", "/api/", "/sign-in", "/sign-up", "/__clerk/"]) {
    if (!robots.includes(`Disallow: ${path}`)) {
      throw new Error(`robots.txt is missing expected disallow rule for ${path}`);
    }
  }
}

export function assertNoIndex(metadata: MetadataSnapshot, route: string): void {
  const robots = metadata.robots?.toLowerCase() ?? "";
  if (!robots.includes("noindex")) {
    throw new Error(`${route} must emit noindex robots metadata.`);
  }
}

export function assertMetadataSnapshot(input: {
  metadata: MetadataSnapshot;
  expectedCanonical: string;
  expectedTitle: string;
  expectedDescription: string;
}): void {
  const { metadata, expectedCanonical, expectedTitle, expectedDescription } = input;
  assertCanonicalUrl(metadata.canonical, expectedCanonical);
  assertCanonicalUrl(metadata.openGraphUrl, expectedCanonical);
  if (metadata.openGraphTitle !== expectedTitle) throw new Error("Unexpected Open Graph title.");
  if (metadata.openGraphDescription !== expectedDescription) throw new Error("Unexpected Open Graph description.");
  if (!metadata.openGraphImage) throw new Error("Missing Open Graph image.");
  if (metadata.twitterCard !== "summary_large_image") throw new Error("Unexpected Twitter card.");
  if (metadata.twitterTitle !== expectedTitle) throw new Error("Unexpected Twitter title.");
  if (metadata.twitterDescription !== expectedDescription) throw new Error("Unexpected Twitter description.");
  if (!metadata.twitterImage) throw new Error("Missing Twitter image.");
  assertNoForbiddenCanonical(metadata.openGraphImage);
  assertNoForbiddenCanonical(metadata.twitterImage);
}

export function normalizeSkillSet(skills: string[]): string[] {
  return Array.from(new Set(skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean))).sort();
}

export function assertExactSkillSets(input: { matched: string[]; missing: string[] }): void {
  const matched = normalizeSkillSet(input.matched);
  const missing = normalizeSkillSet(input.missing);
  if (JSON.stringify(matched) !== JSON.stringify(EXPECTED_MATCHED_SKILLS)) {
    throw new Error(`Unexpected matched skills: ${JSON.stringify(matched)}`);
  }
  if (JSON.stringify(missing) !== JSON.stringify(EXPECTED_MISSING_SKILLS)) {
    throw new Error(`Unexpected missing skills: ${JSON.stringify(missing)}`);
  }
  const overlap = matched.filter((skill) => missing.includes(skill));
  if (overlap.length > 0) {
    throw new Error(`Matched and missing skills overlap: ${overlap.join(", ")}`);
  }
}

export function assertSafeUiText(text: string): void {
  const unsafePatterns = [
    /stack trace/i,
    /traceback/i,
    /authorization:/i,
    /bearer\s+[a-z0-9._-]+/i,
    /sql(state| error)?/i,
    /provider response/i,
    /supabase.*key/i,
    /clerk.*secret/i,
    /vercel_token/i,
    /password/i,
    /private key/i,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  ];
  const match = unsafePatterns.find((pattern) => pattern.test(text));
  if (match) {
    throw new Error(`Unsafe UI text matched ${match}`);
  }
}
