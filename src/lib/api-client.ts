import type { ApiResponse, ListPayload } from "@/types/api";

import type { ExploreTab } from "@/lib/schemas/explore";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.ok) {
    throw new Error(body.ok ? "Request failed" : body.error);
  }

  return body.data;
}

export type { ExploreTab } from "@/lib/schemas/explore";

export interface ExploreFilters {
  /** "movies" | "tv" | "anime" | "trending" — UI tab. The orchestrator maps to TMDB params. */
  tab: ExploreTab;
  /** Optional TMDB genre ID. */
  genre?: number;
  /** Optional TMDB sort_by override (e.g. "vote_average.desc"). */
  sortBy?: string;
  /** Optional search term; routes through TMDB /search when present. */
  q?: string;
  page: number;
}

export interface GenreItem {
  id: number;
  name: string;
}

export interface GenresResponse {
  type: "movie" | "tv";
  genres: GenreItem[];
}

export function getExploreFilters(filters: ExploreFilters): Promise<ListPayload> {
  const params = new URLSearchParams();
  params.set("tab", filters.tab);
  params.set("page", String(filters.page));
  if (filters.genre != null) params.set("genre", String(filters.genre));
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.q) params.set("q", filters.q);
  return request<ListPayload>(`/api/explore?${params.toString()}`);
}

export function getGenres(type: "movie" | "tv"): Promise<GenresResponse> {
  return request<GenresResponse>(`/api/genres?type=${type}`);
}

export function getDiscover(
  type: "movie" | "tv",
  category: string,
  region?: string,
  language?: string,
  page = 1,
) {
  const params = new URLSearchParams({
    type,
    category,
    page: String(page),
  });
  if (region) params.set("region", region);
  if (language) params.set("language", language);
  return request<ListPayload>(`/api/discover?${params.toString()}`);
}

export function getTrending(
  page = 1,
  type: "all" | "movie" | "tv" = "all",
  window: "day" | "week" = "week",
) {
  const params = new URLSearchParams({
    type,
    window,
    page: String(page),
  });
  return request<ListPayload>(`/api/trending?${params.toString()}`);
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export function getMovieVideos(movieId: number | string) {
  return request<VideoItem[]>(`/api/movie/${movieId}/videos`);
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export function getMovieCast(movieId: number | string) {
  return request<CastMember[]>(`/api/movie/${movieId}/credits`);
}