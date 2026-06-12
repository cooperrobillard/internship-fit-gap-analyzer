/**
 * Browser-safe public environment configuration for the Next.js app.
 *
 * Only reads NEXT_PUBLIC_* variables. Server-only secrets (e.g. CLERK_SECRET_KEY,
 * ANALYSIS_API_URL, ANALYSIS_API_SHARED_SECRET) are read in route handlers only.
 */

/**
 * Supabase publishable (anon) key for the browser client.
 * Prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; falls back to legacy ANON_KEY name.
 */
export function getSupabaseAnonKey(): string | undefined {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishableKey) {
    return publishableKey;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;
}
