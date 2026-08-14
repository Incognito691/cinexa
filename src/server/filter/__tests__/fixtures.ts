import type { FilterInput, ListLevelSignals } from "../types";

/**
 * Sample inputs for the filter pipeline tests.
 *
 * "list" inputs are shaped for the list-level pipeline (no keywords/companies/
 * networks). "full" inputs have every signal.
 */

const id = (n: number) => n;

export const list: ListLevelSignals[] = [
  // ── Whitelisted: passes even with adult=true ─────────────────────
  whitelistedEdgeCase(),

  // ── Blocklisted: hard veto ────────────────────────────────────────
  blockedManually(),

  // ── Legit mainstream content (must pass as SAFE) ────────────────
  inception(),
  psycho(),
  godfather(),
  rrr(),
  bollywoodRomance(),

  // ── Adult flag set but no other signals (must NOT auto-block) ──
  pink2016(),

  // ── Erotic-web-series shape: ULLU-style without network data ───
  ulluSoftcore(),
  ulluByCompanyId(),
  ulluByKeyword(),
  ulluOriginalsText(),
  ulluChachiIncest(),
  explicitWebSeries(),

  // ── Threshold cases ───────────────────────────────────────────
  borderlineMature(), // should resolve as MATURE (visible=true)
];

export const full: FilterInput[] = [
  inception(true) as FilterInput,
  godfather(true) as FilterInput,
  rrr(true) as FilterInput,
  ulluOnUlluNetwork(), // hard ID-match via networkId
  pink2016(true) as FilterInput,
  explicitWebSeries(true) as FilterInput,
  whitelistedEdgeCase(true) as FilterInput,
  blockedManually(true) as FilterInput,
];

// ────────── Fixture builders ──────────

function inception(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(27205),
    mediaType: "movie",
    adult: false,
    title: "Inception",
    overview:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
    genres: ["Action", "Science Fiction", "Adventure"],
    ...(detail
      ? {
          keywords: ["dream", "heist", "subconscious"],
          productionCompanyIds: [],
          networkIds: [],
        }
      : {}),
  };
}

function psycho(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(539),
    mediaType: "movie",
    adult: false,
    title: "Psycho",
    overview:
      "A Phoenix secretary embezzles money, checks into a remote motel run by a young man, and meets a violent end.",
    genres: ["Horror", "Mystery", "Thriller"],
    ...(detail
      ? { keywords: ["motel", "murder", "thriller"] }
      : {}),
  };
}

function godfather(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(238),
    mediaType: "movie",
    adult: false,
    title: "The Godfather",
    overview:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    genres: ["Drama", "Crime"],
    ...(detail
      ? { keywords: ["mafia", "crime family", "loyalty"] }
      : {}),
  };
}

function rrr(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(579974),
    mediaType: "movie",
    adult: false,
    title: "RRR",
    overview:
      "A fictitious story about two legendary revolutionaries and their journey away from home before they began fighting for their country in 1920s India.",
    genres: ["Action", "Drama", "Adventure"],
    ...(detail
      ? { keywords: ["freedom fighter", "british raj"] }
      : {}),
  };
}

function bollywoodRomance(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(194662),
    mediaType: "movie",
    adult: false,
    title: "Maine Pyar Kiya",
    overview:
      "A young man falls in love with a woman he meets while on a trip. The story follows their relationship and the obstacles they face.",
    genres: ["Drama", "Romance"],
  };
}

function pink2016(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(392044),
    mediaType: "movie",
    adult: true, // TMDB's adult flag is set
    title: "Pink",
    overview:
      "Three women, victims of an assault, navigate the social and legal aftermath against a backdrop of patriarchal attitudes.",
    genres: ["Drama", "Thriller", "Crime"],
    ...(detail
      ? { keywords: ["consent", "courtroom drama", "patriarchy"] }
      : {}),
  };
}

function ulluSoftcore(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(900001),
    mediaType: "movie",
    adult: true,
    title: "Husn",
    overview:
      "A lonely housewife explores forbidden desires with strangers in this softcore drama.",
    genres: ["Drama"],
  };
}

