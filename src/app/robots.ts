import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";

/**
 * `/explore` is disallowed because every filter combination is a distinct URL
 * — indexing that cross-product would bury the pages that matter. Detail
 * pages (/movie/:id, /tv/:id) are the ones worth indexing once they exist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/explore"],
    },
    host: SITE_URL,
  };
}
