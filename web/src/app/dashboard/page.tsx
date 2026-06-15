import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DashboardInteractiveSection } from "@/components/dashboard-interactive-section";
import { HostedPrototypeNotice } from "@/components/hosted-prototype-info";

const placeholderCards = [
  {
    title: "Saved analyses",
    body: "Select a saved row to open metadata and matched/missing skill lists in the detail panel below the list.",
  },
  {
    title: "Resume profiles",
    body: "Future: manage resume versions for comparisons. Not available yet.",
  },
  {
    title: "Recurring gaps",
    body: "Hosted dashboard shows recurring missing skills from saved analyses. Full stats and exports remain richer in the local CLI and Streamlit app.",
  },
  {
    title: "Job tracker",
    body: "Future: lightweight tracker for postings and application status.",
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Job Fit &amp; Skill-Gap Analyzer
        </h1>
        <p className="mt-2 text-lg text-zinc-700">
          Compare one resume to one job posting
        </p>
        <p className="mt-4 max-w-2xl text-zinc-600">
          {userId
            ? "Paste or upload plain .txt text below, run a rule-based analysis, and optionally save structured results to your account."
            : "Sign in to run analysis and save structured results."}{" "}
          Analysis does not save until you choose Save—and cloud save stores skills and
          job metadata only, not resume or job body text. Uploaded .txt files are read in
          your browser only.
        </p>

        <div className="mt-6">
          <HostedPrototypeNotice />
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">Privacy &amp; data controls</p>
          <p className="mt-1 text-zinc-600">
            Learn what this prototype saves, what it does not intentionally save, and
            how to delete or export your structured saved analyses.
          </p>
          <Link
            href="/privacy"
            className="mt-2 inline-block font-medium text-sky-800 underline hover:text-sky-900"
          >
            Read privacy &amp; data controls
          </Link>
        </div>

        <DashboardInteractiveSection />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900">Coming later</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Placeholder areas for future dashboard features. Analysis and cloud save
          work today.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {placeholderCards.map((card) => (
            <li
              key={card.title}
              className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5"
            >
              <h3 className="font-medium text-zinc-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {card.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
