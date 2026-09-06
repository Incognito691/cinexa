import type {
  ContentClass,
  FilterDecision,
  LayerResult,
} from "./types";

/**
 * Layer 10 — Aggregator: combines layer results into a final visible/class.
 *
 * Score → visible rule:
 *   score ≥ 0.95      → visible=false, class=PORNOGRAPHIC
 *   0.85 ≤ score < 0.95 → visible=false, class=EROTIC
 *   0.45 ≤ score < 0.85 → visible=true,  class=MATURE
 *   score < 0.45       → visible=true,  class=SAFE
 *
 * L1 alone (0.8 weight) ⇒ score = 0.8 ⇒ MATURE (not auto-blocked).
 * L1 + L4 hit ⇒ score = max(0.8, 0.85) = 0.85 ⇒ EROTIC.
 * L1 + L5 strong hit ⇒ score = max(0.8, 0.95) = 0.95 ⇒ PORNOGRAPHIC.
 *
 * Layer 8 (whitelist) and Layer 7 (blacklist) override everything via the
 * `pipeline.ts` short-circuits.
 */

const HARD_BLOCK_CLASSES: ReadonlySet<ContentClass> = new Set([
  "EROTIC",
  "PORNOGRAPHIC",
]);

interface ScoreAccumulator {
  score: number;
  classification: ContentClass | null;
  confidence: number;
  topReason: string;
}

const NEUTRAL: ScoreAccumulator = {
  score: 0,
  classification: null,
  confidence: 0,
  topReason: "no signals",
};

/** Combine layer results into a single weighted score and pick the top signal. */
export function aggregateScore(layers: LayerResult[]): ScoreAccumulator {
  let acc: ScoreAccumulator = { ...NEUTRAL };

  for (const layer of layers) {
    const next = combineLayer(acc, layer);
    acc = next;
  }

  return acc;
}

function combineLayer(
  current: ScoreAccumulator,
  layer: LayerResult,
): ScoreAccumulator {
  // Hard blocks (L2, L3, L4, L7, L9 with class EROTIC/PORNOGRAPHIC)
  if (layer.decision === "BLOCK" && layer.class && HARD_BLOCK_CLASSES.has(layer.class)) {
    const blockWeight = layer.class === "PORNOGRAPHIC" ? 1 : 0.95;
    return {
      score: Math.max(current.score, blockWeight),
      classification: layer.class,
      confidence: Math.max(layer.confidence, current.confidence),
      topReason: layer.reason,
    };
  }

  // L1 (adult=true) contributes +0.8 weighted, doesn't pick class yet.
  if (layer.layer === 1 && layer.class === "PORNOGRAPHIC") {
    return {
      ...current,
      score: Math.max(current.score, 0.8),
      topReason: layer.reason,
      confidence: Math.max(current.confidence, 0.8),
    };
  }

  // L5 text score — take max against the running score (L1 weight stays independent).
  if (layer.layer === 5 && layer.confidence > 0) {
    return {
      ...current,
      score: Math.max(current.score, layer.confidence),
      topReason: current.topReason === NEUTRAL.topReason ? layer.reason : current.topReason,
    };
  }

  // L6 genre nudges ±0.1.
  if (layer.layer === 6) {
    const nudge = layer.class === "EROTIC" ? 0.1 : layer.class === "SAFE" ? -0.1 : 0;
    return {
      ...current,
      score: Math.max(0, Math.min(1, current.score + nudge)),
    };
  }

  // L9 AI (±0.3 confidence nudge + its class).
  if (layer.layer === 9 && layer.class) {
    const nudge = layer.class === "EROTIC" || layer.class === "PORNOGRAPHIC" ? 0.3 : -0.3;
    return {
      ...current,
      score: Math.max(0, Math.min(1, current.score + nudge)),
      classification:
        HARD_BLOCK_CLASSES.has(layer.class)
          ? layer.class
          : current.classification,
      confidence: layer.confidence,
      topReason:
        current.classification === null && layer.class !== "SAFE" && layer.class !== "MATURE"
          ? layer.reason
          : current.topReason,
    };
  }

  return current;
}

/** Map the aggregated score to the final classification + visible flag. */
export function scoreToDecision(
  score: number,
  classification: ContentClass | null,
): { visible: boolean; classification: ContentClass } {
  if (classification === "PORNOGRAPHIC" || score >= 0.95) {
    return { visible: false, classification: "PORNOGRAPHIC" };
  }
  if (classification === "EROTIC" || score >= 0.85) {
    return { visible: false, classification: "EROTIC" };
  }
  if (score >= 0.45) {
    return { visible: true, classification: "MATURE" };
  }
  return { visible: true, classification: "SAFE" };
}

/** Compose the final `FilterDecision` from the accumulated layer results. */
export function scoreOfLayers(layers: LayerResult[]): number {
  let s = 0;
  for (const l of layers) {
    if (l.layer === 7 && l.decision === "BLOCK") s = Math.max(s, 1);
    else if (l.layer === 2 || l.layer === 3)
      s = l.decision === "BLOCK" ? Math.max(s, 0.95) : s;
    else if (l.layer === 4 && l.decision === "BLOCK")
      s = Math.max(s, 0.85);
    else if (l.layer === 5) s = Math.max(s, l.confidence);
    else if (l.layer === 1 && l.class === "PORNOGRAPHIC")
      s = Math.max(s, 0.8);
    else if (l.layer === 6) {
      const nudge = l.class === "EROTIC" ? 0.1 : l.class === "SAFE" ? -0.1 : 0;
      s = Math.max(0, Math.min(1, s + nudge));
    }
  }
  return s;
}

export function decide(layers: LayerResult[]): FilterDecision {
  const acc = aggregateScore(layers);
  const { visible, classification } = scoreToDecision(acc.score, acc.classification);
  return {
    visible,
    classification,
    confidence: Math.round(acc.confidence * 100) / 100,
    reason: acc.topReason,
    layers,
  };
}

/**
 * Decide whether to consult the AI (Layer 9).
 *
 * This used to require the deterministic layers to *already* suspect an item
 * (`score <= 0.3 → skip`), which meant the AI could only ever confirm a hunch,
 * never find anything on its own. Every layer that runs at list level keys off
 * English phrases or the TMDB `adult` flag, so Korean/Japanese/Hindi softcore —
 * `adult=false`, neutral overview, sometimes no overview at all — scored a flat
 * 0 and was declared SAFE without the model ever seeing it.
 *
 * The gate is now inverted: silence from the deterministic layers is a reason
 * to ask, not a reason to skip. Only a decisive verdict short-circuits.
 * `prefetchAiClassifications` batches the whole page into one request, so
 * "ask more often" costs one API call per page rather than one per title.
 */
export function shouldInvokeAI(
  layers: LayerResult[],
  score: number,
): boolean {
  const hasL7Block = layers.some((l) => l.layer === 7 && l.decision === "BLOCK");
  if (hasL7Block) return false;

  const hasIdMatchBlock = layers.some(
    (l) => (l.layer === 2 || l.layer === 3) && l.decision === "BLOCK",
  );
  if (hasIdMatchBlock) return false;

  // Already blocked on deterministic evidence — the model can't add anything.
  if (score >= 0.85) return false;

  return true;
}