import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { TmdbPaginatedResult } from "@/types/media";

import { REVALIDATE_DYNAMIC, tmdbFetch } from "./client";
import { mapTmdbListItem, type TmdbListItemRaw } from "./mapper";
import type { TmdbListResult } from "./types";

export interface FetchSearchParams {
  /** `multi` queries `/search/multi`; results are still stamped with one type. */
  type: "multi" | "movie" | "tv";
  q: string;
  page: number;
}

/**
 * TMDB `/search/{type}`.
 *
 * `include_adult=true` is deliberate — we ask TMDB for everything and let the
 * content filter decide, rather than trusting TMDB's own adult flag alone.
 *
 * Search results carry no usable `media_type`, so one is stamped on from the
 * request; the filter pipeline needs a concrete type to run. `multi` collapses
 * to `movie`, which is what the search route has always done.
 */
export async function fetchSearch(
  params: FetchSearchParams,
): Promise<TmdbListResult> {
  const data = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(
    `/search/${params.type}`,
    { query: params.q, page: params.page, include_adult: "true" },
    REVALIDATE_DYNAMIC,
  );

  const mediaType: "movie" | "tv" = params.type === "tv" ? "tv" : "movie";
  const mapped = data.results.map((item) => ({
    ...mapTmdbListItem(item),
    mediaType,
  }));

  return {
    items: await applyContentFilterListLevel(mapped),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}
