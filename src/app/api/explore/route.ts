import { z } from "zod";

import { fail, ok } from "@/server/http/response";
import {
  fetchDiscover,
  fetchSearch,
  type TmdbListResult,
} from "@/server/tmdb";
import { fetchTrending } from "@/server/tmdb";
import { exploreTabSchema } from "@/features/explore/schemas";

const exploreQuerySchema = z.object({
  tab: exploreTabSchema.default("movies"),
  page: z.coerce.number().int().min(1).default(1),
  genre: z.coerce.number().int().positive().optional(),
  sortBy: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
});

/**
 * GET /api/explore — single endpoint backing the redesigned explore page.
 *
 * Two paths:
 *  - `tab=trending` → TMDB `/trending/all/week` (no filters applied)
 *  - everything else → `/discover` for movie + tv, plus `/search` when
 *    `q` is present.
 *
 * Tabs are server-side concerns only: `anime` hardcodes genre=16 + lang=ja.
 * Client never sends category/year/language — those are preset by the chip
 * hrefs or the genre tiles.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = exploreQuerySchema.safeParse({
      tab: searchParams.get("tab") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      sortBy: searchParams.get("sort_by") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid explore query", 422);

    const { tab, page, genre, sortBy, q } = parsed.data;

    let data: TmdbListResult;

    if (tab === "trending") {
      // Trending bypasses discover/search; ignores other params.
      data = await fetchTrending({ type: "all", window: "week", page });
    } else if (q) {
      // Search always uses the multi-tab's media type.
      const searchType = tab === "movies" ? "movie" : "tv";
      data = await fetchSearch({ type: searchType, q, page });
    } else {
      const tabConfig = TAB_CONFIG[tab];
      data = await fetchDiscover({
        type: tabConfig.type,
        category: "popular",
        page,
        withGenres: [
          ...tabConfig.genres,
          ...(genre != null ? [String(genre)] : []),
        ].join(",") || undefined,
        language: tabConfig.defaultLanguage,
        sortBy,
        forceDiscover: true,
      });
    }

    return ok(data);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to fetch explore data",
      500,
    );
  }
}

interface TabConfig {
  /** TMDB media type. */
  type: "movie" | "tv";
  /** TMDB genre IDs always applied for this tab. */
  genres: readonly number[];
  /** Default `with_original_language` for this tab. */
  defaultLanguage?: string;
}

const TAB_CONFIG: Record<"movies" | "tv" | "anime", TabConfig> = {
  movies: {
    type: "movie",
    genres: [],
  },
  tv: {
    type: "tv",
    genres: [],
  },
  anime: {
    // Animation = 16, Japanese language pre-selected by default.
    type: "tv",
    genres: [16],
    defaultLanguage: "ja",
  },
};
