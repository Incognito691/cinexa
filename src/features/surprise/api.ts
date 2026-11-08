import { request } from "@/lib/fetcher";
import type { ListPayload } from "@/types/api";
import type { MediaType } from "@/types/media";

/** One page of popular titles for a type and optional genre. Filtered server-side. */
export function getPopularPage(
  type: MediaType,
  genre: number | null,
  page: number,
): Promise<ListPayload> {
  const params = new URLSearchParams({ type, category: "popular", page: String(page) });
  if (genre != null) params.set("withGenres", String(genre));
  return request<ListPayload>(`/api/discover?${params.toString()}`);
}
