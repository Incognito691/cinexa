import { applyContentFilterListLevel } from "@/server/filter/apply";
import type { TmdbPaginatedResult } from "@/types/media";

import { REVALIDATE_LIST, tmdbFetch } from "./client";
import { mapTmdbListItem, type TmdbListItemRaw } from "./mapper";
import type { TmdbListResult } from "./types";

/**
 * "More like this" for one title, as a standalone fetch.
 *
 * The detail pages already resolve this via `append_to_response`; the
 * recommendation rail needs it without pulling a whole detail payload it would
 * throw away.
 *
 * Recommendations before `similar` for the same reason as on the detail page:
 * `similar` is keyword matching and comes back empty for most regional or
 * recently-added titles, while recommendations are behavioural and nearly
 * always populated. Falls through to `similar` only when the first is empty.
 */
export async function fetchRelated(
  type: "movie" | "tv",
  tmdbId: number,
): Promise<TmdbListResult> {
  const primary = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(
    `/${type}/${tmdbId}/recommendations`,
    { page: 1 },
    REVALIDATE_LIST,
  ).catch(() => null);

  let results = primary?.results ?? [];

  if (results.length === 0) {
    const fallback = await tmdbFetch<TmdbPaginatedResult<TmdbListItemRaw>>(
      `/${type}/${tmdbId}/similar`,
      { page: 1 },
      REVALIDATE_LIST,
    ).catch(() => null);
    results = fallback?.results ?? [];
  }

  return {
    items: await applyContentFilterListLevel(
      results.map((r) => mapTmdbListItem({ ...r, media_type: type })),
    ),
    page: 1,
    totalPages: 1,
    totalResults: results.length,
  };
}
