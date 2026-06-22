import { SavedAnalysesPanel } from "@/app/dashboard/saved-analyses-panel";

export default function SavedDashboardPage() {
  return (
    <main className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Saved analyses
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-700 sm:text-lg">
          Review structured results, compare roles, and revisit recurring skill
          gaps.
        </p>
      </header>

      <SavedAnalysesPanel />
    </main>
  );
}
