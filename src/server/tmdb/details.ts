import type { FilterInput } from "@/server/filter/types";
import type { CastMember, VideoItem } from "@/types/media";

import { tmdbFetch } from "./client";

export type { CastMember, VideoItem };

// ──────────────── Videos ────────────────

interface TmdbVideoRaw {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export async function fetchMovieVideos(
  movieId: number | string,
): Promise<VideoItem[]> {
  const data = await tmdbFetch<{ results?: TmdbVideoRaw[] }>(
    `/movie/${movieId}/videos`,
  );
  return (data.results ?? []).map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official,
  }));
}

// ──────────────── Credits ────────────────

interface TmdbCastMemberRaw {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export async function fetchMovieCast(
  movieId: number | string,
): Promise<CastMember[]> {
  const data = await tmdbFetch<{ cast?: TmdbCastMemberRaw[] }>(
    `/movie/${movieId}/credits`,
  );
  return (data.cast ?? [])
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

// ──────────────── Detail → FilterInput (used by /api/filter/debug) ────────────────

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
    const data = await tmdbFetch<TmdbMovieDetailRaw>(`/movie/${movieId}`);
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
    const data = await tmdbFetch<TmdbTvDetailRaw>(`/tv/${tvId}`);
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
