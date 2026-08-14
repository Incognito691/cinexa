import { requireServerEnv } from "@/lib/env";
import { mapTmdbListItem } from "@/server/mappers/tmdb";
import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { TmdbPaginatedResult } from "@/types/media";
import { searchQuerySchema } from "@/lib/schemas/api";
import { fail, ok } from "@/server/http/response";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE_SECONDS = 60; // search is fast-changing

/**
 * GET /api/search?q=inception&type=movie&page=1
 *
 * Wraps TMDB `/search/{type}` and runs the list-level content filter on
 * the results so adult content never reaches the client.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = searchQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid search query", 422);

    const apiKey = requireServerEnv("TMDB_API_KEY");
    const url = new URL(`${TMDB_BASE}/search/${parsed.data.type}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "en-US");
    url.searchParams.set("query", parsed.data.q);
    url.searchParams.set("page", String(parsed.data.page));
    // Always include adult results; the server-side filter still hides them.
    url.searchParams.set("include_adult", "true");

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`TMDB /search/${parsed.data.type} failed: ${res.status}`);
    }
    const data = (await res.json()) as TmdbPaginatedResult<
      Parameters<typeof mapTmdbListItem>[0]
    >;

    // `multi` collapses to a single mediaType so the filter pipeline can run.
    const mediaType: "movie" | "tv" = parsed.data.type === "tv" ? "tv" : "movie";
    const raw = data.results.map((it) => {
      const mapped = mapTmdbListItem(it);
      return { ...mapped, mediaType } as typeof mapped & { mediaType: "movie" | "tv" };
    });
    const items = await applyContentFilterListLevel(raw);

    return ok({
      items,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to search",
      500,
    );
  }
}
