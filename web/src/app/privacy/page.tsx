import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy & data controls — Job Fit & Skill-Gap Analyzer",
  description:
    "What the hosted Job Fit & Skill-Gap Analyzer prototype saves, what it does not save, and your current data controls.",
};

const bulletClass = "flex gap-2";

function Bullet({ children, tone = "sky" }: { children: ReactNode; tone?: "sky" | "amber" | "emerald" | "zinc" }) {
  const color = {
    sky: "text-sky-600",
    amber: "text-amber-600",
    emerald: "text-emerald-700",
    zinc: "text-zinc-500",
  }[tone];

  return (
    <li className={bulletClass}>
      <span className={color} aria-hidden="true">
        •
      </span>
      <span>{children}</span>
    </li>
  );
}

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
          data today. It is <strong>not</strong> a formal legal privacy policy,
          compliance sign-off, penetration test, or comprehensive security audit.
          The analyzer is rule-based, not AI, and results are planning aids rather
          than hiring decisions.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Hosted service roles</h2>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <Bullet>Vercel hosts the Next.js web application and analysis proxy.</Bullet>
          <Bullet>Render runs the rule-based FastAPI analysis service.</Bullet>
          <Bullet>Clerk handles sign-in and dashboard route protection.</Bullet>
          <Bullet>Supabase stores user-owned structured saved records with row-level security.</Bullet>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          These roles describe the current implementation at a high level. This page
          does not make contractual, geographic, retention, encryption, compliance,
          or absolute-security claims.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Saved analyses</h2>
        <p className="mt-3 text-zinc-600">
          When you choose to save an analysis, the app stores structured results and
          metadata tied to your signed-in account. Saved analyses may contain:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <Bullet>Job title, company, source URL, and optional notes you enter.</Bullet>
          <Bullet>Timestamps and summary counts.</Bullet>
          <Bullet>Matched skill names and categories.</Bullet>
          <Bullet>Missing skill names and categories.</Bullet>
          <Bullet>Derived recurring-gap information across your saved analyses.</Bullet>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          Saved-analysis data is scoped to your account through Clerk identity and
          Supabase row-level security. Human production checks on June 22, 2026
          confirmed two-user saved-analysis isolation for the current schema and UI.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          Saved structured resume profiles
        </h2>
        <p className="mt-3 text-zinc-600">
          Saved profiles are structured-skills-first. A saved profile may contain:
        </p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <Bullet>Profile name.</Bullet>
          <Bullet>Optional profile description or notes.</Bullet>
          <Bullet>Extracted skill names.</Bullet>
          <Bullet>User-added skill names.</Bullet>
          <Bullet>Source type and timestamps.</Bullet>
        </ul>
        <p className="mt-4 text-zinc-600">
          Structured profiles do <strong>not</strong> store raw resume body text.
          Transient <code className="text-xs">.txt</code> uploads are not
          automatically turned into saved profiles. When you explicitly select a saved
          profile for analysis, the app constructs temporary structured analysis input
          from the profile name, notes, and skill lists. That handoff is not full
          resume parsing and is not raw resume storage.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Transient analysis inputs</h2>
        <p className="mt-3 text-zinc-600">
          Pasted or uploaded resume and job text are sent through the hosted Vercel
          application to the Render analysis backend for that request. The product save
          path does not intentionally persist raw resume text or raw job-description
          text, and uploaded files are not saved as files.
        </p>
        <p className="mt-4 text-zinc-600">
          Platform or service logging cannot be guaranteed absent in this
          prototype/public-beta scope. Avoid unusually sensitive content and prefer
          fictional or minimized sample text for demos.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Your current controls</h2>
        <p className="mt-3 text-zinc-700">Today you can:</p>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <Bullet tone="emerald">Run analysis without saving it to your account.</Bullet>
          <Bullet tone="emerald">Review and delete individual saved analyses.</Bullet>
          <Bullet tone="emerald">Create, edit, and delete structured resume profiles.</Bullet>
          <Bullet tone="emerald">Export saved-analysis data and derived reports where the dashboard currently supports export/download.</Bullet>
          <Bullet tone="emerald">Clear transient pasted/uploaded inputs in the browser.</Bullet>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Current limitations</h2>
        <ul className="mt-4 space-y-2 text-zinc-700">
          <Bullet tone="amber">No one-click account-wide export.</Bullet>
          <Bullet tone="amber">No one-click delete-all control.</Bullet>
          <Bullet tone="amber">No automated retention schedule.</Bullet>
          <Bullet tone="amber">No profile export control is currently provided.</Bullet>
          <Bullet tone="amber">Deleting a Clerk account is not claimed here to automatically delete Supabase records.</Bullet>
          <Bullet tone="amber">Deleted rows do not have a restore or undo flow.</Bullet>
          <Bullet tone="amber">No formal penetration test, comprehensive security audit, or legal privacy-policy review has been completed.</Bullet>
          <Bullet tone="amber">This is not mature production SaaS and does not guarantee absolute security.</Bullet>
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Public-beta positioning</h2>
        <p className="mt-3 text-zinc-600">
          The current hardening pass added and verified basic public-beta safeguards,
          including user isolation checks and abuse controls for the analysis route.
          Those checks reduce risk for a limited portfolio/public-beta release, but
          they do not make the product a mature production service.
        </p>
        <p className="mt-4 text-sm text-zinc-600">
          Future storage, schema, authentication, provider, or data-control changes
          should be re-reviewed before broader launch claims are made.
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
