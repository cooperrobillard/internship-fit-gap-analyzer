import Link from "next/link";

export const metadata = {
  title: "Privacy & data controls — Job Fit & Skill-Gap Analyzer",
  description:
    "What the hosted Job Fit & Skill-Gap Analyzer prototype saves, what it does not save, and your current data controls.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
          Privacy &amp; data controls
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Job Fit &amp; Skill-Gap Analyzer
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          This page explains how the <strong>hosted prototype</strong> handles your
          data today. It is <strong>not</strong> a formal legal privacy policy. The app
          is still evolving toward a broader public launch and has not completed a full
          production or security audit.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          What this prototype saves
        </h2>
        <p className="mt-3 text-zinc-600">
          When you choose to save an analysis to your account, the app stores{" "}
          <strong>structured results and metadata</strong> tied to your sign-in. Saved
          analyses may include:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <li className="flex gap-2">
            <span className="text-sky-600" aria-hidden="true">
              •
            </span>
            <span>Job title, company, source URL, and optional notes you enter</span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-600" aria-hidden="true">
              •
            </span>
            <span>Saved date and summary counts (matched and missing skills)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-600" aria-hidden="true">
              •
            </span>
            <span>Matched skills and missing skills (skill name and category)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-600" aria-hidden="true">
              •
            </span>
            <span>
              Recurring gap statistics derived from your saved missing skills across
              postings
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          Saved data is scoped to your account through authentication and database row
          permissions so other signed-in users should not see your rows.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          What this prototype does not intentionally save
        </h2>
        <p className="mt-3 text-zinc-600">
          The current saved-analysis model is <strong>structured-results-first</strong>.
          When you save from the hosted dashboard, the app does{" "}
          <strong>not intentionally persist</strong>:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden="true">
              •
            </span>
            <span>Raw pasted resume text</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden="true">
              •
            </span>
            <span>
              Uploaded resume files (plain .txt is read in your browser for convenience
              only—not stored as a file or profile)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden="true">
              •
            </span>
            <span>Raw pasted job-description text</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden="true">
              •
            </span>
            <span>
              Uploaded job-description files (plain .txt is read in your browser for
              convenience only—not stored as a file)
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          Analysis still requires resume and job text in the browser for a one-time
          comparison (paste or optional plain <code className="text-xs">.txt</code>{" "}
          upload). That text is sent through the hosted app to run the rule-based
          analyzer, but the <strong>save path stores structured output and labels</strong>,
          not the full resume or job bodies. Uploaded files are not kept on the server as
          files. We cannot guarantee that no platform logging exists anywhere in the
          stack—only that the product&apos;s saved-data design does not intentionally
          store raw resume or job-description text.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">How analysis works</h2>
        <ol className="mt-4 space-y-3 text-zinc-700">
          <li className="flex gap-3">
            <span className="font-medium text-sky-800">1.</span>
            <span>
              You paste or upload plain <code className="text-xs">.txt</code> resume and
              job text in the dashboard (use generic sample text in this prototype when
              possible).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-sky-800">2.</span>
            <span>
              The hosted web app sends the request to the analysis backend and returns
              matched skills, missing skills, and a short summary.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-sky-800">3.</span>
            <span>
              If you click save, only structured results and the metadata fields you
              provided are written to your account&apos;s cloud storage.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-sky-800">4.</span>
            <span>
              Matching is <strong>rule-based</strong> (keyword taxonomy and aliases)—not
              a full AI or semantic judgment engine. Treat results as planning aids, not
              hiring decisions.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Your current controls</h2>
        <p className="mt-3 text-zinc-700">Today you can:</p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden="true">
              •
            </span>
            <span>
              <strong>Choose not to save</strong> — run analysis without storing anything
              to your account
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden="true">
              •
            </span>
            <span>
              <strong>Review saved details</strong> — open a saved analysis to see
              metadata and skill lists before relying on it
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden="true">
              •
            </span>
            <span>
              <strong>Delete individual saved analyses</strong> — remove a saved row and
              its related skill data from your account (with confirmation in the
              dashboard)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden="true">
              •
            </span>
            <span>
              <strong>Export structured data</strong> — download saved analyses,
              recurring gap stats, or comparisons as Markdown or CSV from the dashboard
              (structured fields only)
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          Exports and deletes apply to data stored in your account. They do not change
          how a one-time analysis request is processed in memory.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">
          Before broader public launch
        </h2>
        <p className="mt-3 text-zinc-600">
          A wider public release should still include work such as:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <li className="flex gap-2">
            <span className="text-zinc-500" aria-hidden="true">
              •
            </span>
            <span>Stronger production-readiness and privacy/security review</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-500" aria-hidden="true">
              •
            </span>
            <span>Rate limiting and abuse protection for hosted analysis</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-500" aria-hidden="true">
              •
            </span>
            <span>Another pass on user isolation and account data permissions</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-500" aria-hidden="true">
              •
            </span>
            <span>Clearer policy and legal copy if this becomes a public service</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-500" aria-hidden="true">
              •
            </span>
            <span>
              Careful review before adding persistent resume profiles or storing resume
              content in the cloud
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          This prototype is useful for learning and portfolio demos, but it is not yet
          positioned as finished production SaaS.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
