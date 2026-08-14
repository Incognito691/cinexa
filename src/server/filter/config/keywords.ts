/**
 * Blacklisted TMDB keywords. We match by lowercase substring on TMDB keyword names.
 *
 * Add deliberately — only terms that, on their own, identify erotic content.
 * Avoid words that are common in legitimate cinema ("war", "blood", "death" etc.)
 * even if they sometimes appear in adult catalogs.
 */
export const BLACKLISTED_KEYWORDS: readonly string[] = [
  "softcore",
  "soft-core",
  "erotic",
  "erotica",
  "pornographic",
  "porn",
  "explicit sex",
  "adult entertainment",
  "adult film",
  "sex film",
  "nudity (full)",
  "nudity (topless)",
  "striptease",
  "fetish",
  "bdsm",
  "erotic thriller",
  "sex comedy",
  "softcore sex",
  "voyeurism",
  "swinger",
  // Adult-platform brand names — TMDB doesn't tag these as networks/companies
  // consistently, so we also block on keyword presence.
  "ullu",
  "ullu originals",
  "kooku",
  "primeshots",
  "hunters",
  "rabbit movies",
  "moodx",
  "cineprime",
  "woow",
  "nuefliks",
  "hotx",
  "fliz movies",
  // Specific ULLU / adult-only web series title fragments.
  "charmsukh",
  "palang tod",
];
