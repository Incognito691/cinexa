import type { FilterInput, LayerResult } from "../types";
import { MANUAL_WHITELIST } from "../config/whitelist";

/**
 * Layer 8 — Manual whitelist (highest-priority override).
 *
 * Listed items always pass. Runs FIRST in the pipeline — returned as a normal
 * LayerResult but `pipeline.ts` also short-circuits and returns `class: "SAFE"`.
 */
export function layer8ManualWhitelist(input: FilterInput): LayerResult {
  const tmdbIdNum = Number(input.tmdbId);
  const tmdbHit = MANUAL_WHITELIST.tmdb.includes(tmdbIdNum);
  const imdbHit =
    typeof input.imdbId === "string" &&
    MANUAL_WHITELIST.imdb.includes(input.imdbId);

  if (tmdbHit || imdbHit) {
    return {
      layer: 8,
      decision: "PASS",
      class: "SAFE",
      confidence: 1,
      reason: imdbHit
        ? `manual whitelist (imdb:${input.imdbId})`
        : `manual whitelist (tmdb:${input.tmdbId})`,
    };
  }

  return {
    layer: 8,
    decision: "PASS",
    confidence: 0,
    reason: "no manual whitelist match",
  };
}
