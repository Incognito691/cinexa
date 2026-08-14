import { requireServerEnv } from "@/lib/env";
import type { TmdbPaginatedResult } from "@/types/media";
import { mapTmdbListItem } from "@/server/mappers/tmdb";
import { applyContentFilterListLevel } from "@/server/filter/apply";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE_SECONDS = 60;

type TmdbListItemRaw = Parameters<typeof mapTmdbListItem>[0];

export interface FetchTrendingResult {
  items: ReturnType<typeof mapTmdbListItem>[];
  page: number;
  totalPages: number;
  totalResults: number;
}

async function tmdbJson<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
  revalidate = REVALIDATE_SECONDS,
): Promise<T> {
  const apiKey = requireServerEnv("TMDB_API_KEY");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function sortByForCategory(
  category: "popular" | "top_rated" | "now_playing" | "on_the_air",
): string {
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

export interface FetchDiscoverArgs {
  type: "movie" | "tv";
  category: "popular" | "top_rated" | "now_playing" | "on_the_air";
  page: number;
  withGenres?: string;
  language?: string;
  year?: number;
  sortBy?: string;
  forceDiscover?: boolean;
}

export async function fetchDiscover(
  args: FetchDiscoverArgs,
): Promise<FetchTrendingResult> {
  const useDiscover =
    args.forceDiscover ||
    Boolean(args.language) ||
    Boolean(args.withGenres) ||
    args.year != null ||
    Boolean(args.sortBy);

  const path = useDiscover
    ? `/discover/${args.type}`
    : `/${args.type}/${args.category}`;

  const yearParam =
    args.type === "movie"
      ? "primary_release_year"
      : "first_air_date_year";

  const data = await tmdbJson<TmdbPaginatedResult<TmdbListItemRaw>>(
    path,
    {
      page: args.page,
      sort_by: args.sortBy ?? sortByForCategory(args.category),
      ...(args.withGenres ? { with_genres: args.withGenres } : {}),
      ...(args.language ? { with_original_language: args.language } : {}),
      ...(args.year != null ? { [yearParam]: args.year } : {}),
    },
    REVALIDATE_SECONDS,
  );

  const items = await applyContentFilterListLevel(
    data.results.map(mapTmdbListItem),
  );

  return {
    items,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export interface FetchSearchArgs {
  type: "movie" | "tv";
  q: string;
  page: number;
}

export async function fetchSearch(
  args: FetchSearchArgs,
): Promise<FetchTrendingResult> {
  const data = await tmdbJson<TmdbPaginatedResult<TmdbListItemRaw>>(
    `/search/${args.type}`,
    {
      query: args.q,
      page: args.page,
      include_adult: "true",
    },
    REVALIDATE_SECONDS,
  );
  const mediaType = args.type;
  const items = await applyContentFilterListLevel(
    data.results.map((it) => ({ ...mapTmdbListItem(it), mediaType })),
  );
  return {
    items,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}
