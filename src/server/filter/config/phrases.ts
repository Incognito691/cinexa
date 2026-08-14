/**
 * Text-analysis phrases used by Layer 5 on title + overview + tagline.
 *
 * Scoring rule:
 *   strongHit  = +1.0
 *   softHit    = +0.4
 *   storyHit   = −0.6  (actively reduces the score)
 *
 * Total ≥ 0.8 → strong EROTIC signal.
 * Total ≥ 0.4 → soft EROTIC signal.
 * Total <  0.4 → PASS.
 */

export const TEXT_STRONG_SIGNALS: readonly string[] = [
  "softcore",
  "soft-core",
  "erotic thriller",
  "forbidden desires",
  "forbidden desire",
  "sizzling",
  "steamy affair",
  "steamy romance",
  "bedroom scene",
  "intimate encounter",
  "adult content",
  "explicit scene",
  "uncensored",
  "after dark",
  "for adults only",
  "xxx",
  "18+ exclusive",
  // Adult-only OTT platform names — these only appear in titles/overviews of
  // their own content, so the false-positive risk is essentially zero.
  "ullu originals",
  "kooku originals",
  "primeshots originals",
  "hunters originals",
  "rabbit movies originals",
  "moodx originals",
  "cineprime originals",
  "woow originals",
  "nuefliks originals",
  "hotx originals",
  "fliz movies originals",
];

export const TEXT_SOFT_SIGNALS: readonly string[] = [
  "lonely housewife",
  "lonely wife",
  "secret affair",
  "torrid affair",
  "explores desire",
  "explores her desire",
  "explores his desire",
  "forbidden love",
  "midnight encounter",
  "adult drama",
  "mature themes",
  "sleepless nights",
  // Common ULLU / adult-web-series phrase patterns (English) — phrases that
  // appear predominantly in adult web-series overviews and rarely in
  // mainstream Soaps/movies. Each adds +0.4 to the L5 score.
  "sex sells",
  "secret desires",
  "hidden desires",
  "kinky",
  "seducing",
  "seduced",
  "seduce",
  "tempted",
  "temptation",
  // Patterns targeting ULLU's "web-series around the aunty / uncle / sister-
  // in-law / domestic worker" template. The combination of the family-role
  // term + a desire/physical phrase is the giveaway; alone, any of these
  // appears in mainstream family shows.
  "closer to his aunt",
  "closer to her uncle",
  "secretly admires",
  "infatuation",
  "gets the better of him",
  "gets the better of her",
  "not satisfied with his",
  "not satisfied with her",
  "unsatisfied husband",
  "unsatisfied wife",
  "pregnant by",
  "illegitimate child",
  "illegitimate baby",
];

export const TEXT_STORYTELLING_SIGNALS: readonly string[] = [
  "investigates",
  "investigation",
  "serial killer",
  "courtroom",
  "courtroom drama",
  "court trial",
  "war correspondent",
  "noir thriller",
  "cold case",
  "crime procedural",
  "true crime",
  "espionage",
  "court-martial",
  "war drama",
  "political thriller",
];
