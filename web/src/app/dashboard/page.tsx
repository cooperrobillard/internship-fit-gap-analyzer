import { auth } from "@clerk/nextjs/server";

const placeholderCards = [
  {
    title: "Saved analyses",
    body: "Future home for your private, cloud-backed analysis history. Not connected yet.",
  },
  {
    title: "Resume profiles",
    body: "Future place to manage resume versions used for comparisons. Not implemented yet.",
  },
  {
    title: "Skill gaps",
    body: "Future view of matched and missing skills across saved runs. No live analysis here yet.",
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
          You are signed in{userId ? ` (user ${userId.slice(0, 8)}…)` : ""}. This
          page is a protected placeholder for the hosted product. It does not run
          analyses, save postings to the cloud, or load data from a database yet.
        </p>
        <p className="mt-4 text-sm text-amber-800">
          For real analyses today, use the Python CLI and local Streamlit app in
          the repository root.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900">Coming soon</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Placeholder cards only—no persistence or analysis behind these yet.
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
