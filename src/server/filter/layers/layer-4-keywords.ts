import type { FilterInput, LayerResult } from "../types";
import { BLACKLISTED_KEYWORDS } from "../config/keywords";
import { normalize } from "../text-analysis";

/**
 * Layer 4 — Keyword blacklist.
 *
 * TMDB keywords come back as a list of strings (or as numeric IDs).
 * We do a case-insensitive substring match against the configured list.
 * Numeric IDs are coerced to strings for comparison.
 */
export function layer4Keywords(input: FilterInput): LayerResult {
  const keywords = (input.keywords ?? []) as string[];

  // If we have a title/overview/tagline (always available) we can also scan
  // those for the blocked keywords — list payloads don't carry the keyword
  // list but the text is there. This is what catches "CharmSukh" or
  // "Palang Tod" style titles on platforms that don't tag adult content
  // in the structured keyword field.
  const haystack = [
    input.title ?? "",
    input.overview ?? "",
    input.tagline ?? "",
  ];

  const blocked = BLACKLISTED_KEYWORDS.map(normalize);
  const hits: string[] = [];
  for (const raw of [...keywords, ...haystack]) {
    const needle = normalize(String(raw));
    for (let i = 0; i < blocked.length; i++) {
      if (needle.includes(blocked[i])) {
        hits.push(BLACKLISTED_KEYWORDS[i]);
      }
    }
  }

  if (!keywords.length && !haystack.some((h) => h.length > 0)) {
    return {
      layer: 4,
      decision: "PASS",
      confidence: 0,
      reason: "no keywords (list-level)",
    };
  }

  if (hits.length > 0) {
    return {
      layer: 4,
      decision: "BLOCK",
      class: "EROTIC",
      confidence: 0.85,
      reason: `keyword(s): ${[...new Set(hits)].join(", ")}`,
    };
  }

  return {
    layer: 4,
    decision: "PASS",
    confidence: 0,
    reason: "no blacklisted keywords",
  };
}
