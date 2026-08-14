import type {
  FilterDecision,
  FilterInput,
  LayerResult,
  ListLevelSignals,
} from "./types";

import { layer1Adult } from "./layers/layer-1-adult";
import { layer2Networks } from "./layers/layer-2-networks";
import { layer3Companies } from "./layers/layer-3-companies";
import { layer4Keywords } from "./layers/layer-4-keywords";
import { layer5Text } from "./layers/layer-5-text-analysis";
import { layer6Genres } from "./layers/layer-6-genres";
import { layer7ManualBlacklist } from "./layers/layer-7-manual-blacklist";
import { layer8ManualWhitelist } from "./layers/layer-8-manual-whitelist";
import { layer9Ai, classifyWithAI } from "./layers/layer-9-ai";
import { decide, shouldInvokeAI } from "./confidence";

/**
 * Runs all 10 layers in priority order and aggregates them into a FilterDecision.
 *
 * Generic over T so callers can pass list-level inputs (no keywords/companies/
 * networks) or detail inputs (full FilterInput). T must satisfy the minimum
 * structural requirements the layers need.
 */
export async function runPipeline<T extends ListLevelSignals>(
  input: T,
): Promise<FilterDecision> {
  // Coerce to a full FilterInput once so layers get the shape they expect.
  const fullInput = toFilterInput(input);

  // ── Whitelist (L8) — highest priority ─────────────────────────────
  const l8 = layer8ManualWhitelist(fullInput);
  if (l8.decision === "PASS" && l8.confidence === 1) {
    return {
      visible: true,
      classification: "SAFE",
      confidence: 1,
      reason: l8.reason,
      layers: [l8],
    };
  }

  // ── Blacklist (L7) — hard veto ───────────────────────────────────
  const l7 = layer7ManualBlacklist(fullInput);
  if (l7.decision === "BLOCK") {
    return {
      visible: false,
      classification: "PORNOGRAPHIC",
      confidence: 1,
      reason: l7.reason,
      layers: [l7],
    };
  }

  // ── Synchronous layers ───────────────────────────────────────────
  const l1 = layer1Adult(fullInput);
  const l5 = layer5Text(fullInput);
  const l6 = layer6Genres(fullInput);
  const l2 = layer2Networks(fullInput);
  const l3 = layer3Companies(fullInput);
  const l4 = layer4Keywords(fullInput);

  const syncLayers: LayerResult[] = [l1, l2, l3, l4, l5, l6];

  // ── L9 (AI) — gated so ~90 % of items stay deterministic ─────────
  const aiNeeded = shouldInvokeAI(syncLayers, scoreOfLayers(syncLayers));
  const l9: LayerResult = aiNeeded
    ? await runAiLayer(fullInput)
    : {
        layer: 9,
        decision: "NEUTRAL",
        confidence: 0,
        reason: "AI not invoked",
      };

  return decide([...syncLayers, l9, l8, l7]);
}

async function runAiLayer(input: FilterInput): Promise<LayerResult> {
  const result = await classifyWithAI(input, {
    keywords: input.keywords,
    genres: input.genres,
  });
  return layer9Ai(input, result);
}

/**
 * Coerce a list-level payload (or any looser shape) into a full FilterInput
 * for the layers. Anything not present in the loose shape becomes an empty
 * array / undefined; the layers self-skip on those.
 */
function toFilterInput(input: ListLevelSignals): FilterInput {
  return {
    tmdbId: input.tmdbId ?? "",
    mediaType: input.mediaType ?? "movie",
    adult: input.adult ?? false,
    title: input.title ?? "",
    overview: input.overview ?? "",
    tagline: input.tagline,
    keywords: input.keywords ?? [],
    genres: input.genres ?? [],
    productionCompanyIds: [],
    networkIds: [],
    imdbId: undefined,
  };
}

/**
 * Compute the raw weighted score (0..1) used for AI gating.
 * Mirrors the aggregation logic in `confidence.ts` but returns only the number.
 */
function scoreOfLayers(layers: LayerResult[]): number {
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
