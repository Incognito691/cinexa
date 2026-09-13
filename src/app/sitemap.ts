import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";
import { fetchTrending } from "@/server/tmdb";

/**
 * The catalogue is TMDB-sized, so a complete sitemap isn't a thing that can
 * exist here. This lists the home page plus what's trending this week — the
 * titles a crawler has the best reason to fetch right now — and lets the rest
 * be discovered by following links from those pages.
 *
 * Everything listed is a detail page. The library, player and explore routes
 * are `noIndex` and disallowed in `robots.ts`, so including them would be
 * contradictory.
 *
 * TMDB failures degrade to just the home page rather than throwing: a sitemap
 * that 500s is worse than a short one, and the crawler retries.
 */
export const revalidate = 86_400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home: MetadataRoute.Sitemap = [
    {
      url: new URL("/", SITE_URL).toString(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const trending = await fetchTrending({ type: "all", window: "week" }).catch(
    () => null,
  );
  if (!trending) return home;

  return [
    ...home,
    ...trending.items.map((item) => ({
      url: new URL(
        `/${item.mediaType}/${item.id}`,
        SITE_URL,
      ).toString(),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
