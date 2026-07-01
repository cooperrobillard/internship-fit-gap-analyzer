import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { absoluteSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy & data controls",
  description:
    "Current data-handling summary, user controls, and limitations for the rule-based job-fit analyzer public beta.",
  alternates: {
    canonical: absoluteSiteUrl("/privacy"),
  },
  openGraph: {
    url: absoluteSiteUrl("/privacy"),
  },
};

const navItems = [
  ["#summary", "Summary"],
  ["#transient-inputs", "Analysis inputs"],
  ["#saved-analyses", "Saved analyses"],
  ["#resume-profiles", "Resume profiles"],
  ["#controls", "Controls"],
  ["#limitations", "Limitations"],
  ["#service-providers", "Technical path"],
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 border-t border-[var(--color-divider)] pt-8 sm:pt-10"
    >
      <h2
        id={`${id}-heading`}
        className="text-2xl font-semibold tracking-tight text-[var(--color-text)]"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
        {children}
      </div>
    </section>
  );
}

function BulletList({ children }: { children: ReactNode }) {
  return (
    <ul className="space-y-2 pl-5 text-sm leading-7 text-[var(--color-text-muted)] marker:text-[var(--color-primary)] sm:text-base">
      {children}
    </ul>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-xs text-[var(--color-text)]">
      {children}
    </code>
  );
}

