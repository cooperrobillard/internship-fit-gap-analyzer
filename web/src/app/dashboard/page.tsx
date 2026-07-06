import Link from "next/link";
import { AnalysisForm } from "@/app/dashboard/analysis-form";

export default function DashboardPage() {
  return (
    <main className="space-y-5">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Analyze a role
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-700 sm:text-lg">
          Compare resume information or a saved profile with a job description using Smart AI when configured, or rule-based analysis as fallback.
        </p>
        <Link
          href="/privacy"
          className="mt-2 inline-flex text-sm font-medium text-sky-800 underline underline-offset-4 hover:text-sky-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
        >
          Review privacy and data controls
        </Link>
      </header>

      <AnalysisForm />
    </main>
  );
}
