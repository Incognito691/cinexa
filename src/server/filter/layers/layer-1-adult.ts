import type { FilterInput, LayerResult } from "../types";

/**
 * Layer 1 — TMDB adult flag.
 *
 * Signals only; does NOT auto-block. The weighted scorer (Layer 10)
 * combines this +0.8 contribution with every other layer.
 *
 * Producing a class here (PORNOGRAPHIC) only labels the candidate so the
 * pipeline's `reason` string can mention it; visibility is decided by Layer 10.
 */
export function layer1Adult(input: FilterInput): LayerResult {
  if (input.adult) {
    return {
      layer: 1,
      decision: "NEUTRAL",
      class: "PORNOGRAPHIC",
      confidence: 0.8,
      reason: "TMDB adult flag set",
    };
  }
  return {
    layer: 1,
    decision: "PASS",
    confidence: 0,
    reason: "TMDB adult flag not set",
  };
}