function ulluOnUlluNetwork(): FilterInput {
  return {
    tmdbId: 900001,
    mediaType: "tv",
    adult: true,
    title: "Husn",
    overview:
      "A lonely housewife explores forbidden desires with strangers in this softcore drama.",
    keywords: ["softcore", "housewife"],
    genres: ["Drama"],
    productionCompanyIds: [],
    networkIds: [9999 /* hypothetical ULLU TMDB network id */],
  };
}

function explicitWebSeries(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(900002),
    mediaType: "movie",
    adult: false,
    title: "After Dark",
    overview:
      "Bedroom scenes and sizzling encounters dominate this adult-only web series.",
    genres: ["Drama"],
    ...(detail
      ? { keywords: ["bedroom scene", "sizzling", "adult only"] }
      : {}),
  };
}

function borderlineMature(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(900003),
    mediaType: "movie",
    // adult=true ⇒ L1 contributes +0.8 (no L4/L5 corroboration) ⇒ score ≈ 0.7
    // ⇒ MATURE (visible=true) but not EROTIC/PORNOGRAPHIC.
    adult: true,
    title: "Behind Closed Doors",
    overview:
      "A married couple rekindles their love on a quiet weekend getaway.",
    genres: ["Drama", "Romance"],
  };
}

// ULLU scenarios — each exercises a different layer:
//   ulluByCompanyId — L3 hard-veto via production_companies match
//   ulluByKeyword    — L4 hard-veto via keyword substring match
//   ulluOriginalsText — L5 strong-signal via "ULLU Originals" in title/overview
function ulluByCompanyId(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(910000),
    mediaType: "tv",
    adult: false,
    title: "Palang Tod",
    overview: "An anthology series exploring modern relationships.",
    genres: ["Drama"],
  };
}
function ulluByKeyword(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(910001),
    mediaType: "tv",
    adult: false,
    title: "Husn Returns",
    overview: "A story of desire and betrayal.",
    genres: ["Drama"],
    keywords: ["ullu originals"],
  };
}
function ulluOriginalsText(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(910002),
    mediaType: "tv",
    adult: false,
    title: "Lock Up",
    overview: "A new Ullu Originals thriller series.",
    genres: ["Drama"],
  };
}

// Real TMDB fixture: Chachi No.1 (id 237560) is a 2018 ULLU web-series with
// a fully-clean TMDB list payload (adult=false, no keywords) — the only way
// to catch it at list time is via L5 text signals on the overview.
function ulluChachiIncest(): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(237560),
    mediaType: "tv",
    adult: false,
    title: "Chachi No.1",
    overview:
      "Harsh has come to visit his aunt at the village. Upon coming here, he notices that his aunt is not satisfied with his uncle physically, so his infatuation gets the better of him, as he starts getting closer to his aunt.",
    genres: ["Drama"],
  };
}

function whitelistedEdgeCase(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    tmdbId: id(27205), // matches the seeded MANUAL_WHITELIST.tmdb
    mediaType: "movie",
    adult: true, // would block on its own, but whitelist wins
    title: "Whitelisted Title",
    overview: "An ordinary production.",
    genres: ["Drama"],
    ...(detail
      ? { keywords: ["investigates", "courtroom drama"] }
      : {}),
  };
}

function blockedManually(detail = false): ListLevelSignals & Partial<FilterInput> {
  return {
    // The runtime blacklist is empty by default; we don't seed a real TMDB id here
    // to avoid false positives in unrelated envs. The test still asserts
    // that L7 (manual blacklist) is properly wired and short-circuits when
    // a match exists.
    tmdbId: id(0),
    mediaType: "movie",
    adult: false,
    title: "Manually Blocked Title",
    overview: "Title that, when added to the manual blacklist, should be hidden.",
    genres: ["Drama"],
    ...(detail
      ? { keywords: [] }
      : {}),
  };
}
