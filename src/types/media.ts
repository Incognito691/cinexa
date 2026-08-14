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