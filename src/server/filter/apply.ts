import type { FilterDecision, FilterInput } from "./types";
import { runPipeline } from "./pipeline";
import { prefetchAiClassifications } from "./layers/layer-9-ai";

/**
 * Glues the filter into the existing TMDB service. Two entry points because
 * the level-of-detail matters:
 *
 *   `applyContentFilterListLevel(items)` — used by /trending, /discover/* etc.
 *     These payloads have NO detail-level signals (no keywords, no companies,
 *     no networks). Layers 2/3/4 are skipped; AI is almost never invoked
 *     (it needs keywords which list payloads don't carry).
 *
 *   `applyContentFilterFull(items)` — used by detail pages and any future
 *     enrichment path. Has all signals available.
 *
 * Both paths are cache-backed, no detail fetches per item at list time.
 *
 * The input constraint is *structural*: the function only reads a fixed subset
 * of fields (id, mediaType, adult, title, overview, genres). Any object with
 * those fields (and any extras) is acceptable.
 */

export type ListLevelItem = {
  id: number;
  mediaType: "movie" | "tv";
  adult: boolean;
  title: string;
  overview: string;
  genres: string[];
  tagline?: string;
  /** Optional — some list payloads include TMDB keyword data already. */
  keywords?: string[];
  /** Optional — some list payloads include production-company numeric IDs. */
  productionCompanyIds?: number[];
  /** Optional — some list payloads include TV network numeric IDs. */
  networkIds?: number[];
};

/**
 * Generic: takes any object that has the structural shape we need.
 * `T` is preserved in the return type so downstream code keeps its richer
 * objects (e.g. `MediaFilterItem` keeps its `productionCompanyIds` etc.).
 */
export async function applyContentFilterListLevel<T extends ListLevelItem>(
  items: T[],
): Promise<T[]> {
  const inputs = items.map(toFilterInput);
  // One batched AI call warms the cache for the whole page, so the per-item
  // pipeline below can consult Layer 9 on every title without firing a
  // request per title. No-op when the key is unset or the breaker is open.
  await prefetchAiClassifications(inputs);
  const decisions = await Promise.all(inputs.map(runPipeline));
  return items.filter((_, i) => decisions[i].visible);
}

export async function applyContentFilterFull<T extends FilterInput>(
  items: T[],
): Promise<T[]> {
  await prefetchAiClassifications(items);
  const decisions = await Promise.all(items.map(runPipeline));
  return items.filter((_, i) => decisions[i].visible);
}

function toFilterInput(it: ListLevelItem): FilterInput {
  return {
    tmdbId: it.id ?? 0,
    mediaType: (it.mediaType ?? "movie") as "movie" | "tv",
    adult: it.adult ?? false,
    title: it.title,
    overview: it.overview,
    tagline: it.tagline,
    // List payloads don't all carry these — preserve them when present so the
    // L3 (companies) / L4 (keywords) layers can fire even at list time when
    // the upstream TMDB call included them.
    keywords: it.keywords ?? [],
    genres: it.genres,
    productionCompanyIds: it.productionCompanyIds ?? [],
    networkIds: it.networkIds ?? [],
  };
}

export type { FilterDecision };