export default function PrivacyPage() {
  return (
    <main className="app-shell-container flex-1 py-10 sm:py-14 lg:py-16">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl">
          Privacy &amp; data controls
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
          How analysis inputs, optional saved records, and current user controls
          work in this limited public beta.
        </p>
      </header>

      <section
        aria-labelledby="at-a-glance-heading"
        className="mt-10 max-w-3xl border-y border-[var(--color-divider)] py-5"
      >
        <h2
          id="at-a-glance-heading"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          At a glance
        </h2>
        <dl className="mt-4 divide-y divide-[var(--color-divider)] text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
          <div className="py-3 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-5">
            <dt className="font-semibold text-[var(--color-text)]">
              Current request
            </dt>
            <dd className="mt-1 sm:mt-0">
              Analysis text is used for the current request.
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-5">
            <dt className="font-semibold text-[var(--color-text)]">Saving</dt>
            <dd className="mt-1 sm:mt-0">
              Running an analysis does not automatically save it.
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-[12rem_1fr] sm:gap-5">
            <dt className="font-semibold text-[var(--color-text)]">
              Saved records
            </dt>
            <dd className="mt-1 sm:mt-0">
              Optional saves contain structured skills and metadata.
            </dd>
          </div>
        </dl>
        <div className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
          <p>
            Platform or service logging cannot be guaranteed absent. Avoid
            unusually sensitive information.
          </p>
          <p>
            This page is a product data-handling summary, not a formal legal
            privacy policy, compliance certification, security audit, or
            penetration-test report.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-9 lg:grid-cols-[12rem_minmax(0,46rem)] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <nav aria-label="Privacy page sections">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              On this page
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 lg:block lg:space-y-2">
              {navItems.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-9 items-center text-sm font-semibold text-[var(--color-text-muted)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 space-y-10">
          <Section id="summary" title="Plain-language summary">
            <p>
              Job Fit &amp; Skill-Gap Analyzer uses rule-based matching with a
              curated cross-domain skill taxonomy and reviewed aliases rather
              than semantic AI.
            </p>
            <p>
              Analysis compares résumé information or a structured profile with
              a job description, and input text is used to produce the current
              response.
            </p>
            <p>
              Optional saved records are structured: saved analyses hold skills,
              categories, counts, and job metadata, while resume profiles hold
              profile metadata and skill lists.
            </p>
            <p>
              Platform or service logging cannot be guaranteed absent, so avoid
              unusually sensitive information.
            </p>
          </Section>

          <Section id="transient-inputs" title="Analysis inputs">
            <p>
              Pasted résumé and job-description text is used to produce the
              current analysis response. Plain <InlineCode>.txt</InlineCode>{" "}
              uploads are read as transient convenience inputs.
            </p>
            <p>
              Uploaded files are not stored as files by the application. Running
              an analysis does not automatically save the result.
            </p>
            <p>
              Unsaved results remain part of the current workflow rather than
              becoming an account record in the application save path.
            </p>
          </Section>

          <Section id="saved-analyses" title="Saved analyses">
            <p>
              When you explicitly save an analysis, the account-owned structured
              record may contain:
            </p>
            <BulletList>
              <li>job title, company, source URL, and notes;</li>
              <li>counts and timestamps;</li>
              <li>matched skills and categories;</li>
              <li>missing skills and categories; and</li>
              <li>data used to derive recurring gaps.</li>
            </BulletList>
            <p>
              Saved records are associated with the signed-in account. Clerk
              identity and Supabase row-level security are used for account
              scoping, but this is not an absolute-security guarantee.
            </p>
          </Section>

          <Section id="resume-profiles" title="Resume profiles">
            <p>
              Resume profiles are structured skill sets rather than full résumé
              documents; they do not provide full résumé parsing, PDF or DOCX
              parsing, or AI extraction. They may contain profile name, optional
              description or notes, extracted skill names, user-added skill
              names, source type, and timestamps.
            </p>
            <p>
              Raw résumé body text is not part of the structured profile.
              Transient <InlineCode>.txt</InlineCode> uploads are not
              automatically saved as profiles.
            </p>
            <p>
              Selecting a profile creates temporary structured analysis input
              from profile metadata and skill lists for the current comparison.
            </p>
          </Section>

          <Section id="controls" title="Your controls">
            <BulletList>
              <li>Run an analysis without saving it.</li>
              <li>Clear transient browser inputs.</li>
              <li>
                Review individual saved analyses, with older analyses available
                through manual progressive loading.
              </li>
              <li>
                Delete individual saved analyses, or delete selected checked
                loaded saved analyses after explicit confirmation.
              </li>
              <li>Create, edit, and delete profiles.</li>
              <li>
                Use supported exports for individual saved analyses, selected
                checked loaded saved analyses, currently loaded saved analyses,
                comparisons, and recurring-gap views where export or download
                controls are available.
              </li>
            </BulletList>
          </Section>

          <Section id="limitations" title="Current limitations">
            <BulletList>
              <li>The taxonomy is broad but not exhaustive.</li>
              <li>
                Differently worded skills may be missed when they do not match
                explicit recognized phrases or reviewed aliases.
              </li>
              <li>
                Phrase detection does not prove proficiency, evidence strength,
                or hiring fit.
              </li>
              <li>Human interpretation remains necessary.</li>
              <li>
                Selected deletion and selected export apply only to checked
                analyses in the current loaded result set; unloaded records are
                not included.
              </li>
              <li>No account-wide export or export-all control.</li>
              <li>
                No account-wide select-all or one-click delete-all control.
              </li>
              <li>No automated retention schedule.</li>
              <li>No restore flow or undo flow.</li>
              <li>No profile export.</li>
              <li>
                Deleting a Clerk account is not claimed to automatically delete
                Supabase rows.
              </li>
              <li>
                No formal legal privacy-policy review, penetration test, or
                comprehensive security audit has been completed.
              </li>
              <li>No absolute privacy or security guarantee is provided.</li>
            </BulletList>
            <p>
              The current product is a limited public beta and portfolio
              application for rule-based planning, saved structured results, and
              recurring-gap review.
            </p>
          </Section>

          <Section id="service-providers" title="Service providers">
            <details className="group border-y border-[var(--color-divider)] py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] [&::-webkit-details-marker]:hidden">
                <span>Technical data path</span>
                <span
                  aria-hidden="true"
                  className="text-sm text-[var(--color-text-muted)] group-open:hidden"
                >
                  Show
                </span>
                <span
                  aria-hidden="true"
                  className="hidden text-sm text-[var(--color-text-muted)] group-open:inline"
                >
                  Hide
                </span>
              </summary>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
                <p>
                  At a high level, Vercel hosts the Next.js web application and
                  analysis proxy; Render runs the FastAPI rule-based analysis
                  service; Clerk provides authentication; and Supabase stores
                  structured account-owned records.
                </p>
                <p>
                  A June 22, 2026 two-user human verification checked
                  saved-analysis isolation for the then-current saved-analysis
                  schema and UI. That verification was point-in-time and does
                  not create an ongoing guarantee.
                </p>
                <p>
                  This provider summary and verification do not create
                  contractual, geographic, encryption, retention, legal,
                  compliance, or absolute-security guarantees.
                </p>
              </div>
            </details>
          </Section>
        </article>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
        >
          Open workspace
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
