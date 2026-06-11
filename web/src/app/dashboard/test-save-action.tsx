"use client";

import { useAuth, useSession } from "@clerk/nextjs";
import { useState } from "react";
import { SavedAnalysesPanel } from "./saved-analyses-panel";
import {
  createClerkSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { CloudAnalysisSaveInput } from "@/lib/supabase/save-analysis-contract";
import { saveCloudAnalysis } from "@/lib/supabase/save-analysis";

const boxClass = "mt-6 rounded-xl border p-5 text-sm leading-relaxed";

/** Controlled sample payload — no raw resume or job body text. */
const DASHBOARD_TEST_SAVE_INPUT: CloudAnalysisSaveInput = {
  metadata: {
    runLabel: "Dashboard test save",
    jobTitle: "Sample Cloud Analysis",
    company: "Demo Company",
    notes:
      "Created by the dashboard test cloud save action. This is not a real analysis workflow.",
  },
  matchedSkills: [
    { skill: "Python", category: "Programming" },
    { skill: "SQL", category: "Data" },
  ],
  missingSkills: [
    { skill: "Docker", category: "DevOps" },
    { skill: "Cloud Databases", category: "Data" },
  ],
};

type SaveUiState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; jobAnalysisId: string }
  | { kind: "error"; message: string };

type TestSaveActionProps = {
  onSaveSuccess?: () => void;
};

export function TestSaveAction({ onSaveSuccess }: TestSaveActionProps) {
  const configured = isSupabaseConfigured();
  const { isLoaded, session } = useSession();
  const { userId } = useAuth();
  const [uiState, setUiState] = useState<SaveUiState>({ kind: "idle" });

  const canAttemptSave =
    configured && isLoaded && Boolean(session) && Boolean(userId);

  async function handleTestSave() {
    if (!canAttemptSave || !session || !userId || uiState.kind === "saving") {
      return;
    }

    setUiState({ kind: "saving" });

    const supabase = createClerkSupabaseClient(() => session.getToken());
    const result = await saveCloudAnalysis(
      supabase,
      userId,
      DASHBOARD_TEST_SAVE_INPUT,
    );

    if (result.status === "error") {
      setUiState({ kind: "error", message: result.message });
      return;
    }

    setUiState({ kind: "success", jobAnalysisId: result.jobAnalysisId });
    onSaveSuccess?.();
  }

  return (
    <div className={`${boxClass} border-amber-200 bg-amber-50 text-amber-950`}>
      <p className="font-medium text-amber-950">Test cloud save</p>
      <p className="mt-2 text-amber-900/90">
        This saves a small sample analysis to Supabase to verify the write path.
        This is <strong>not</strong> the real analysis workflow yet. No resume or
        job posting text is stored.
      </p>

      {!configured ? (
        <p className="mt-3 text-sm text-amber-900/80">
          Supabase is not configured. Add env vars to{" "}
          <code className="text-xs">web/.env.local</code> before testing.
        </p>
      ) : null}

      {!isLoaded ? (
        <p className="mt-3 text-sm text-amber-900/80">Loading Clerk session…</p>
      ) : null}

      {isLoaded && !userId ? (
        <p className="mt-3 text-sm text-amber-900/80">
          Sign in to run the test save.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleTestSave()}
        disabled={!canAttemptSave || uiState.kind === "saving"}
        className="mt-4 rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uiState.kind === "saving" ? "Saving sample analysis…" : "Run test cloud save"}
      </button>

      {uiState.kind === "success" ? (
        <p className="mt-3 text-sm text-emerald-900">
          Sample analysis saved. Job analysis id:{" "}
          <code className="text-xs">{uiState.jobAnalysisId.slice(0, 8)}…</code>.
          The list below should refresh. Real web analysis and the Python service
          are not connected yet.
        </p>
      ) : null}

      {uiState.kind === "error" ? (
        <p className="mt-3 text-sm text-red-900">{uiState.message}</p>
      ) : null}
    </div>
  );
}

/** Test save + saved list with simple refresh after a successful write. */
export function DashboardCloudSaveSection() {
  const [listRefreshKey, setListRefreshKey] = useState(0);

  return (
    <>
      <TestSaveAction
        onSaveSuccess={() => setListRefreshKey((key) => key + 1)}
      />
      <SavedAnalysesPanel refreshKey={listRefreshKey} />
    </>
  );
}
