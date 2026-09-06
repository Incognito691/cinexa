import { request } from "@/lib/fetcher";
import type { ListPayload } from "@/types/api";

import type { ExploreTab } from "./schemas";

export interface ExploreFilters {
  /** UI tab; the route handler maps it to TMDB params via TAB_CONFIG. */
  tab: ExploreTab;
  /** TMDB genre ID. */
  genre?: number;
  /** TMDB sort_by override, e.g. "vote_average.desc". */
  sortBy?: string;
  /** Search term; routes through TMDB /search when present. */
  q?: string;
  /** ISO 3166-1 alpha-2 country of origin, e.g. "KR". */
  country?: string;
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

export function getExploreFilters(
  filters: ExploreFilters,
): Promise<ListPayload> {
  const params = new URLSearchParams();
  params.set("tab", filters.tab);
  params.set("page", String(filters.page));
  if (filters.genre != null) params.set("genre", String(filters.genre));
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.q) params.set("q", filters.q);
  if (filters.country) params.set("country", filters.country);
  return request<ListPayload>(`/api/explore?${params.toString()}`);
}

export function getGenres(type: "movie" | "tv"): Promise<GenresResponse> {
  return request<GenresResponse>(`/api/genres?type=${type}`);
}
