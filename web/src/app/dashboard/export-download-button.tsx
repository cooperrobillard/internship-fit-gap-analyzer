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
      className="min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium leading-snug text-zinc-800 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
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
  title = "Export",
  description,
  children,
}: ExportDownloadGroupProps) {
  return (
    <details className="group max-w-full rounded-md border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm">
      <summary className="min-h-10 cursor-pointer list-none select-none font-medium text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex min-h-10 items-center gap-2">
          <span aria-hidden="true" className="text-zinc-500 group-open:hidden">
            +
          </span>
          <span aria-hidden="true" className="hidden text-zinc-500 group-open:inline">
            −
          </span>
          {title}
        </span>
      </summary>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </details>
  );
}
