import type { MetadataRoute } from "next";
import { absoluteSiteUrl, SITE_ORIGIN } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/sign-in", "/sign-up", "/__clerk/"],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
