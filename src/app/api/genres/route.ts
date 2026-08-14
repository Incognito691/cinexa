import { requireServerEnv } from "@/lib/env";
import { fail, ok } from "@/server/http/response";

const TMDB_BASE = "https://api.themoviedb.org/3";
const REVALIDATE_SECONDS = 60 * 60 * 24; // 1d

interface TmdbGenre {
  id: number;
  name: string;
}

/**
 * GET /api/genres?type=movie|tv
 *
 * Returns the official TMDB genre list for a media type. Cached at the
 * fetch layer for 24h since the lists are essentially static.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeRaw = searchParams.get("type");
    const type: "movie" | "tv" = typeRaw === "tv" ? "tv" : "movie";

    const apiKey = requireServerEnv("TMDB_API_KEY");
    const url = new URL(`${TMDB_BASE}/genre/${type}/list`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "en-US");

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`TMDB /genre/${type}/list failed: ${res.status}`);
    }
    const data = (await res.json()) as { genres?: TmdbGenre[] };
    return ok({ type, genres: data.genres ?? [] });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to fetch genres",
      500,
    );
  }
}
