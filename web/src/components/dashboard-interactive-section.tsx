"use client";

import { useState } from "react";
import { AnalysisForm } from "@/app/dashboard/analysis-form";
import { ResumeProfilesPanel } from "@/app/dashboard/resume-profiles-panel";
import { SavedAnalysesPanel } from "@/app/dashboard/saved-analyses-panel";

const workspaceLinks = [
  {
    href: "#analyze",
    label: "Analyze",
    description: "Run a resume-to-job comparison",
  },
  {
    href: "#saved-analyses",
    label: "Saved analyses",
    description: "Review, compare, and export results",
  },
  {
    href: "#resume-profiles",
    label: "Resume profiles",
    description: "Manage reusable structured skill profiles",
  },
] as const;

/**
 * Client-only dashboard workspace. Refresh state lives here so successful real
 * analysis saves can reload the saved-analysis panels without remounting the
 * Analyze, Saved analyses, or Resume profiles sections.
 */
export function DashboardInteractiveSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const onSaveSuccess = () => setRefreshKey((key) => key + 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <nav
        aria-label="Dashboard workspace"
        className="rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm lg:sticky lg:top-24"
      >
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Workspace
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {workspaceLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              >
                <span className="font-semibold text-zinc-950">{link.label}</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-600">
                  {link.description}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-8">
        <AnalysisForm onSaveSuccess={onSaveSuccess} />
        <SavedAnalysesPanel refreshKey={refreshKey} />
        <ResumeProfilesPanel />
      </div>
    </div>
  );
}
