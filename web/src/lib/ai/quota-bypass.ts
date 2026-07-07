/**
 * Server-only owner/admin bypass for Smart AI quota limits.
 *
 * Reads AI_QUOTA_BYPASS_USER_IDS from process.env — never expose via NEXT_PUBLIC_*.
 */

const BYPASS_ENV_KEY = "AI_QUOTA_BYPASS_USER_IDS";

let cachedBypassUserIds: Set<string> | null = null;

function parseBypassUserIds(raw: string | undefined): Set<string> {
  if (!raw?.trim()) {
    return new Set();
  }

  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(ids);
}

function getAiQuotaBypassUserIds(): Set<string> {
  if (cachedBypassUserIds === null) {
    cachedBypassUserIds = parseBypassUserIds(process.env[BYPASS_ENV_KEY]);
  }
  return cachedBypassUserIds;
}

/** Reset cached env parse — for tests only. */
export function __resetAiQuotaBypassCacheForTests(): void {
  cachedBypassUserIds = null;
}

export function isAiQuotaBypassUser(userId: string | null | undefined): boolean {
  if (!userId?.trim()) {
    return false;
  }
  return getAiQuotaBypassUserIds().has(userId.trim());
}
