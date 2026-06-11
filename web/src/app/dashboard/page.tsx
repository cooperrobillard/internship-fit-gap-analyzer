import { auth } from "@clerk/nextjs/server";
import { DashboardInteractiveSection } from "@/components/dashboard-interactive-section";

const placeholderCards = [
  {
    title: "Saved analyses",
    body: "Cloud read model lists job_analyses metadata. Prototype analysis save and test cloud save both write structured rows.",
  },
  {
    title: "Resume profiles",
    body: "Future place to manage resume versions used for comparisons. Not implemented yet.",
  },
  {
    title: "Skill gaps",
    body: "Web analysis prototype shows matched/missing skills from pasted text and can save structured results to Supabase.",
  },
  {
    title: "Job tracker",
    body: "Future lightweight tracker for postings, source links, and notes. Coming later.",
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
          Account dashboard (shell)
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Your future account dashboard
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          You are signed in{userId ? ` (user ${userId.slice(0, 8)}…)` : ""}.
          Clerk authentication is active. You can run a minimal pasted-text web
          analysis prototype (with optional cloud save of structured results),
          verify Supabase connectivity, list saved cloud analyses, and run a
          controlled test cloud save. The full Python analyzer service is not
          connected yet.
        </p>
        <p className="mt-4 text-sm text-amber-800">
          For real analyses today, use the Python CLI and local Streamlit app in
          the repository root.
        </p>

        <DashboardInteractiveSection />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900">Coming soon</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Placeholder cards for future dashboard areas. Web analysis prototype and
          test cloud save exist; full product flows are not complete yet.
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
