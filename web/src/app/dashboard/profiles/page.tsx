import { ResumeProfilesPanel } from "@/app/dashboard/resume-profiles-panel";

export default function ProfilesDashboardPage() {
  return (
    <main className="space-y-7">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Resume profiles
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-700 sm:text-lg">
          Manage reusable structured skill profiles for future analyses.
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Profiles contain structured skills and notes rather than raw resume
          body text.
        </p>
      </header>

      <ResumeProfilesPanel />
    </main>
  );
}
