import type { FilterInput } from "@/server/filter/types";
import type {
  CastMember,
  MediaCardItem,
  MoviePage,
  ProductionCompany,
  TvEpisode,
  TvPage,
  TvSeasonSummary,
  TitleDetail,
  VideoItem,
} from "@/types/media";
import { mapTmdbListItem, type TmdbListItemRaw } from "./mapper";
import { applyContentFilterListLevel } from "@/server/filter/apply";

import { tmdbFetch } from "./client";

export type { CastMember, MoviePage, TitleDetail, TvPage, VideoItem };

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

// ──────────────── Full detail (UI) ────────────────

interface TmdbTitleDetailRaw {
  id: number;
  title?: string;
  name?: string;
  tagline?: string | null;
  overview?: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  episode_run_time?: number[];
  status?: string | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  adult?: boolean;
  budget?: number;
  revenue?: number;
  homepage?: string | null;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  created_by?: { id: number; name: string }[];
  last_air_date?: string;
  seasons?: TmdbSeasonRaw[];
  credits?: { cast?: TmdbCastMemberRaw[] };
  videos?: { results?: TmdbVideoRaw[] };
  similar?: { results?: TmdbListItemRaw[] };
}

/**
 * One detail fetcher for both media types — the payloads differ only in which
 * of `title`/`name` and `runtime`/`episode_run_time` are populated.
 *
 * Runs the title through the filter before returning: a detail page is a
 * direct URL, so without this check anyone could reach a blocked title by
 * guessing its ID even though it never appears in a list.
 */
export async function fetchTitleDetail(
  type: "movie" | "tv",
  id: number | string,
  append?: string,
): Promise<TitleDetail | null> {
  return (await fetchTitleRaw(type, id, append))?.detail ?? null;
}

/**
 * Shared loader — returns the mapped detail *and* the raw payload, so callers
 * that appended sub-resources (credits, videos, similar) can read them without
 * a second round trip.
 */
async function fetchTitleRaw(
  type: "movie" | "tv",
  id: number | string,
  append?: string,
): Promise<{ detail: TitleDetail; raw: TmdbTitleDetailRaw } | null> {
  let raw: TmdbTitleDetailRaw;
  try {
    raw = await tmdbFetch<TmdbTitleDetailRaw>(
      `/${type}/${id}`,
      append ? { append_to_response: append } : undefined,
    );
  } catch (error) {
    // A bad ID is a 404, not a server fault — return null so the page renders
    // not-found instead of the error boundary. Anything else still throws.
    if (error instanceof Error && / 404$/.test(error.message)) return null;
    throw error;
  }

  const detail: TitleDetail = {
    id: raw.id,
    mediaType: type,
    title: raw.title || raw.name || "Untitled",
    tagline: raw.tagline?.trim() || null,
    overview: raw.overview ?? "",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseDate: raw.release_date || raw.first_air_date || null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    genres: (raw.genres ?? []).map((g) => g.name),
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    status: raw.status ?? null,
    seasons: raw.number_of_seasons ?? null,
    episodes: raw.number_of_episodes ?? null,
    // TMDB reports "unknown" as 0 for both; normalise so the UI can just
    // check for null instead of treating a real $0 the same as missing data.
    budget: raw.budget ? raw.budget : null,
    revenue: raw.revenue ? raw.revenue : null,
    productionCompanies: mapCompanies(raw.production_companies),
    homepage: raw.homepage?.trim() || null,
    networks: mapCompanies(raw.networks),
    creators: (raw.created_by ?? []).map((c) => c.name),
    lastAirDate: raw.last_air_date || null,
  };

  const [visible] = await applyContentFilterListLevel([
    {
      id: detail.id,
      mediaType: detail.mediaType,
      adult: raw.adult ?? false,
      title: detail.title,
      overview: detail.overview,
      genres: detail.genres,
      tagline: detail.tagline ?? undefined,
    },
  ]);

  return visible ? { detail, raw } : null;
}

function mapCompanies(
  raw: { id: number; name: string; logo_path: string | null }[] | undefined,
): ProductionCompany[] {
  return (raw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    logoPath: c.logo_path,
  }));
}

