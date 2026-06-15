import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { HostedPrototypeNotice } from "@/components/hosted-prototype-info";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
            Hosted prototype
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Compare resume skills against internship and job postings
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Paste resume text and a job description to see which skills you already
            show, which skills the posting expects, and where the gaps are. Matching
            is <strong>rule-based</strong> (keyword taxonomy)—not AI—and this
            deployment is a <strong>demo prototype</strong>, not production software.
          </p>
          <ul className="mt-6 space-y-2 text-zinc-700">
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>Matched and missing skills for each comparison</span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>Optional cloud save of skills and job metadata (not raw resume text)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-600" aria-hidden="true">
                •
              </span>
              <span>Sign-in so your saved analyses stay private to your account</span>
            </li>
          </ul>

          <Show when="signed-out">
            <div className="mt-8 rounded-xl border border-sky-200 bg-sky-50 p-5">
              <p className="font-medium text-sky-950">Try the dashboard</p>
              <p className="mt-2 text-sm text-sky-900/80">
                Sign in or create an account to run a comparison and optionally save
                results.
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
                Open the dashboard to paste sample-safe text, run analysis, and
                optionally save structured results.
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

        <div className="mt-8">
          <HostedPrototypeNotice />
        </div>

        <p className="mt-6 text-sm text-zinc-600">
          <Link
            href="/privacy"
            className="font-medium text-sky-800 underline hover:text-sky-900"
          >
            Privacy &amp; data controls
          </Link>
          {" — "}
          what the hosted prototype saves, what it does not save, and your current
          controls.
        </p>

        <section className="mt-10">
          <h3 className="text-xl font-semibold text-zinc-900">How it works</h3>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                step: "1",
                title: "Paste resume text",
                body: "Add the skills and experience you want to compare—use generic sample text in this prototype.",
              },
              {
                step: "2",
                title: "Paste a job description",
                body: "Add an internship or co-op posting to compare against your resume.",
              },
              {
                step: "3",
                title: "Review gaps",
                body: "See matched skills, missing skills, and a short summary from the rule-based analyzer.",
              },
              {
                step: "4",
                title: "Save optional results",
                body: "Store skills and metadata in your account to revisit later (not full resume or job body text).",
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
            The Python <strong>CLI</strong> and <strong>Streamlit</strong> app in
            this repository offer the full offline workflow—SQLite history, file
            uploads, and exports. The hosted dashboard is a separate demo surface.
          </p>
        </section>
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white py-6">
        <p className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          Job Fit &amp; Skill-Gap Analyzer — hosted prototype. Not production-ready
          SaaS.{" "}
          <Link href="/privacy" className="text-sky-700 underline hover:text-sky-800">
            Privacy &amp; data controls
          </Link>
        </p>
      </footer>
    </div>
  );
}
