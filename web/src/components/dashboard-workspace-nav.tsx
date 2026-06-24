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
      className="border-b border-zinc-200 pb-1 lg:sticky lg:top-24 lg:w-44 lg:shrink-0 lg:border-b-0 lg:pb-0"
    >
      <p className="hidden px-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:block">
        Workspace
      </p>
      <ul className="grid grid-cols-3 gap-0 lg:mt-3 lg:grid-cols-1 lg:gap-1">
        {dashboardRoutes.map((route) => {
          const active = isActiveRoute(pathname, route.href);

          return (
            <li key={route.href}>
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center border-b-2 px-2 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800 lg:justify-start lg:border-b-0 lg:border-l-2 lg:px-3 ${
                  active
                    ? "border-sky-800 bg-sky-50/70 text-zinc-950"
                    : "border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-white/70 hover:text-zinc-950"
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
