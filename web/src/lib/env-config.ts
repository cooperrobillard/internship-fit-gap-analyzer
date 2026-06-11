/**
 * Browser-safe public environment configuration for the Next.js app.
 *
 * Only reads NEXT_PUBLIC_* variables and server-only vars used in server
 * components/middleware (e.g. CLERK_SECRET_KEY is not read here).
 */

const DEFAULT_ANALYSIS_API_URL = "http://127.0.0.1:8000";

/** FastAPI analysis service base URL (no trailing slash). */
export function getAnalysisApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ANALYSIS_API_URL?.trim();
  if (!configured) {
    return DEFAULT_ANALYSIS_API_URL;
  }
  return configured.replace(/\/$/, "");
}

/**
 * Supabase anon (publishable) key for the browser client.
 * Prefers NEXT_PUBLIC_SUPABASE_ANON_KEY; falls back to legacy publishable name.
 */
export function getSupabaseAnonKey(): string | undefined {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey) {
    return anonKey;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || undefined;
}
