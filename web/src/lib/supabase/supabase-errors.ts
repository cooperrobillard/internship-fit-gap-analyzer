export type SupabaseOperation = "save" | "read";

export type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type SafeSavedAnalysisErrorContext = {
  partialSave?: boolean;
  reason?: "config" | "session" | "network";
};

/** True when createClerkSupabaseClient or env checks fail for missing Supabase config. */
export function isMissingSupabaseConfigError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("supabase is not configured") ||
    message.includes("next_public_supabase_url") ||
    message.includes("next_public_supabase_publishable_key")
  );
}

/** Lowercase combined Supabase error text for classification only — not for UI. */
export function normalizeSupabaseErrorMessage(
  error: SupabaseErrorLike | null | undefined,
): string {
  if (!error) {
    return "";
  }

  return `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`
    .trim()
    .toLowerCase();
}

function isAuthOrRlsError(code: string, combined: string): boolean {
  return (
    code === "PGRST301" ||
    combined.includes("jwt") ||
    combined.includes("401") ||
    combined.includes("403") ||
    combined.includes("unauthorized") ||
    combined.includes("permission denied") ||
    combined.includes("row-level security") ||
    combined.includes("new row violates row-level security")
  );
}

function isMissingTableError(combined: string): boolean {
  return combined.includes("relation") && combined.includes("does not exist");
}

function isNetworkError(combined: string): boolean {
  return (
    combined.includes("failed to fetch") ||
    combined.includes("networkerror") ||
    combined.includes("network request failed") ||
    combined.includes("fetch failed")
  );
}

/**
 * Map Supabase/Clerk failures to calm, user-facing copy.
 * Does not expose tokens, secrets, stack traces, or raw Postgres messages.
 */
export function getSafeSavedAnalysisErrorMessage(
  operation: SupabaseOperation,
  error?: SupabaseErrorLike | null,
  context: SafeSavedAnalysisErrorContext = {},
): string {
  if (context.reason === "config") {
    return operation === "save"
      ? "Cloud save is not available because Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      : "Saved analyses cannot load because Supabase is not configured. Check your Supabase environment variables.";
  }

  if (context.reason === "session") {
    return "Your sign-in session is not ready yet. Wait a moment and try again.";
  }

  if (context.reason === "network") {
    return operation === "save"
      ? "Could not reach Supabase to save your analysis. Check your connection and try again."
      : "Could not load your saved analyses. Check your connection and try again.";
  }

  if (context.partialSave) {
    return "The save did not finish completely. Please try again. If this keeps happening, check Supabase for partial rows.";
  }

  const code = error?.code ?? "";
  const combined = normalizeSupabaseErrorMessage(error);

  if (isAuthOrRlsError(code, combined)) {
    return operation === "save"
      ? "Could not save your analysis. Clerk sign-in or Supabase row permissions may be blocking the save. Confirm Clerk is linked to Supabase and RLS policies allow inserts for your user."
      : "Could not load your saved analyses. Clerk sign-in or Supabase row permissions may be blocking the read. Confirm Clerk is linked to Supabase and RLS policies are applied.";
  }

  if (isMissingTableError(combined)) {
    return operation === "save"
      ? "Could not save your analysis because the database tables are missing. Run web/database/schema.sql in Supabase."
      : "Could not load saved analyses because the job_analyses table was not found. Run web/database/schema.sql in Supabase.";
  }

  if (isNetworkError(combined)) {
    return getSafeSavedAnalysisErrorMessage(operation, null, { reason: "network" });
  }

  return operation === "save"
    ? "Could not save your analysis right now. Please try again in a moment."
    : "Could not load your saved analyses right now. Please try again in a moment.";
}
