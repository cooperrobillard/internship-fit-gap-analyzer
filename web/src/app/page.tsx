export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-sky-700">Hosted web app (scaffold)</p>
            <h1 className="text-lg font-semibold tracking-tight">
              Internship Fit &amp; Skill-Gap Analyzer
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500"
              aria-disabled="true"
            >
              Auth coming soon
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500"
              aria-disabled="true"
            >
              Dashboard coming soon
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
            Future hosted product
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Compare resume skills against internship and co-op postings
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Internship Fit &amp; Skill-Gap Analyzer helps you see which skills your resume
            already covers, which skills a posting expects, and where the gaps are—so you
            can focus your learning and applications with clearer priorities.
          </p>
          <ul className="mt-6 space-y-2 text-zinc-700">
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>Identify matched skills and missing skills per posting</span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>Spot recurring gaps across multiple internship descriptions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>
                Save analyses in a future account-based dashboard with private, cloud-backed
                history
              </span>
            </li>
          </ul>
          <p className="mt-6 text-sm text-zinc-500">
            Future direction: user accounts, private saved analyses, and persistent history
            backed by a cloud database—not available in this scaffold yet.
          </p>
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-semibold text-zinc-900">Product flow</h3>
          <p className="mt-2 text-zinc-600">
            Planned experience for the hosted version:
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                step: "1",
                title: "Add resume",
                body: "Paste or upload resume text so the analyzer knows which skills you already show.",
              },
              {
                step: "2",
                title: "Add job posting",
                body: "Provide an internship or co-op description to compare against your resume.",
              },
              {
                step: "3",
                title: "Review skill gaps",
                body: "See matched skills, missing skills, and recurring gaps across postings.",
              },
              {
                step: "4",
                title: "Save and compare analyses",
                body: "Keep a private history, revisit postings, and compare runs over time.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">
                  {item.step}
                </span>
                <h4 className="mt-3 font-medium text-zinc-900">{item.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-xl font-semibold text-amber-950">Current status</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-amber-950/90">
            <li>
              <strong className="font-medium">This web app is an early scaffold.</strong>{" "}
              It introduces the future hosted product shell only—no analysis, auth, or
              database wiring yet.
            </li>
            <li>
              <strong className="font-medium">The working analyzer lives elsewhere.</strong>{" "}
              The rule-based Python CLI and local Streamlit UI in the repository root are
              the current functional tools for running analyses today.
            </li>
            <li>
              <strong className="font-medium">Integration comes later.</strong>{" "}
              Authentication, Postgres/Supabase-style persistence, and a Python analysis
              API will be added in future branches—not on this scaffold step.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-semibold text-zinc-900">
            Future hosted architecture
          </h3>
          <p className="mt-2 text-zinc-600">
            Target shape for the full product (planned, not implemented):
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Next.js frontend",
                body: "This folder—the public-facing app and account dashboard UI.",
              },
              {
                title: "Clerk-style authentication",
                body: "Sign-in, sessions, and per-user access control for private data.",
              },
              {
                title: "Postgres / Supabase-style database",
                body: "Cloud-backed storage for saved analyses and user-scoped history.",
              },
              {
                title: "Python analysis service",
                body: "Reuses the existing rule-based analyzer logic via a dedicated API layer.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <p className="font-medium text-zinc-900">{item.title}</p>
                <p className="mt-1 text-zinc-600">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white py-6">
        <p className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          Internship Fit &amp; Skill-Gap Analyzer — hosted web scaffold. Analysis,
          accounts, and cloud persistence are not live on this page yet.
        </p>
      </footer>
    </div>
  );
}
