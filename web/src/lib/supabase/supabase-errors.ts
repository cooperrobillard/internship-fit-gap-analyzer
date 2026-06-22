export type SupabaseOperation = "save" | "read" | "delete";

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
    return "This feature is temporarily unavailable. Please try again shortly.";
  }

  if (context.reason === "session") {
    return "Your sign-in session is not ready yet. Wait a moment and try again.";
  }

  if (context.reason === "network") {
    if (operation === "delete") {
      return "Could not delete this analysis. Check your connection and try again.";
    }
    return operation === "save"
      ? "Could not save your analysis. Check your connection and try again."
      : "Could not load your saved analyses. Check your connection and try again.";
  }

  if (context.partialSave) {
    return "The save did not finish completely. Please try again shortly.";
  }

  const code = error?.code ?? "";
  const combined = normalizeSupabaseErrorMessage(error);

  if (isAuthOrRlsError(code, combined)) {
    if (operation === "delete") {
      return "Could not delete this analysis. Your session may have expired. Refresh the page or sign in again.";
    }
    return operation === "save"
      ? "Could not save your analysis. Your session may have expired. Refresh the page or sign in again."
      : "Could not load your saved analyses. Your session may have expired. Refresh the page or sign in again.";
  }

  if (isMissingTableError(combined)) {
    if (operation === "delete") {
      return "Could not delete this analysis right now. Please try again in a moment.";
    }
    return operation === "save"
      ? "Could not save your analysis right now. Please try again in a moment."
      : "Could not load your saved analyses right now. Please try again in a moment.";
  }

  if (isNetworkError(combined)) {
    return getSafeSavedAnalysisErrorMessage(operation, null, {
      reason: "network",
    });
  }

  return operation === "save"
    ? "Could not save your analysis right now. Please try again in a moment."
    : operation === "delete"
      ? "Could not delete this analysis right now. Please try again in a moment."
      : "Could not load your saved analyses right now. Please try again in a moment.";
}
