import { Show } from "@clerk/nextjs";
import Link from "next/link";
import {
  DeploymentStatusSection,
  HostedPrototypeNotice,
} from "@/components/hosted-prototype-info";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
            Hosted prototype
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
                Save structured analysis results in a cloud-backed dashboard
                (skills and metadata — not raw resume text)
              </span>
            </li>
          </ul>

          <Show when="signed-out">
            <div className="mt-8 rounded-xl border border-sky-200 bg-sky-50 p-5">
              <p className="font-medium text-sky-950">
                Create an account to explore the auth shell
              </p>
              <p className="mt-2 text-sm text-sky-900/80">
                Sign in or sign up to open the dashboard prototype. Use generic
                sample text only — not sensitive resumes.
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
                Open the dashboard to run hosted rule-based analysis and optional
                prototype cloud save. This is not production-secure SaaS yet.
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

        <div className="mt-8 space-y-6">
          <HostedPrototypeNotice />
          <DeploymentStatusSection />
        </div>

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

        <section className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="text-xl font-semibold text-zinc-900">Also available locally</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            The rule-based Python <strong>CLI</strong> and <strong>Streamlit</strong> app
            in the repository root remain the full-featured local tools (SQLite history,
            uploads, exports). The hosted web path is a separate prototype surface.
          </p>
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white py-6">
        <p className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          Internship Fit &amp; Skill-Gap Analyzer — hosted prototype (Vercel +
          Render + Supabase + Clerk). Not production-secure SaaS.
        </p>
      </footer>
    </div>
  );
}
