import { ResumeProfilesPanel } from "@/app/dashboard/resume-profiles-panel";

export default function ProfilesDashboardPage() {
  return (
    <main className="space-y-5">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Resume profiles
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-700 sm:text-lg">
          Manage reusable structured skill profiles for future analyses.
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Profiles store structured skills and notes—not raw résumé text.
        </p>
      </header>

      <ResumeProfilesPanel />
    </main>
  );
}
