"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardRoutes = [
  { href: "/dashboard", label: "Analyze" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/profiles", label: "Profiles" },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard workspace"
      className="rounded-2xl border border-zinc-200 bg-stone-50/85 p-2 shadow-sm shadow-stone-200/40 lg:sticky lg:top-24 lg:w-48 lg:shrink-0"
    >
      <p className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:block">
        Workspace
      </p>
      <ul className="grid grid-cols-3 gap-1 lg:mt-3 lg:grid-cols-1 lg:gap-1.5">
        {dashboardRoutes.map((route) => {
          const active = isActiveRoute(pathname, route.href);

          return (
            <li key={route.href}>
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800 lg:justify-start ${
                  active
                    ? "border-zinc-900 bg-white text-zinc-950 shadow-sm before:mr-2 before:h-2 before:w-2 before:rounded-full before:bg-sky-800 before:content-['']"
                    : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white/80 hover:text-zinc-950"
                }`}
              >
                {route.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
