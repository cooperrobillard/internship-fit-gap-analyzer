import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DashboardInteractiveSection } from "@/components/dashboard-interactive-section";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="app-shell-container flex-1 py-10 sm:py-12">
      <div className="space-y-8">
        <header className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Your job-fit workspace
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700 sm:text-lg">
            {userId
              ? "Analyze a role, save structured results when they matter, and manage reusable skill profiles for future comparisons."
              : "Sign in to analyze roles, save structured results, and manage reusable skill profiles."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600">
            <Link
              href="/privacy"
              className="font-medium text-sky-800 underline underline-offset-4 hover:text-sky-900"
            >
              Privacy &amp; data controls
            </Link>
            <span>
              Rule-based matching; optional saves store structured results and
              metadata rather than raw resume or job body text.
            </span>
          </div>
        </header>

        <aside
          className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-950 sm:px-5"
          aria-label="Dashboard trust and privacy notes"
        >
          <ul className="grid gap-2 md:grid-cols-3">
            <li>
              <strong>Rule-based, not AI:</strong> comparisons use a keyword
              taxonomy.
            </li>
            <li>
              <strong>You choose saves:</strong> running analysis does not
              automatically save results.
            </li>
            <li>
              <strong>Structured history:</strong> saved analyses keep skills
              and metadata; full details are on the privacy page.
            </li>
          </ul>
        </aside>

        <DashboardInteractiveSection />
      </div>
    </main>
  );
}
