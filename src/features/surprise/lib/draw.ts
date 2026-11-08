import type { ListPayload } from "@/types/api";
import type { MediaCardItem } from "@/types/media";

/** Never go deeper than this: past ~400 titles "popular" turns obscure. */
const MAX_PAGES = 20;

/**
 * Draw one random title from a discover listing.
 *
 * TMDB has no "random" endpoint, so this picks a random page then a random
 * item on it. `knownPages` is the caller's memory of each filter's
 * `totalPages`, so later draws spread across the whole listing; the first
 * draw for a filter guesses 5, and falls back to page 1 if that overshot.
 */
export async function drawRandom(
  fetchPage: (page: number) => Promise<ListPayload>,
  knownPages: number | undefined,
  excludeId?: number,
): Promise<{ pick: MediaCardItem | null; totalPages: number }> {
  const max = Math.max(1, Math.min(knownPages ?? 5, MAX_PAGES));
  const page = 1 + Math.floor(Math.random() * max);

  let res = await fetchPage(page);
  if (res.items.length === 0 && page > 1) res = await fetchPage(1);

  const withPoster = res.items.filter((i) => i.posterPath);
  const pool = withPoster.filter((i) => i.id !== excludeId);
  const from = pool.length ? pool : withPoster;

  return {
    pick: from[Math.floor(Math.random() * from.length)] ?? null,
    totalPages: res.totalPages,
  };
}
