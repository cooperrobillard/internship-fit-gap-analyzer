"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { href: "/", label: "Home", match: (pathname: string) => pathname === "/" },
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (pathname: string) => pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
  },
];

export function AppHeader() {
  const pathname = usePathname() || "/";

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/88">
      <div className="app-shell-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-surface)]"
          aria-label="Job Fit & Skill-Gap Analyzer home"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(135deg,var(--color-accent-warm),var(--color-primary))] text-sm font-black tracking-tight text-white shadow-sm"
            aria-hidden="true"
          >
            JF
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
              Job Fit &amp; Skill-Gap Analyzer
            </span>
            <span className="block text-sm font-medium text-[var(--color-text-muted)]">
              Rule-based career workspace
            </span>
          </span>
        </Link>

        <nav
          className="flex flex-wrap items-center gap-2 sm:justify-end"
          aria-label="Primary navigation"
        >
          {primaryLinks.map((link) => {
            const isActive = link.match(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] ${
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary-ring)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{link.label}</span>
                {isActive ? (
                  <span
                    className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}

          <Show when="signed-out">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
              >
                Sign up
              </Link>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2">
              <UserButton />
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
}
