/**
 * Manual whitelist — TMDB IDs / IMDb IDs that must always pass.
 * Overrides every other layer (Layer 8).
 */
export const MANUAL_WHITELIST: {
  tmdb: readonly number[];
  imdb: readonly string[];
} = {
  tmdb: [27205 /* Inception — example; remove if undesired */],
  imdb: ["tt1375666"],
};
