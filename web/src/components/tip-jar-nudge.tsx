"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useId, useMemo, useState } from "react";

export const ANALYSIS_COMPLETED_EVENT = "jobfit:analysis-completed";

const DEFAULT_TIP_PROMPT_THRESHOLD = 5;

function getTipJarUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_TIP_JAR_URL?.trim();
  return url || null;
}

function getTipPromptThreshold(): number {
  const raw = process.env.NEXT_PUBLIC_TIP_PROMPT_ANALYSIS_THRESHOLD?.trim();
  if (!raw) {
    return DEFAULT_TIP_PROMPT_THRESHOLD;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_TIP_PROMPT_THRESHOLD;
  }
  return Math.floor(parsed);
}

function storageKey(userId: string, suffix: string): string {
  return `jobfit:tip-jar:${suffix}:${userId}`;
}

function readCount(userId: string): number {
  try {
    const raw = localStorage.getItem(storageKey(userId, "count"));
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  } catch {
    return 0;
  }
}

function writeCount(userId: string, count: number): void {
  try {
    localStorage.setItem(storageKey(userId, "count"), String(count));
  } catch {
    // Ignore storage failures.
  }
}

function readPopupDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(storageKey(userId, "popup-dismissed")) === "1";
  } catch {
    return false;
  }
}

function writePopupDismissed(userId: string): void {
  try {
    localStorage.setItem(storageKey(userId, "popup-dismissed"), "1");
  } catch {
    // Ignore storage failures.
  }
}

export function TipJarNudge() {
  const tipJarUrl = getTipJarUrl();
  const threshold = getTipPromptThreshold();
  const titleId = useId();
  const bodyId = useId();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [storageVersion, setStorageVersion] = useState(0);

  const analysisCount = useMemo(() => {
    if (!userId) {
      return 0;
    }
    void storageVersion;
    return readCount(userId);
  }, [storageVersion, userId]);

  const popupDismissed = useMemo(() => {
    if (!userId) {
      return false;
    }
    void storageVersion;
    return readPopupDismissed(userId);
  }, [storageVersion, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !tipJarUrl) {
      return;
    }

    const activeUserId = userId;

    function handleAnalysisCompleted() {
      const nextCount = readCount(activeUserId) + 1;
      writeCount(activeUserId, nextCount);
      setStorageVersion((version) => version + 1);
    }

    window.addEventListener(ANALYSIS_COMPLETED_EVENT, handleAnalysisCompleted);
    return () => {
      window.removeEventListener(ANALYSIS_COMPLETED_EVENT, handleAnalysisCompleted);
    };
  }, [isLoaded, isSignedIn, tipJarUrl, userId]);

  if (!tipJarUrl || !isLoaded || !isSignedIn || !userId) {
    return null;
  }

  const activeUserId = userId;
  const activeTipJarUrl = tipJarUrl;
  const thresholdReached = analysisCount >= threshold;
  const showPopup = thresholdReached && !popupDismissed;
  const showChip = thresholdReached && popupDismissed;

  function dismissPopup() {
    writePopupDismissed(activeUserId);
    setStorageVersion((version) => version + 1);
  }

  function openTipJar() {
    window.open(activeTipJarUrl, "_blank", "noopener,noreferrer");
    dismissPopup();
  }

  return (
    <>
      {showPopup ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Dismiss support prompt"
            className="absolute inset-0 bg-zinc-950/20"
            onClick={dismissPopup}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-300/40"
          >
            <h2 id={titleId} className="text-base font-semibold text-zinc-950">
              Finding this useful?
            </h2>
            <p id={bodyId} className="mt-2 text-sm leading-6 text-zinc-600">
              If Job Fit is helping you compare roles, you can support the project
              with a small coffee.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={dismissPopup}
                className="min-h-10 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={openTipJar}
                className="min-h-10 rounded-md bg-sky-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900"
              >
                Support the project
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showChip ? (
        <div className="fixed bottom-4 right-4 z-40">
          <a
            href={activeTipJarUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support Job Fit with a small coffee"
            className="inline-flex min-h-10 items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 shadow-sm hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
          >
            Support Job Fit ☕
          </a>
        </div>
      ) : null}
    </>
  );
}
