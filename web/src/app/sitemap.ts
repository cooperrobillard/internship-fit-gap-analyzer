import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteSiteUrl("/"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteSiteUrl("/privacy"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
