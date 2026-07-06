import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="app-shell-container flex flex-col gap-3 py-6 text-sm text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">
          Planning guidance only—not a hiring decision.
        </p>
        <Link
          href="/privacy"
          className="inline-flex min-h-10 items-center font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary-ring)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          Privacy &amp; data controls
        </Link>
      </div>
    </footer>
  );
}
