"use client";

import type { ReactNode } from "react";

type ExportDownloadButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ExportDownloadButton({
  label,
  onClick,
  disabled = false,
}: ExportDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium leading-snug text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
    >
      {label}
    </button>
  );
}

type ExportDownloadGroupProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function ExportDownloadGroup({
  title = "Download structured results",
  description,
  children,
}: ExportDownloadGroupProps) {
  return (
    <section
      className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3"
      aria-label={title}
    >
      <h4 className="text-sm font-medium text-zinc-900">{title}</h4>
      {description ? (
        <p className="mt-1 text-xs text-zinc-600">{description}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
