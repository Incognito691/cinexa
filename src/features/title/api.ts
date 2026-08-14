import { request } from "@/lib/fetcher";
import type { CastMember, VideoItem } from "@/types/media";

/**
 * Client half of the `/api/movie/[id]/*` routes.
 *
 * The routes already exist and work; these are what the movie/TV detail
 * pages will call. The payload types come from `types/media` — they used to
 * be redeclared by hand in lib/api-client.ts, free to drift from the shape
 * the server actually returns.
 */

export type { CastMember, VideoItem };

export function getMovieVideos(movieId: number | string): Promise<VideoItem[]> {
  return request<VideoItem[]>(`/api/movie/${movieId}/videos`);
}

export function getMovieCast(movieId: number | string): Promise<CastMember[]> {
  return request<CastMember[]>(`/api/movie/${movieId}/credits`);
}
