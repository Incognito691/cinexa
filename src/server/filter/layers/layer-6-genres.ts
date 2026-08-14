import type { FilterInput, LayerResult } from "../types";

/**
 * Layer 6 — Genre (NEVER blocks alone).
 *
 * Genre is too noisy on its own (Romance + Crime + Drama all coexist with
 * mature-but-legitimate content), so this layer always returns NEUTRAL and
 * contributes only as a +0.1 (adult-genre) / −0.1 (mainstream) nudge in Layer 10.
 *
 * Admin reference: the names below are the standard TMDB genres categorized as
 * "adult-leaning" for the +0.1 nudge.
 */
const ADULT_LEANING_GENRES = new Set([
  "erotic",
  "adult",
  "adult only",
  "sex",
  "softcore",
]);

const MAINSTREAM_GENRES = new Set([
  "drama",
  "romance",
  "thriller",
  "crime",
  "mystery",
  "action",
  "comedy",
  "war",
  "history",
  "documentary",
]);

export function layer6Genres(input: FilterInput): LayerResult {
  const lower = input.genres.map((g) => g.toLowerCase());

  const adultCount = lower.filter((g) => ADULT_LEANING_GENRES.has(g)).length;
  const mainstreamCount = lower.filter((g) => MAINSTREAM_GENRES.has(g)).length;

  if (adultCount > 0) {
    return {
      layer: 6,
      decision: "NEUTRAL",
      class: "EROTIC",
      confidence: 0.1,
      reason: "adult-leaning genre detected",
    };
  }

  if (mainstreamCount > 0) {
    return {
      layer: 6,
      decision: "NEUTRAL",
      class: "SAFE",
      confidence: 0.1,
      reason: "mainstream genre detected",
    };
  }

  return {
    layer: 6,
    decision: "NEUTRAL",
    confidence: 0,
    reason: "no adult-leaning or mainstream genres",
  };
}
