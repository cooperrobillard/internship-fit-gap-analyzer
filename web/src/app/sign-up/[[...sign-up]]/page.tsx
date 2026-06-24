import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create an account for Job Fit & Skill-Gap Analyzer to use the limited-beta dashboard and structured saved results.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorText: "#172033",
    colorTextSecondary: "#5f6c80",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#172033",
    borderRadius: "0.875rem",
  },
};

export default function SignUpPage() {
  return (
    <main className="app-shell-container flex-1 py-10 sm:py-14 lg:py-16">
      <div className="grid gap-9 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,0.9fr)] lg:items-center lg:gap-14">
        <section aria-labelledby="sign-up-heading" className="relative min-w-0 py-3 sm:py-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-[-1rem] inset-y-0 rounded-[2rem] bg-[radial-gradient(circle_at_18%_18%,rgba(254,215,170,0.35),transparent_31%),linear-gradient(135deg,rgba(254,249,195,0.42),rgba(186,230,253,0.26)_52%,rgba(209,250,229,0.24))]"
          />
          <div className="relative max-w-md p-3 sm:p-5">
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">Limited public beta</p>
            <h1 id="sign-up-heading" className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-5xl">
              Create your workspace.
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
              Save useful analyses, compare opportunities, and reuse structured skill profiles.
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              Structured saved records contain skills and metadata, not raw résumé or job-description body text.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
              >
                Privacy &amp; data controls
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-text-muted)] underline decoration-[var(--color-divider)] decoration-2 underline-offset-4 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Create account form" className="flex min-w-0 justify-center lg:justify-end">
          <div className="w-full max-w-md min-w-0">
            <SignUp appearance={clerkAppearance} />
          </div>
        </section>
      </div>
    </main>
  );
}
