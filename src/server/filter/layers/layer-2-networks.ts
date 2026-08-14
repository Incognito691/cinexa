import type { FilterInput, LayerResult } from "../types";
import { BLACKLISTED_NETWORKS } from "../config/networks";

/**
 * Layer 2 — Network blacklist.
 *
 * Matches by **numeric TMDB network IDs**. If `networkIds` is empty
 * (list-level payload, or a movie) the layer is skipped silently
 * rather than falling back to name matching.
 */
export function layer2Networks(input: FilterInput): LayerResult {
  const networkIds = input.networkIds ?? [];
  if (!networkIds.length) {
    return {
      layer: 2,
      decision: "PASS",
      confidence: 0,
      reason: "no networkIds (list-level or movie)",
    };
  }

  const blocked = new Set<number>(BLACKLISTED_NETWORKS.ids);
  const hits = networkIds.filter((id) => blocked.has(id));

  if (hits.length > 0) {
    return {
      layer: 2,
      decision: "BLOCK",
      class: "EROTIC",
      confidence: 0.9,
      reason: `network on blacklist: ids=${hits.join(", ")}`,
    };
  }

  return {
    layer: 2,
    decision: "PASS",
    confidence: 0,
    reason: "no blacklisted networks",
  };
}
