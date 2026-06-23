import { SavedAnalysesPanel } from "@/app/dashboard/saved-analyses-panel";

export default function SavedDashboardPage() {
  return (
    <main className="space-y-5">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Saved analyses
        </h1>
        <p className="mt-2 text-base leading-7 text-zinc-700 sm:text-lg">
          Review structured results, compare roles, and revisit recurring skill
          gaps.
        </p>
      </header>

      <SavedAnalysesPanel />
    </main>
  );
}
