import { z } from "zod";

import { fail, ok } from "@/server/http/response";
import {
  fetchDiscover,
  fetchSearch,
  sortByForCategory,
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
  /** ISO 3166-1 alpha-2 country of origin, e.g. "KR". */
  country: z.string().trim().length(2).toUpperCase().optional(),
  /**
   * Which slice of the catalogue. The home page's "View All" links and the
   * explore presets have always emitted this; the route used to ignore it and
   * hardcode `popular`, so every one of those links landed on the same
   * popular-movies list regardless of the rail it came from.
   */
  category: z
    .enum(["popular", "top_rated", "now_playing", "on_the_air"])
    .optional(),
  /** `with_original_language`, e.g. "hi" for the Hindi rails. */
  language: z.string().trim().min(2).max(5).optional(),
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
      country: searchParams.get("country") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      language: searchParams.get("language") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid explore query", 422);

    const { tab, page, genre, sortBy, q, country, category, language } =
      parsed.data;

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
      const resolvedCategory = category ?? "popular";
      data = await fetchDiscover({
        type: tabConfig.type,
        category: resolvedCategory,
        page,
        withGenres: [
          ...tabConfig.genres,
          ...(genre != null ? [String(genre)] : []),
        ].join(",") || undefined,
        originCountry: country,
        // The tab's own language wins — `anime` means Japanese whatever the
        // URL says — otherwise honour the caller's.
        language: tabConfig.defaultLanguage ?? language,
        // An explicit sort still overrides, so a category and a sort chip can
        // coexist; without one, the category picks its natural order.
        sortBy: sortBy ?? sortByForCategory(resolvedCategory),
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
