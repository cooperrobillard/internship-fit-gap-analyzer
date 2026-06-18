"use client";

import { useState } from "react";
import { AnalysisForm } from "@/app/dashboard/analysis-form";
import { ResumeProfilesPanel } from "@/app/dashboard/resume-profiles-panel";
import { SavedAnalysesPanel } from "@/app/dashboard/saved-analyses-panel";
import { SupabaseStatus } from "@/app/dashboard/supabase-status";
import { TestSaveAction } from "@/app/dashboard/test-save-action";

/**
 * Client-only dashboard block: prototype analysis, Supabase status, test save,
 * and saved list. Refresh state lives here so the server page does not pass
 * functions as children across the Server/Client boundary.
 */
export function DashboardInteractiveSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const onSaveSuccess = () => setRefreshKey((key) => key + 1);

  return (
    <>
      <AnalysisForm onSaveSuccess={onSaveSuccess} />
      <SupabaseStatus />
      <TestSaveAction onSaveSuccess={onSaveSuccess} />
      <SavedAnalysesPanel refreshKey={refreshKey} />
      <ResumeProfilesPanel />
    </>
  );
}
