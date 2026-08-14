import type { FilterInput, LayerResult } from "../types";
import { MANUAL_BLACKLIST } from "../config/blacklist";

/**
 * Layer 7 — Manual blacklist (hard veto).
 *
 * TMDB IDs and IMDb IDs listed here are always blocked, regardless of any
 * other signal. Pipeline short-circuits (returns immediately) on hit.
 */
export function layer7ManualBlacklist(input: FilterInput): LayerResult {
  const tmdbIdNum = Number(input.tmdbId);
  const tmdbHit = MANUAL_BLACKLIST.tmdb.includes(tmdbIdNum);
  const imdbHit =
    typeof input.imdbId === "string" &&
    MANUAL_BLACKLIST.imdb.includes(input.imdbId);

  if (tmdbHit || imdbHit) {
    return {
      layer: 7,
      decision: "BLOCK",
      class: "PORNOGRAPHIC",
      confidence: 1,
      reason: imdbHit
        ? `manual blacklist (imdb:${input.imdbId})`
        : `manual blacklist (tmdb:${input.tmdbId})`,
    };
  }

  return {
    layer: 7,
    decision: "PASS",
    confidence: 0,
    reason: "no manual blacklist match",
  };
}
