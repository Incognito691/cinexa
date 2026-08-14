import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { TmdbPaginatedResult } from "@/types/media";

import { tmdbFetch } from "./client";
import { mapTmdbListItem, type TmdbListItemRaw } from "./mapper";
import type { TmdbListResult } from "./types";

export interface FetchTrendingParams {
  type?: "all" | "movie" | "tv";
  window?: "day" | "week";
  page?: number;
}

export async function fetchTrending(
  params: FetchTrendingParams,
): Promise<TmdbListResult> {
  const path = `/trending/${params.type ?? "all"}/${params.window ?? "week"}`;

  const data = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(path, {
    page: params.page ?? 1,
  });

  return {
    items: await applyContentFilterListLevel(data.results.map(mapTmdbListItem)),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}
