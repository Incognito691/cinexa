import { requireServerEnv } from "@/lib/env";

/**
 * The single TMDB fetch wrapper.
 *
 * Replaced two near-identical copies (`tmdbFetch` in tmdb.service.ts and
 * `tmdbJson` in explore.service.ts) that had drifted: one stringified every
 * query value, the other skipped empty ones. This keeps the safer behaviour.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";

/** Plain lists (trending, /movie/popular) change slowly. */
export const REVALIDATE_LIST = 120;
/** Discover + search re-run the content filter more often, so cache shorter. */
export const REVALIDATE_DYNAMIC = 60;

export async function tmdbFetch<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
  revalidate: number = REVALIDATE_LIST,
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", requireServerEnv("TMDB_API_KEY"));
  url.searchParams.set("language", "en-US");

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);

  return (await res.json()) as T;
}
