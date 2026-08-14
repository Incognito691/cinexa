/**
 * Static tab definitions for the Explore page.
 * Kept in a plain TS file so the page, the API client, and the route
 * handler can all reference the same source of truth.
 */

import type { ExploreTab } from "@/lib/schemas/explore";

export type { ExploreTab } from "@/lib/schemas/explore";

export interface TabMeta {
  id: ExploreTab;
  label: string;
  /** TMDB media type. `trending` returns a mix of movies + tv. */
  type: "movie" | "tv" | "all";
}

export const TABS: readonly TabMeta[] = [
  { id: "movies", label: "Movies", type: "movie" },
  { id: "tv", label: "TV Shows", type: "tv" },
  { id: "anime", label: "Anime", type: "tv" },
  { id: "trending", label: "Trending", type: "all" },
] as const;

export function getTabMeta(id: ExploreTab): TabMeta {
  return TABS.find((t) => t.id === id) ?? TABS[0];
}
