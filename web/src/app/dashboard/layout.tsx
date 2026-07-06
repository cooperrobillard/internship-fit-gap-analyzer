import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardWorkspaceNav } from "@/components/dashboard-workspace-nav";
import { TipJarNudge } from "@/components/tip-jar-nudge";

export const metadata: Metadata = {
  title: "Workspace",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-container flex-1 py-8 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <DashboardWorkspaceNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <TipJarNudge />
    </div>
  );
}
