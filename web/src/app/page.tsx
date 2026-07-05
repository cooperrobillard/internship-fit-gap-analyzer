import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingAnalysisPreview } from "@/components/landing-analysis-preview";
import {
  absoluteSiteUrl,
  HOME_DESCRIPTION,
  HOME_TWITTER_METADATA,
  SITE_NAME,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: absoluteSiteUrl("/"),
  },
  openGraph: {
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    url: absoluteSiteUrl("/"),
  },
  twitter: HOME_TWITTER_METADATA,
};

const benefits = [
  {
    title: "Understand the role",
    body: "Review matched and missing skills found by a curated cross-domain taxonomy.",
  },
  {
    title: "Compare opportunities",
    body: "Save useful results, compare roles, and see which gaps recur.",
  },
  {
    title: "Reuse your skills",
    body: "Build structured profiles you can use across technical, business, operations, and other role comparisons.",
  },
];

const workflowSteps = [
  {
    title: "Add résumé information",
    body: "Paste text, upload a plain .txt file, or choose a saved skill profile.",
  },
  {
    title: "Add the role",
    body: "Paste the job description and optionally add a title, company, link, or notes.",
  },
  {
    title: "Review the result",
    body: "See matched and missing skills, then save the structured result only when it is useful.",
  },
];

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      {children}
    </Link>
  );
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <main className="flex-1 text-[var(--color-text)]">
      <section className="app-shell-container py-12 sm:py-16 lg:py-20" aria-labelledby="landing-hero-heading">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.85fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">
              Rule-based career planning · Limited public beta
            </p>
            <h1
              id="landing-hero-heading"
              className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-[var(--color-text)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02]"
            >
              Compare your résumé with the role in front of you.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
              See explicitly recognized skill phrases, gaps worth investigating, and patterns across the technical, operations, business, and other opportunities you choose to save.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Show when="signed-out">
                <PrimaryLink href="/sign-up">Start an analysis</PrimaryLink>
              </Show>
              <Show when="signed-in">
                <PrimaryLink href="/dashboard">Open workspace</PrimaryLink>
              </Show>
              <TextLink href="#how-it-works">See how it works</TextLink>
            </div>

            <div className="mt-5 flex flex-col gap-2 text-sm text-[var(--color-text-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
              <p>Running an analysis does not automatically save it.</p>
              <TextLink href="/privacy">Privacy and data controls</TextLink>
            </div>
          </div>

          <div className="relative min-w-0">
            <div
              aria-hidden="true"
              className="absolute inset-x-[-0.75rem] bottom-[-1rem] top-[-1rem] sm:inset-x-[-1rem] rounded-[2rem] bg-[radial-gradient(circle_at_25%_20%,rgba(254,215,170,0.38),transparent_32%),linear-gradient(135deg,rgba(254,249,195,0.48),rgba(186,230,253,0.34)_48%,rgba(209,250,229,0.28))]"
            />
            <div className="relative p-3 sm:p-5">
              <LandingAnalysisPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)]" aria-labelledby="benefits-heading">
        <div className="app-shell-container py-12 sm:py-16">
          <h2 id="benefits-heading" className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            A clearer way to compare roles
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <section key={benefit.title} className="border-t border-[var(--color-divider)] pt-5">
                <p className="text-sm font-semibold text-[var(--color-primary)]" aria-hidden="true">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{benefit.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-surface)]/72"
        aria-labelledby="workflow-heading"
      >
        <div className="app-shell-container py-12 sm:py-16">
          <h2 id="workflow-heading" className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-0">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="border-t border-[var(--color-divider)] pt-5 md:border-r md:pr-6 md:pl-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <span className="text-sm font-semibold text-[var(--color-primary)]" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--color-text)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="app-shell-container py-12 sm:py-16" aria-labelledby="trust-heading">
        <div className="max-w-4xl">
          <h2 id="trust-heading" className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            Clear method. Deliberate saving.
          </h2>
          <div className="mt-6 grid gap-5 text-sm leading-6 text-[var(--color-text-muted)] md:grid-cols-3">
            <p>The analyzer uses a curated cross-domain taxonomy and reviewed aliases—not semantic AI or a generated fit score.</p>
            <p>Running an analysis does not automatically save it. Optional saved records contain structured skills and metadata rather than the raw résumé or job-description body text.</p>
            <p>Detected phrases do not prove proficiency, evidence strength, candidate quality, or hiring fit; results require human interpretation.</p>
          </div>
          <div className="mt-6">
            <TextLink href="/privacy">Privacy and data controls</TextLink>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)]" aria-labelledby="final-cta-heading">
        <div className="app-shell-container py-12 sm:py-16">
          <div className="max-w-3xl">
            <h2 id="final-cta-heading" className="text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Bring one role. Leave with a clearer view of the skills it asks for.
            </h2>
            <div className="mt-7">
              <Show when="signed-out">
                <PrimaryLink href="/sign-up">Start an analysis</PrimaryLink>
              </Show>
              <Show when="signed-in">
                <PrimaryLink href="/dashboard">Open workspace</PrimaryLink>
              </Show>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
