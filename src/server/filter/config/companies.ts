/**
 * Blacklisted production companies — runtime matches by **numeric TMDB company IDs**.
 * `names` is admin reference only.
 */
export const BLACKLISTED_COMPANIES = {
  ids: [
    134066, // Ullu
    // Add more integer IDs from TMDB `/company/{id}` lookups.
  ],
  names: [
    "Ullu",
    "Addictive Pictures",
    "Balaji Telefilms (Adult)",
    "Ullu Digital",
    "Kooku Originals",
    "Pocket Aces (Adult)",
    "VB on the web",
  ],
} as const;
