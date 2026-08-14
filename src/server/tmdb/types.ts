import type { MediaFilterItem } from "./mapper";

/**
 * Shape every TMDB list endpoint returns after mapping + content filtering.
 *
 * Was called `FetchTrendingResult` and declared separately in both services,
 * despite also being the return type of discover and search.
 */
export interface TmdbListResult {
  items: MediaFilterItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export type DiscoverCategory =
  | "popular"
  | "top_rated"
  | "now_playing"
  | "on_the_air";

/** Default sort per category, used whenever the caller doesn't override it. */
export function sortByForCategory(category: DiscoverCategory): string {
  switch (category) {
    case "top_rated":
      return "vote_average.desc";
    case "now_playing":
    case "on_the_air":
      return "primary_release_date.desc";
    case "popular":
    default:
      return "popularity.desc";
  }
}

/** TMDB names the year filter differently per media type. */
export function yearParamFor(type: "movie" | "tv"): string {
  return type === "movie" ? "primary_release_year" : "first_air_date_year";
}
