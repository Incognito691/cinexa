import type { FilterInput, LayerResult } from "../types";
import { scoreTextSignals } from "../text-analysis";

/**
 * Layer 5 — Title / overview / tagline text analysis.
 *
 * Net scoring: positive signals (strong/soft phrases) are weighted against
 * negative "story" signals, so mainstream thrillers / crime dramas can
 * legitimately discuss mature themes without being flagged.
 *
 * Mapping (Layer 10 aggregates these into the final score):
 *   score ≥ 0.8  → EROTIC strong
 *   0.4 ≤ score < 0.8  → EROTIC soft
 *   score  < 0.4  → PASS
 */
export function layer5Text(input: FilterInput): LayerResult {
  const scored = scoreTextSignals({
    title: input.title,
    overview: input.overview,
    tagline: input.tagline,
  });

  if (scored.score >= 0.8) {
    const hits = [...scored.strongHits, ...scored.softHits].slice(0, 3);
    return {
      layer: 5,
      decision: "BLOCK",
      class: "EROTIC",
      confidence: Math.min(0.95, 0.7 + scored.score * 0.1),
      reason:
        hits.length > 0
          ? `text signals (${hits.join(", ")})`
          : `text score ${scored.score.toFixed(2)} ≥ 0.8`,
    };
  }

  if (scored.score >= 0.4) {
    return {
      layer: 5,
      decision: "PASS",
      confidence: scored.score,
      reason: `text score ${scored.score.toFixed(2)} (soft signal)`,
    };
  }

  return {
    layer: 5,
    decision: "PASS",
    confidence: 0,
    reason: `text score ${scored.score.toFixed(2)}`,
  };
}
