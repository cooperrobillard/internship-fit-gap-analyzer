import { auth } from "@clerk/nextjs/server";
import { DashboardInteractiveSection } from "@/components/dashboard-interactive-section";
import { HostedPrototypeNotice } from "@/components/hosted-prototype-info";

const placeholderCards = [
  {
    title: "Saved analyses",
    body: "Your saved rows appear below after you run analysis and save, or use the test save.",
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
          Compare resume to job posting
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          {userId
            ? "Paste sample-safe text below, run analysis, and optionally save structured results to your account."
            : "Sign in to run analysis and save results."}{" "}
          Cloud save stores skills and job metadata only—not full resume or job body
          text.
        </p>

        <div className="mt-6">
          <HostedPrototypeNotice />
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
