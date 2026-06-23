"use client";

import { useSession } from "@clerk/nextjs";
import { useState } from "react";
import {
  ExportDownloadButton,
  ExportDownloadGroup,
} from "@/app/dashboard/export-download-button";
import { downloadRecurringGapsCsv } from "@/lib/saved-analysis-exports";
import { fetchRecurringGapStats } from "@/lib/supabase/recurring-gap-stats";

export function RecurringGapExportActions() {
  const { session } = useSession();
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleDownload() {
    if (!session || isDownloading) {
      return;
    }

    setIsDownloading(true);
    setStatusMessage(null);

    try {
      const result = await fetchRecurringGapStats(() => session.getToken());

      if (result.status !== "success") {
        setStatusMessage("Recurring gaps are not ready to download yet.");
        return;
      }

      if (result.totalSavedAnalyses === 0) {
        setStatusMessage("Save an analysis before exporting recurring gaps.");
        return;
      }

      if (result.stats.length === 0) {
        setStatusMessage("No recurring missing skills to export yet.");
        return;
      }

      downloadRecurringGapsCsv(result.stats);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <ExportDownloadGroup
      title="Export recurring gaps"
      description={
        isDownloading
          ? "Preparing recurring-gap CSV…"
          : "Exports skill names and counts."
      }
    >
      <ExportDownloadButton
        label={isDownloading ? "Preparing CSV…" : "Recurring gaps (CSV)"}
        onClick={() => void handleDownload()}
        disabled={isDownloading}
      />
      {statusMessage ? (
        <p
          className="w-full text-xs text-zinc-600"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      ) : null}
    </ExportDownloadGroup>
  );
}
