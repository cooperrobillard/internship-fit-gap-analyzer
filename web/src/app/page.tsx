import { Show } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingAnalysisPreview } from "@/components/landing-analysis-preview";

const workflowSteps = [
  {
    title: "Add résumé information",
    body: "Paste resume text or choose a structured profile so the analyzer can identify the skills you want to compare.",
  },
  {
    title: "Add a job description",
    body: "Paste the role requirements and optional job metadata such as title, company, notes, or source URL.",
  },
  {
    title: "Review matched and missing skills",
    body: "See skill names and categories the rule-based taxonomy found in both places, plus gaps to investigate.",
  },
  {
    title: "Optionally save and compare",
    body: "Save structured results to revisit details, search history, compare opportunities, export, or spot recurring gaps.",
  },
];

const featureProof = [
  "Reusable structured résumé profiles with extracted and user-added skill names.",
  "Saved analysis history with detail views, search, filtering, and individual delete controls.",
  "Opportunity comparison and recurring-gap information derived from structured saved rows.",
  "Supported exports/downloads for taking structured results into your own planning workflow.",
  "Account-owned saved records designed around skills, counts, metadata, timestamps, and optional notes.",
];

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <main className="flex-1 text-[var(--color-text)]">
      <section className="app-shell-container py-12 sm:py-16 lg:py-20" aria-labelledby="landing-hero-heading">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-bold text-[var(--color-primary)] shadow-sm">
              Limited public beta · Rule-based analysis
            </p>
            <h1
              id="landing-hero-heading"
              className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl lg:text-6xl"
            >
              See what a role asks for—and what your résumé already shows.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)] sm:text-xl">
              Job Fit &amp; Skill-Gap Analyzer compares résumé information or a structured
              profile against a job description, then highlights matched skills, missing
              skills, and structured next steps for career planning.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Show when="signed-out">
                <PrimaryLink href="/sign-up">Start an analysis</PrimaryLink>
                <SecondaryLink href="/sign-in">Sign in</SecondaryLink>
                <Link
                  href="/privacy"
                  className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] sm:ml-1"
                >
                  Review privacy and data controls
                </Link>
              </Show>
              <Show when="signed-in">
                <PrimaryLink href="/dashboard">Open dashboard</PrimaryLink>
                <SecondaryLink href="/privacy">Privacy and data controls</SecondaryLink>
              </Show>
            </div>
          </div>

          <LandingAnalysisPreview />
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/72" aria-labelledby="workflow-heading">
        <div className="app-shell-container py-12 sm:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent-warm)]">
              Workflow
            </p>
            <h2 id="workflow-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              From one role to a clear skill-gap plan
            </h2>
          </div>
          <ol className="mt-8 grid gap-0 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="border-b border-[var(--color-divider)] p-5 md:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
                <span className="text-sm font-black text-[var(--color-primary)]">0{index + 1}</span>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-text)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="app-shell-container py-12 sm:py-16" aria-labelledby="features-heading">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent-warm)]">Why return</p>
            <h2 id="features-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              More than a one-time comparison
            </h2>
            <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
              The hosted workspace helps you build a practical view across roles: what you already show, what keeps recurring, and which structured profile best supports the opportunity.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {featureProof.map((feature) => (
              <li key={feature} className="flex gap-3 border-t border-[var(--color-divider)] pt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[var(--color-canvas-subtle)]" aria-labelledby="rule-based-heading">
        <div className="app-shell-container grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="rule-based-heading" className="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              Transparent rule-based matching, not a black-box score
            </h2>
            <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
              The analyzer uses a defined skill taxonomy and aliases to look for skill evidence. That makes the current behavior predictable and easier to audit while keeping results focused on planning guidance.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="font-bold text-[var(--color-text)]">What that means today</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <li>It is not semantic AI and does not rewrite or rank your résumé.</li>
              <li>It does not decide whether someone should be hired or guarantee job fit.</li>
              <li>It is best used as a focused checklist for conversations, learning plans, and role comparisons.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="app-shell-container py-12 sm:py-16" aria-labelledby="privacy-heading">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-accent-warm)]">Privacy and control</p>
              <h2 id="privacy-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
                Save structured results—without making raw text the product record
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-6 text-[var(--color-text-muted)]">
              <p>
                Pasted or uploaded resume and job-description text is processed for the request. The application save path does not intentionally store raw résumé body text, raw uploaded resume files, or raw job-description body text.
              </p>
              <p>
                Optional saved analyses may contain job metadata, matched and missing skill names/categories, counts, timestamps, optional notes, and recurring-gap information. Structured profiles contain profile metadata and skill names, not raw résumé body text.
              </p>
              <p>
                You have individual delete controls for saved analyses and structured profiles. Avoid unusually sensitive content, and note that platform or service logging cannot be guaranteed absent.
              </p>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center font-bold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
              >
                Read the full privacy and data-control details
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell-container pb-14 sm:pb-20" aria-labelledby="final-cta-heading">
        <div className="rounded-[2rem] bg-[var(--color-text)] p-6 text-[var(--color-surface)] sm:p-8 lg:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">Ready when you are</p>
          <h2 id="final-cta-heading" className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Turn a job description into a clearer skill conversation.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-stone-200">
            Use the hosted product for the main workflow, or explore the repository&apos;s local Python tools for offline workflows when that better fits your needs.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Show when="signed-out">
              <Link href="/sign-up" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-text)]">
                Create an account
              </Link>
              <Link href="/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-text)]">
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-text)]">
                Open dashboard
              </Link>
              <Link href="/privacy" className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-text)]">
                Privacy and data controls
              </Link>
            </Show>
          </div>
        </div>
      </section>
    </main>
  );
}
