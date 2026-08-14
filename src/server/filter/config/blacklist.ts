/**
 * Manual blacklist — TMDB IDs / IMDb IDs that must always be hidden.
 * Hard veto (Layer 7). Add a TMDB ID here as soon as you spot a false negative.
 */
export const MANUAL_BLACKLIST: {
  tmdb: readonly number[];
  imdb: readonly string[];
} = {
  tmdb: [],
  imdb: [],
};
