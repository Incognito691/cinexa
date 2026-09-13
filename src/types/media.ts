export type MediaType = "movie" | "tv";

export interface MediaCardItem {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  popularity: number;
}

/**
 * Which titles the signed-in user has hearted or collected, as
 * `${mediaType}:${tmdbId}` keys.
 *
 * Keys rather than rows because the only thing the client does with this is
 * `set.has(...)` per card, and both arrays are empty when signed out.
 */
export interface LibraryKeys {
  favourites: string[];
  collected: string[];
  /**
   * Empty arrays are ambiguous on their own — signed out and signed in with
   * nothing saved look identical — and the buttons need to tell them apart to
   * choose between "save this" and "sign in to save this".
   */
  signedIn: boolean;
}

/**
 * What a library mutation tells the UI. `error` is written for the user and is
 * safe to render verbatim.
 */
export type LibraryResult = { ok: true } | { ok: false; error: string };

/** A collection folder as the manage UI sees it. */
export interface CollectionFolderRow {
  id: string;
  name: string;
  itemCount: number;
}

/**
 * A collected title with its artwork resolved.
 *
 * `id` is the `CollectionItem` row id — what the manage UI moves between
 * folders — not the TMDB id, which lives on `card`. Two different numbers that
 * would be easy to confuse if the entry carried only one of them.
 */
export interface CollectionEntry {
  id: string;
  folderId: string | null;
  card: MediaCardItem;
}

export interface TmdbPaginatedResult<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

/**
 * Detail-page payloads. These live in `types/` rather than in `server/tmdb`
 * because both sides need them — the server maps TMDB into them, the client
 * consumes them — and a client module importing from `server/` (even
 * type-only) is the wrong direction.
 */
export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

/**
 * A movie or TV title's detail payload, normalised so one component renders
 * both. TV-only fields are optional rather than a separate type — the detail
 * page differs by a couple of rows, not by shape.
 */
export interface TitleDetail {
  id: number;
  mediaType: MediaType;
  title: string;
  tagline: string | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  genres: string[];
  /** Minutes. Movies only. */
  runtime: number | null;
  status: string | null;
  /** TV only. */
  seasons: number | null;
  episodes: number | null;
  /** Movies only; 0 when TMDB has no figure (it uses 0, not null, for unknown). */
  budget: number | null;
  revenue: number | null;
  productionCompanies: ProductionCompany[];
  homepage: string | null;
  /** TV only. */
  networks: ProductionCompany[];
  creators: string[];
  lastAirDate: string | null;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface TvSeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
}

export interface TvEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  rating: number;
}

/** Everything the TV detail page needs. */
export interface TvPage {
  detail: TitleDetail;
  cast: CastMember[];
  trailer: VideoItem | null;
  similar: MediaCardItem[];
  seasons: TvSeasonSummary[];
  /** The season currently being displayed. */
  selectedSeason: number;
  episodes: TvEpisode[];
}

/** Everything the movie detail page needs, from a single TMDB request. */
export interface MoviePage {
  detail: TitleDetail;
  cast: CastMember[];
  /** The trailer we'd embed, if TMDB has a YouTube one. */
  trailer: VideoItem | null;
  similar: MediaCardItem[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}