import { request } from "@/lib/fetcher";
import type { ListPayload } from "@/types/api";

/**
 * Client-side rail fetchers.
 *
 * The home page itself renders server-side and passes data down as props, so
 * these exist for client-driven surfaces (pagination, "load more", and the
 * upcoming AI recommendation rail) rather than first paint.
 */

export function getDiscover(
  type: "movie" | "tv",
  category: string,
  region?: string,
  language?: string,
  page = 1,
): Promise<ListPayload> {
  const params = new URLSearchParams({ type, category, page: String(page) });
  if (region) params.set("region", region);
  if (language) params.set("language", language);
  return request<ListPayload>(`/api/discover?${params.toString()}`);
}

export function getTrending(
  page = 1,
  type: "all" | "movie" | "tv" = "all",
  window: "day" | "week" = "week",
): Promise<ListPayload> {
  const params = new URLSearchParams({ type, window, page: String(page) });
  return request<ListPayload>(`/api/trending?${params.toString()}`);
}
