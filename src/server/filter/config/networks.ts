/**
 * Blacklisted TV networks — the runtime layer matches by **numeric TMDB network IDs**.
 *
 * The `names` array is provided as admin reference only — runtime never name-matches.
 * To populate `ids`, look up the network on TMDB (`/network/{id}` or the
 * `/tv/{id}/watch/providers` endpoints) and enter the integer IDs.
 */
export const BLACKLISTED_NETWORKS = {
  ids: [
    2902, // ULLU
  ],
  names: [
    "ULLU",
    "Kooku",
    "PrimeShots",
    "Hunters",
    "Rabbit Movies",
    "MoodX",
    "CinePrime",
    "Woow",
    "NueFliks",
    "HotX",
    "Fliz Movies",
  ],
} as const;
