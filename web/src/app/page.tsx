import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
            Future hosted product
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Compare resume skills against internship and co-op postings
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Internship Fit &amp; Skill-Gap Analyzer helps you see which skills your
            resume already covers, which skills a posting expects, and where the
            gaps are—so you can focus your learning and applications with clearer
            priorities.
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
                Save analyses in a future account-based dashboard with private,
                cloud-backed history
              </span>
            </li>
          </ul>

          <Show when="signed-out">
            <div className="mt-8 rounded-xl border border-sky-200 bg-sky-50 p-5">
              <p className="font-medium text-sky-950">
                Create an account to explore the auth shell
              </p>
              <p className="mt-2 text-sm text-sky-900/80">
                Sign in or sign up to reach the protected dashboard placeholder.
                Analysis and cloud saving are not live yet.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/sign-in"
                  className="rounded-md border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-medium text-emerald-950">You are signed in</p>
              <p className="mt-2 text-sm text-emerald-900/80">
                Open the dashboard to see placeholder account sections. Real saved
                analyses and cloud history will arrive in later branches.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Go to dashboard
              </Link>
            </div>
          </Show>
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
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-xl font-semibold text-amber-950">Current status</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-amber-950/90">
            <li>
              <strong className="font-medium">Auth shell is live.</strong> Clerk
              sign-in, sign-up, and a protected dashboard route are wired in this
              Next.js app.
            </li>
            <li>
              <strong className="font-medium">The working analyzer lives elsewhere.</strong>{" "}
              The rule-based Python CLI and local Streamlit UI in the repository
              root remain the functional tools for running analyses today.
            </li>
            <li>
              <strong className="font-medium">Database and API integration come later.</strong>{" "}
              Postgres/Supabase-style persistence and a Python analysis service
              are not implemented on this branch.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-semibold text-zinc-900">
            Future hosted architecture
          </h3>
          <p className="mt-2 text-zinc-600">
            Target shape for the full product (planned, not fully implemented):
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Next.js frontend",
                body: "This folder—the public-facing app and account dashboard UI.",
                status: "In progress (scaffold + auth shell)",
              },
              {
                title: "Clerk-style authentication",
                body: "Sign-in, sessions, and per-user access control for private data.",
                status: "Auth shell on this branch",
              },
              {
                title: "Postgres / Supabase-style database",
                body: "Cloud-backed storage for saved analyses and user-scoped history.",
                status: "Not started",
              },
              {
                title: "Python analysis service",
                body: "Reuses the existing rule-based analyzer logic via a dedicated API layer.",
                status: "Not started",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <p className="font-medium text-zinc-900">{item.title}</p>
                <p className="mt-1 text-zinc-600">{item.body}</p>
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  {item.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white py-6">
        <p className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          Internship Fit &amp; Skill-Gap Analyzer — hosted web scaffold with Clerk
          auth shell. Cloud persistence and analysis API are not live yet.
        </p>
      </footer>
    </div>
  );
}
