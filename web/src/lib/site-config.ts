export const SITE_ORIGIN = "https://jobfit.cooperrobillard.com";
export const SITE_URL = new URL(SITE_ORIGIN);
export const SITE_NAME = "Job Fit & Skill-Gap Analyzer";
export const TWITTER_CARD = "summary_large_image" as const;
export const HOME_DESCRIPTION =
  "Compare résumé skills with job descriptions, review explicit matched and missing skills, and save structured results in a rule-based career planning workspace.";
export const SITE_DESCRIPTION =
  "Rule-based career planning workspace for comparing résumé skills with job descriptions, reviewing skill gaps, and working with structured saved results.";
export const SITE_LOCALE = "en_US";

export const HOME_TWITTER_METADATA = {
  card: TWITTER_CARD,
  title: SITE_NAME,
  description: HOME_DESCRIPTION,
} as const;

export function absoluteSiteUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("Site-relative paths must start with a slash.");
  }

  const url = new URL(path, SITE_URL);

  if (url.pathname === "/") {
    return `${url.origin}/${url.search}${url.hash}`;
  }

  return `${url.origin}${url.pathname.replace(/\/$/, "")}${url.search}${url.hash}`;
}