/**
 * Everything the movie detail page renders, in **one** TMDB request.
 *
 * `append_to_response` folds credits, videos and similar titles into the
 * detail call — four round trips became one, which is most of the page's TTFB.
 */
export async function fetchMoviePage(
  id: number | string,
): Promise<MoviePage | null> {
  const result = await fetchTitleRaw("movie", id, "credits,videos,similar");
  if (!result) return null;
  const { detail, raw } = result;

  const cast = (raw.credits?.cast ?? [])
    .filter((c) => c.profile_path)
    .sort((a, b) => a.order - b.order)
    .slice(0, 18)
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
      order: c.order,
    })) satisfies CastMember[];

  const videos = raw.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser") ??
    null;

  // Similar titles go through the same filter as any other list — a blocked
  // title must not reappear as a recommendation on a clean film's page.
  const similar = (await applyContentFilterListLevel(
    (raw.similar?.results ?? []).map((r) =>
      mapTmdbListItem({ ...r, media_type: "movie" }),
    ),
  )).slice(0, 12) satisfies MediaCardItem[];

  return { detail, cast, trailer, similar };
}

// ──────────────── TV page ────────────────

interface TmdbSeasonRaw {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

interface TmdbEpisodeRaw {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string | null;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number | null;
}

/**
 * Everything the TV detail page renders.
 *
 * Episodes come from `append_to_response=season/N`, so the common case is a
 * single TMDB request for the show *and* the visible season. Only a request
 * for a season that doesn't exist (or a show whose numbering starts at 0)
 * costs a second call.
 */
export async function fetchTvPage(
  id: number | string,
  requestedSeason?: number,
): Promise<TvPage | null> {
  const wanted = requestedSeason ?? 1;
  const result = await fetchTitleRaw(
    "tv",
    id,
    `credits,videos,similar,season/${wanted}`,
  );
  if (!result) return null;
  const { detail, raw } = result;

  // Specials (season 0) are noise for most viewers; keep them out of the
  // picker unless that's genuinely all the show has.
  const allSeasons = (raw.seasons ?? []).filter((s) => s.episode_count > 0);
  const realSeasons = allSeasons.filter((s) => s.season_number > 0);
  const seasons: TvSeasonSummary[] = (
    realSeasons.length > 0 ? realSeasons : allSeasons
  ).map((s) => ({
    seasonNumber: s.season_number,
    name: s.name,
    episodeCount: s.episode_count,
    airDate: s.air_date,
    posterPath: s.poster_path,
  }));

  const appended = raw as unknown as Record<
    string,
    { episodes?: TmdbEpisodeRaw[] } | undefined
  >;

  let selectedSeason = wanted;
  let episodesRaw = appended[`season/${wanted}`]?.episodes;

  // The appended season didn't exist — fall back to the show's first real one.
  if (!episodesRaw && seasons.length > 0 && seasons[0].seasonNumber !== wanted) {
    selectedSeason = seasons[0].seasonNumber;
    try {
      const season = await tmdbFetch<{ episodes?: TmdbEpisodeRaw[] }>(
        `/tv/${id}/season/${selectedSeason}`,
      );
      episodesRaw = season.episodes;
    } catch {
      episodesRaw = [];
    }
  }

  const episodes: TvEpisode[] = (episodesRaw ?? []).map((e) => ({
    id: e.id,
    episodeNumber: e.episode_number,
    seasonNumber: e.season_number,
    name: e.name,
    overview: e.overview ?? "",
    stillPath: e.still_path,
    airDate: e.air_date,
    runtime: e.runtime,
    rating: e.vote_average ?? 0,
  }));

  const cast = (raw.credits?.cast ?? [])
    .filter((c) => c.profile_path)
    .sort((a, b) => a.order - b.order)
    .slice(0, 18)
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
      order: c.order,
    })) satisfies CastMember[];

  const videos = raw.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser") ??
    null;

  const similar = (await applyContentFilterListLevel(
    (raw.similar?.results ?? []).map((r) =>
      mapTmdbListItem({ ...r, media_type: "tv" }),
    ),
  )).slice(0, 12) satisfies MediaCardItem[];

  return { detail, cast, trailer, similar, seasons, selectedSeason, episodes };
}
