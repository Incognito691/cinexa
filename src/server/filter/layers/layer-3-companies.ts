import type { FilterInput, LayerResult } from "../types";
import { BLACKLISTED_COMPANIES } from "../config/companies";

/**
 * Layer 3 — Production-company blacklist.
 * Matches by **numeric TMDB company IDs**, skipped silently if absent.
 */
export function layer3Companies(input: FilterInput): LayerResult {
  const companyIds = input.productionCompanyIds ?? [];
  if (!companyIds.length) {
    return {
      layer: 3,
      decision: "PASS",
      confidence: 0,
      reason: "no productionCompanyIds",
    };
  }

  const blocked = new Set<number>(BLACKLISTED_COMPANIES.ids);
  const hits = companyIds.filter((id) => blocked.has(id));

  if (hits.length > 0) {
    return {
      layer: 3,
      decision: "BLOCK",
      class: "EROTIC",
      confidence: 0.9,
      reason: `company on blacklist: ids=${hits.join(", ")}`,
    };
  }

  return {
    layer: 3,
    decision: "PASS",
    confidence: 0,
    reason: "no blacklisted companies",
  };
}
