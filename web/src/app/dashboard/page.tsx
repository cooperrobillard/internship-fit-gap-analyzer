import Link from "next/link";
import { AnalysisForm } from "@/app/dashboard/analysis-form";

export default function DashboardPage() {
  return (
    <main className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Analyze a role
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-700 sm:text-lg">
          Compare resume information or a saved profile with a job description.
        </p>
        <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
          <p>Running an analysis does not automatically save it.</p>
          <Link
            href="/privacy"
            className="font-medium text-sky-800 underline underline-offset-4 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
          >
            Review privacy and data controls
          </Link>
        </div>
      </header>

      <AnalysisForm />
    </main>
  );
}
