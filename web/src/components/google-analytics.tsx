"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || null;
}

/**
 * Loads Google Analytics 4 and tracks App Router client-side navigation.
 *
 * The initial config sets `send_page_view: false` so the gtag script does not
 * emit its own automatic pageview; instead a single `page_view` event is sent
 * whenever the pathname changes (including the first render). This avoids
 * double-counting the initial pageview.
 *
 * Privacy note: only the sanitized `page_path` (pathname, no search/query
 * string, no full URL) is sent. Do not send resume text, job descriptions,
 * extracted skills, profile names, uploaded files, AI prompts/responses,
 * analysis contents, or account identifiers, and do not add custom events.
 */
export function GoogleAnalytics() {
  const measurementId = getMeasurementId();
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId || !pathname) {
      return;
    }
    // Ensure the gtag stub exists so this queues even if the effect runs
    // before the afterInteractive init script; gtag.js processes the queue in
    // order once loaded. The initial config uses send_page_view: false, so this
    // is the single source of the initial pageview (no double counting).
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
    window.gtag("event", "page_view", {
      page_path: pathname,
    });
  }, [measurementId, pathname]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
