import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { TmdbPaginatedResult } from "@/types/media";

import { REVALIDATE_DYNAMIC, REVALIDATE_LIST, tmdbFetch } from "./client";
import { mapTmdbListItem, type TmdbListItemRaw } from "./mapper";
import {
  sortByForCategory,
  yearParamFor,
  type DiscoverCategory,
  type TmdbListResult,
} from "./types";

export interface FetchDiscoverParams {
  type: "movie" | "tv";
  category: DiscoverCategory;
  page: number;
  region?: string;
  language?: string;
  /** Comma-separated TMDB genre IDs (e.g. "18" or "18,10765"). */
  withGenres?: string;
  /** ISO 3166-1 country of origin, e.g. "KR". Not the same as `region`. */
  originCountry?: string;
  year?: number;
  /** Override the default sort (e.g. popularity.desc, vote_average.desc). */
  sortBy?: string;
  /** Force `/discover/` even when no language/genre is given. */
  forceDiscover?: boolean;
}

/**
 * The one discover fetcher.
 *
 * Both services used to export their own; they had drifted, and the explore
 * one silently dropped `region`. This is the superset — every caller keeps
 * the behaviour it had, and explore gains `region` support.
 *
 * `/movie/{category}` and `/tv/{category}` silently ignore
 * `with_original_language`, `with_genres`, and year filters, so any filtered
 * request has to go through `/discover/{type}` with an explicit `sort_by`.
 */
export async function fetchDiscover(
  params: FetchDiscoverParams,
): Promise<TmdbListResult> {
  const useDiscover =
    params.forceDiscover ||
    Boolean(params.language) ||
    Boolean(params.withGenres) ||
    Boolean(params.originCountry) ||
    params.year != null ||
    Boolean(params.sortBy);

  const path = useDiscover
    ? `/discover/${params.type}`
    : `/${params.type}/${params.category}`;

  const data = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(
    path,
    {
      page: params.page,
      sort_by: params.sortBy ?? sortByForCategory(params.category),
      region: params.region,
      with_original_language: params.language,
      with_genres: params.withGenres,
      with_origin_country: params.originCountry,
      ...(params.year != null ? { [yearParamFor(params.type)]: params.year } : {}),
    },
    // Filtered rails cache shorter so a pipeline fix surfaces sooner.
    useDiscover ? REVALIDATE_DYNAMIC : REVALIDATE_LIST,
  );

  return {
    items: await applyContentFilterListLevel(data.results.map(mapTmdbListItem)),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}
