import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create an account for Job Fit & Skill-Gap Analyzer to use the limited-beta dashboard and structured saved results.",
};

export default function SignUpPage() {
  return (
    <main className="app-shell-container flex-1 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)] lg:items-center">
        <section aria-label="Product context" className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent-warm)]">Limited public beta</p>
          <p className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Start with structured skill-gap analysis.
          </p>
          <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
            Create an account to compare resume information or structured profiles with job descriptions, review matched and missing skills, and save structured results when they are useful.
          </p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <li>Rule-based matching uses a skill taxonomy and aliases; it is not AI.</li>
            <li>Saved analyses store structured results and metadata rather than raw resume or job body text.</li>
            <li>Avoid unusually sensitive content and review current privacy controls before using the dashboard.</li>
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/privacy" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]">
              Privacy &amp; data controls
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center text-sm font-bold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]">
              Back to home
            </Link>
          </div>
        </section>

        <section aria-label="Create account form" className="flex min-w-0 justify-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-canvas-subtle)] p-4 sm:p-6">
          <div className="w-full max-w-md min-w-0">
            <SignUp />
          </div>
        </section>
      </div>
    </main>
  );
}
