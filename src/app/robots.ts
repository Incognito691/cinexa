import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";

/**
 * Two kinds of route are kept out of the index:
 *
 *  - **Filter cross-products.** `/explore` mints a distinct URL per filter
 *    combination; indexing them would bury the pages that matter.
 *  - **Personal and functional pages.** The library routes are per-user and
 *    show nothing to a crawler, and `/watch/*` is a bare player with no
 *    content of its own — the detail page is the indexable version.
 *
 * Each of these also sets `noIndex` in its own metadata. That's the directive
 * that actually removes a page from the index; robots.txt only stops the
 * crawl. Both are here on purpose — robots.txt saves the crawl budget, the
 * meta tag handles anything reached by a link anyway.
 *
 * `/movie/:id` and `/tv/:id` are the pages worth indexing and stay allowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/explore",
        "/watch/",
        "/favourites",
        "/my-collection",
        "/continue-watching",
        "/settings",
        "/ai",
      ],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL,
  };
}
