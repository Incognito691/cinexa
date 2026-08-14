import { requireServerEnv } from "@/lib/env";
import type { TmdbPaginatedResult } from "@/types/media";
import { mapTmdbListItem } from "@/server/mappers/tmdb";
import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { FilterInput } from "@/server/filter/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE_SECONDS = 120;

type TmdbListItemRaw = Parameters<typeof mapTmdbListItem>[0];

async function tmdbFetch<T>(
  path: string,
  query: Record<string, string | number> = {},
) {
  const apiKey = requireServerEnv("TMDB_API_KEY");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface FetchTrendingParams {
  type?: "all" | "movie" | "tv";
  window?: "day" | "week";
  page?: number;
}

export interface FetchTrendingResult {
  items: ReturnType<typeof mapTmdbListItem>[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export async function fetchTrending(
  params: FetchTrendingParams,
): Promise<FetchTrendingResult> {
  const window = params.window ?? "week";
  const path = `/trending/${params.type ?? "all"}/${window}`;
  const data = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(path, {
    page: params.page ?? 1,
  });

  const raw = data.results.map(mapTmdbListItem);
  const items = await applyContentFilterListLevel(raw);

  return {
    items,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export interface FetchDiscoverParams {
  type: "movie" | "tv";
  category: "popular" | "top_rated" | "now_playing" | "on_the_air";
  page: number;
  region?: string;
  language?: string;
  /** Comma-separated TMDB genre IDs (e.g. "18" or "18,10765"). */
  withGenres?: string;
  /** Year (movie: primary_release_year; tv: first_air_date_year). */
  year?: number;
  /** Override the default sort (e.g. popularity.desc, vote_average.desc). */
  sortBy?: string;
  /** Force `/discover/` route even when no language/genre is given. */
  forceDiscover?: boolean;
}

export async function fetchDiscover(
  params: FetchDiscoverParams,
): Promise<FetchTrendingResult> {
  // `/movie/{category}` and `/tv/{category}` (popular|top_rated|now_playing|on_the_air)
  // silently ignore `with_original_language`, `with_genres`, and year filters.
  // Filtered rails always go through `/discover/{type}` with a `sort_by`.
  const useDiscover =
    params.forceDiscover ||
    Boolean(params.language) ||
    Boolean(params.withGenres) ||
    params.year != null ||
    Boolean(params.sortBy);

  const path = useDiscover
    ? `/discover/${params.type}`
    : `/${params.type}/${params.category}`;

  const yearParam =
    params.type === "movie"
      ? "primary_release_year"
      : "first_air_date_year";

  const query: Record<string, string | number> = {
    page: params.page,
    sort_by: params.sortBy ?? sortByForCategory(params.category),
    ...(params.region ? { region: params.region } : {}),
    ...(params.language ? { with_original_language: params.language } : {}),
    ...(params.withGenres ? { with_genres: params.withGenres } : {}),
    ...(params.year != null ? { [yearParam]: params.year } : {}),
  };

  // Filtered rails (discover) cache shorter (60s) so a fix in the pipeline shows
  // up without users having to wait the full 120s revalidate window.
  const revalidateSeconds = useDiscover ? 60 : REVALIDATE_SECONDS;

  const url = (() => {
    const apiKey = requireServerEnv("TMDB_API_KEY");
    const u = new URL(`${TMDB_BASE}${path}`);
    u.searchParams.set("api_key", apiKey);
    u.searchParams.set("language", "en-US");
    for (const [k, v] of Object.entries(query)) {
      u.searchParams.set(k, String(v));
    }
    return u;
  })();

  const res = await fetch(url, {
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status}`);
  }

  const data = (await res.json()) as TmdbPaginatedResult<TmdbListItemRaw>;

  const raw = data.results.map(mapTmdbListItem);
  const items = await applyContentFilterListLevel(raw);

  return {
    items,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

function sortByForCategory(
  category: FetchDiscoverParams["category"],
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

// ──────────────── Videos ────────────────

export interface TmdbVideoRaw {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | "Vimeo" | string;
  type:
    | "Trailer"
    | "Teaser"
    | "Clip"
    | "Behind the Scenes"
    | "Featurette"
    | string;
  official: boolean;
  published_at: string;
  size: number;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export function mapTmdbVideos(raw: TmdbVideoRaw[]): VideoItem[] {
  return raw.map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official,
  }));
}

export async function fetchMovieVideos(
  movieId: number | string,
): Promise<VideoItem[]> {
  const data = await tmdbFetch<{ results?: TmdbVideoRaw[] }>(
    `/movie/${movieId}/videos`,
  );
  return mapTmdbVideos(data.results ?? []);
}

// ──────────────── Credits ────────────────

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export async function fetchMovieCast(
  movieId: number | string,
): Promise<CastMember[]> {
  const data = await tmdbFetch<{ cast?: TmdbCastMember[] }>(
    `/movie/${movieId}/credits`,
  );
  const cast = data.cast ?? [];
  return cast
    .filter((c) => c.profile_path)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
      order: c.order,
    }));
}

// ──────────────── Detail → FilterInput (used by debug endpoint) ────────────────

interface TmdbMovieDetailRaw {
  id: number;
  title: string;
  overview: string;
  tagline?: string;
  adult: boolean;
  genres?: { id: number; name: string }[];
  keywords?: { keywords?: { id: number; name: string }[] };
  production_companies?: { id: number; name: string }[];
  imdb_id?: string;
}

interface TmdbTvDetailRaw {
  id: number;
  name: string;
  overview: string;
  tagline?: string;
  adult?: boolean;
  genres?: { id: number; name: string }[];
  keywords?: { results?: { id: number; name: string }[] };
  networks?: { id: number; name: string }[];
  external_ids?: { imdb_id?: string | null };
}

export async function fetchMovieDetailForFilter(
  movieId: number,
): Promise<{ input: FilterInput } | null> {
  try {
    const data = await tmdbFetch<TmdbMovieDetailRaw>(`/movie/${movieId}`, {});
    return {
      input: {
        tmdbId: data.id,
        mediaType: "movie",
        adult: data.adult,
        title: data.title,
        overview: data.overview,
        tagline: data.tagline,
        keywords: (data.keywords?.keywords ?? []).map((k) => k.name),
        genres: (data.genres ?? []).map((g) => g.name),
        productionCompanyIds: (data.production_companies ?? []).map((c) => c.id),
        networkIds: [],
        imdbId: data.imdb_id,
      },
    };
  } catch {
    return null;
  }
}

export async function fetchTvDetailForFilter(
  tvId: number,
): Promise<{ input: FilterInput } | null> {
  try {
    const data = await tmdbFetch<TmdbTvDetailRaw>(`/tv/${tvId}`, {});
    return {
      input: {
        tmdbId: data.id,
        mediaType: "tv",
        adult: data.adult ?? false,
        title: data.name,
        overview: data.overview,
        tagline: data.tagline,
        keywords: (data.keywords?.results ?? []).map((k) => k.name),
        genres: (data.genres ?? []).map((g) => g.name),
        productionCompanyIds: [],
        networkIds: (data.networks ?? []).map((n) => n.id),
        imdbId: data.external_ids?.imdb_id ?? undefined,
      },
    };
  } catch {
    return null;
  }
}