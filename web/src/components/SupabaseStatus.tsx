"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type CheckResult =
  | { kind: "success"; count: number }
  | { kind: "error"; message: string };

function classifyError(error: {
  message?: string;
  code?: string;
  details?: string;
}): string {
  const code = error.code ?? "";
  const combined = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();

  if (
    code === "PGRST301" ||
    combined.includes("jwt") ||
    combined.includes("401") ||
    combined.includes("403") ||
    combined.includes("unauthorized") ||
    combined.includes("permission denied") ||
    combined.includes("row-level security")
  ) {
    return (
      "Clerk ↔ Supabase authentication failed. Confirm Clerk is set up as a " +
      "Supabase third-party auth provider and that your Clerk session token is " +
      "accepted by Supabase RLS policies."
    );
  }

  if (
    combined.includes("relation") &&
    combined.includes("does not exist")
  ) {
    return (
      "The job_analyses table was not found. Run web/database/schema.sql in " +
      "your Supabase SQL editor, then reload this page."
    );
  }

  const suffix = code ? ` (${code})` : "";
  return (
    (error.message?.trim() ||
      "Could not run the read-only Supabase status check.") + suffix
  );
}

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

export function SupabaseStatus() {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const sessionId = session?.id ?? null;

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const completedSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!configured || !isLoaded || !sessionId || !session) {
      return;
    }

    // One read-only check per Clerk session. Survives Strict Mode remounts
    // without resetting a finished UI state or firing endless requests.
    if (completedSessionIdRef.current === sessionId) {
      return;
    }

    const activeSession = session;
    let cancelled = false;

    async function runStatusCheck() {
      try {
        const supabase = createClerkSupabaseClient(() =>
          activeSession.getToken(),
        );

        const { count, error } = await supabase
          .from("job_analyses")
          .select("*", { count: "exact", head: true });

        if (cancelled) {
          return;
        }

        completedSessionIdRef.current = sessionId;

        if (error) {
          setCheckResult({ kind: "error", message: classifyError(error) });
          return;
        }

        setCheckResult({ kind: "success", count: count ?? 0 });
      } catch (err) {
        if (cancelled) {
          return;
        }

        completedSessionIdRef.current = sessionId;
        setCheckResult({
          kind: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unexpected error while checking Supabase.",
        });
      }
    }

    void runStatusCheck();

    return () => {
      cancelled = true;
    };
    // session is read inside this effect; completedSessionIdRef prevents repeats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, isLoaded, sessionId]);

  if (!configured) {
    return (
      <div className={`${boxClass} border-zinc-200 bg-zinc-50 text-zinc-700`}>
        <p className="font-medium text-zinc-900">Supabase is not configured</p>
        <p className="mt-2">
          Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
          to <code className="text-xs">web/.env.local</code>. This check is
          read-only—it does not save analyses, and the Python analysis service
          is not connected yet.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Loading Clerk session…</p>
        <p className="mt-2 text-sky-800/90">
          Waiting to start one read-only Supabase status check.
        </p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <p className="font-medium">Supabase status check unavailable</p>
        <p className="mt-2">
          No Clerk session is available. Sign in again, then reload the
          dashboard.
        </p>
      </div>
    );
  }

  if (checkResult === null) {
    return (
      <div className={`${boxClass} border-sky-200 bg-sky-50 text-sky-900`}>
        <p className="font-medium">Checking Supabase connection…</p>
        <p className="mt-2 text-sky-800/90">
          Running one read-only count on{" "}
          <code className="text-xs">job_analyses</code>. Cloud saving is not
          implemented yet.
        </p>
      </div>
    );
  }

  if (checkResult.kind === "error") {
    return (
      <div className={`${boxClass} border-red-200 bg-red-50 text-red-950`}>
        <p className="font-medium">Supabase status check failed</p>
        <p className="mt-2">{checkResult.message}</p>
        <p className="mt-3 text-red-900/80">
          This dashboard does not save analyses yet, and the Python analysis
          service is not connected.
        </p>
      </div>
    );
  }

  return (
    <div className={`${boxClass} border-emerald-200 bg-emerald-50 text-emerald-950`}>
      <p className="font-medium">Supabase configured and reachable</p>
      <p className="mt-2">
        Clerk-authenticated read succeeded. You have{" "}
        <strong>{checkResult.count}</strong> saved cloud{" "}
        {checkResult.count === 1 ? "analysis" : "analyses"} in{" "}
        <code className="text-xs">job_analyses</code>.
      </p>
      <p className="mt-3 text-emerald-900/80">
        This was a read-only connectivity check. Cloud saving is not implemented
        yet, and the Python analysis service is not connected yet.
      </p>
    </div>
  );
}
