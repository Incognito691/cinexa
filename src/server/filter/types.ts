/**
 * Content filter — shared types.
 *
 * Layer numbering matches the plan:
 *   8. Manual whitelist  (highest priority — short-circuit)
 *   7. Manual blacklist  (hard veto)
 *   1. TMDB adult flag (signal only)
 *   2. Network blacklist
 *   3. Production-company blacklist
 *   4. Keyword blacklist
 *   5. Overview/title/text analysis
 *   6. Genre (NEVER blocks)
 *   9. AI classifier (optional)
 *
 * Layer 10 is the aggregator in `confidence.ts` (not an individual layer).
 */

export type ContentClass =
  | "SAFE"
  | "MATURE"
  | "EROTIC"
  | "PORNOGRAPHIC";

export type LayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type LayerDecision = "PASS" | "BLOCK" | "NEUTRAL";

export interface LayerResult {
  layer: LayerNumber;
  decision: LayerDecision;
  /** When `decision === "BLOCK"`, the class contributed by this layer. */
  class?: ContentClass;
  /** 0..1, layer-local confidence. */
  confidence: number;
  /** Human-readable reason (used in `FilterDecision.reason`). */
  reason: string;
}

export interface FilterInput {
  tmdbId: number | string;
  mediaType: "movie" | "tv";
  /** TMDB `adult` field on list and detail payloads. */
  adult: boolean;
  title: string;
  overview: string;
  tagline?: string;
  /** Keyword names (or numeric IDs as strings) returned by TMDB. */
  keywords: string[];
  /** Genre names (or IDs as strings). */
  genres: string[];
  /** Numeric TMDB company IDs. Empty on list-level classification. */
  productionCompanyIds: number[];
  /** Numeric TMDB network IDs. Empty on list-level classification and on movies. */
  networkIds: number[];
  /** Optional — used for manual whitelist / blacklist lookup. */
  imdbId?: string;
}

/**
 * Final aggregated decision. `visible` is intentionally decoupled from
 * `classification` so the same scoring engine can later drive parental-control
 * settings (e.g. "show MATURE only when explicit opt-in is on").
 */
export interface FilterDecision {
  visible: boolean;
  classification: ContentClass;
  confidence: number; // 0..1
  reason: string; // top contributing layer
  /** All layer results, in evaluation order. */
  layers: LayerResult[];
}

/** What the list-level classifier knows about. */
export interface ListLevelSignals
  extends Omit<FilterInput, "tagline" | "productionCompanyIds" | "networkIds" | "imdbId" | "keywords"> {
  // tagline is allowed in list responses; keep it optional.
  tagline?: string;
  // keywords are returned on some list payloads (rarely). When absent the
  // layer self-skips.
  keywords?: string[];
}

export interface FilterConfigVersion {
  /** Bumped on each config edit to invalidate cached decisions. */
  version: number;
}
