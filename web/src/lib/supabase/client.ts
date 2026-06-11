import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnvConfig = {
  url: string;
  publishableKey: string;
};

export type AccessTokenGetter = () => Promise<string | null>;

/**
 * Returns Supabase public env config, or null if URL / publishable key are missing.
 * Never reads server-only secrets — browser-safe only.
 */
export function getSupabaseEnv(): SupabaseEnvConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

/** Stable boolean for React effect dependencies (avoids new object references each render). */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/**
 * Build a Supabase browser client that sends the Clerk session token on each request.
 * Pass session.getToken (or equivalent) from Clerk's useSession hook.
 */
export function createClerkSupabaseClient(
  getAccessToken: AccessTokenGetter,
): SupabaseClient {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return createClient(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    async accessToken() {
      return getAccessToken();
    },
  });
}
