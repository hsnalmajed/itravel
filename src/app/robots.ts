import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * What crawlers should and shouldn't spend their time on.
 *
 * The results pages are built from a visitor's own query — origin, dates,
 * budget, party — so every one is unique, none is useful to anyone else, and
 * left open they would be an unbounded space for a crawler to wander into
 * while the pages that matter go unvisited.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/results", "/*/discover-results", "/*/multicity-results"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
