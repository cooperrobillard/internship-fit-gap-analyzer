import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & data controls",
  description:
    "Current data-handling summary, user controls, and limitations for the rule-based job-fit analyzer public beta.",
};

const navItems = [
  ["#summary", "Summary"],
  ["#transient-inputs", "Transient inputs"],
  ["#saved-analyses", "Saved analyses"],
  ["#resume-profiles", "Resume profiles"],
  ["#service-providers", "Service providers"],
  ["#controls", "Controls"],
  ["#limitations", "Limitations"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 border-t border-[var(--color-divider)] pt-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-heading`} className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">{children}</div>
    </section>
  );
}

function BulletList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 pl-5 text-sm leading-7 text-[var(--color-text-muted)] marker:text-[var(--color-primary)] sm:text-base">{children}</ul>;
}

export default function PrivacyPage() {
  return (
    <main className="app-shell-container flex-1 py-10 sm:py-14">
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent-warm)]">Limited public beta</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
          Privacy &amp; data controls
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
          A plain-language summary of what the app processes, what optional saves contain, what controls exist today, and what limitations still apply before broader launch claims.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <nav aria-label="Privacy page sections" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">On this page</p>
            <ul className="mt-3 space-y-1">
              {navItems.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-10 items-center rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="space-y-10">
            <Section id="summary" title="Plain-language summary">
              <p>The analyzer is rule-based, not AI. It uses skill taxonomy and alias matching to compare resume information or a structured profile with a job description.</p>
              <p>Pasted or uploaded resume and job text is processed for the request. The application save path does not intentionally persist raw resume body text or raw job-description body text.</p>
              <p>Optional saved analyses contain structured results and metadata. Structured resume profiles contain profile metadata and skill lists rather than raw resume body text.</p>
              <p>Platform or service logging cannot be guaranteed absent. Avoid unusually sensitive content, especially in a limited public beta.</p>
              <p>This page is not a formal legal privacy policy, compliance certification, security audit, or penetration-test report.</p>
            </Section>

            <Section id="transient-inputs" title="Transient analysis inputs">
              <p>Pasted text and transient <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-xs">.txt</code> uploads are used to produce the current analysis response. Uploaded files are not saved as files by the app.</p>
              <p>Running analysis does not automatically save results. If you do not choose to save, the dashboard displays the result for the current session workflow only.</p>
            </Section>

            <Section id="saved-analyses" title="Structured saved analyses">
              <p>When you choose to save an analysis, the app stores structured records tied to your signed-in account. Saved analyses may include:</p>
              <BulletList>
                <li>job title, company, source URL, and notes;</li>
                <li>counts and timestamps;</li>
                <li>matched skills and categories;</li>
                <li>missing skills and categories; and</li>
                <li>derived recurring-gap information.</li>
              </BulletList>
              <p>Saved records are account-owned through Clerk identity and Supabase row-level security. That is an important boundary, but it is not an absolute-security guarantee. A June 22, 2026 two-user human verification checked saved-analysis isolation for the then-current schema and UI.</p>
            </Section>

            <Section id="resume-profiles" title="Structured resume profiles">
              <p>Structured profiles may contain profile name, optional description or notes, extracted skill names, user-added skill names, source type, and timestamps.</p>
              <p>No raw resume body text is stored in the structured profile. Transient <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-xs">.txt</code> uploads are not automatically saved as profiles.</p>
              <p>When you explicitly select a saved profile for analysis, the app constructs temporary input from profile metadata and skill lists. This is not full resume parsing, PDF/DOCX parsing, AI extraction, or semantic matching.</p>
            </Section>

            <Section id="service-providers" title="Service providers and data path">
              <p>At a high level, Vercel hosts the Next.js web application and analysis proxy, Render runs the FastAPI rule-based analysis service, Clerk provides authentication surfaces, and Supabase stores user-owned structured saved records.</p>
              <p>This provider summary does not make contractual, geographic, encryption, retention, legal, compliance, or absolute-security claims.</p>
            </Section>

            <Section id="controls" title="Current user controls">
              <BulletList>
                <li>Run an analysis without saving it.</li>
                <li>Clear transient pasted or uploaded browser inputs.</li>
                <li>Review and delete individual saved analyses.</li>
                <li>Create, edit, and delete structured resume profiles.</li>
                <li>Export supported saved-analysis, comparison, or recurring-gap views where the dashboard provides export/download controls.</li>
              </BulletList>
            </Section>

            <Section id="limitations" title="Current limitations">
              <BulletList>
                <li>No account-wide export or one-click delete-all control.</li>
                <li>No automated retention schedule, restore flow, or undo flow.</li>
                <li>No profile export control.</li>
                <li>Deleting a Clerk account is not claimed to automatically delete Supabase rows.</li>
                <li>No formal legal privacy-policy review, penetration test, or comprehensive security audit has been completed.</li>
                <li>No absolute privacy or security guarantee is provided.</li>
              </BulletList>
            </Section>

            <section aria-labelledby="beta-heading" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-6">
              <h2 id="beta-heading" className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">Limited-public-beta positioning</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">The current product is a limited public beta and portfolio application. It is useful for rule-based planning, saved structured results, and recurring-gap review, while final production launch verification remains a human release step.</p>
            </section>
          </div>
        </article>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]">
          Open dashboard
        </Link>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]">
          Back to home
        </Link>
      </div>
    </main>
  );
}
