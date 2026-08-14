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

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}