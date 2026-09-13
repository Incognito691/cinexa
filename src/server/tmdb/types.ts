import type { MediaFilterItem } from "./mapper";

/**
 * Shape every TMDB list endpoint returns after mapping + content filtering.
 *
 * Was called `FetchTrendingResult` and declared separately in both services,
 * despite also being the return type of discover and search.
 */
export interface TmdbListResult {
  items: MediaFilterItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export type DiscoverCategory =
  | "popular"
  | "top_rated"
  | "now_playing"
  | "on_the_air";

/**
 * Default sort per category, used whenever the caller doesn't override it.
 *
 * `now_playing` and `on_the_air` sort by **popularity, not date**. Sorting a
 * date window by date returns whatever was added most recently, and TMDB holds
 * far more festival shorts and regional documentaries than notable releases —
 * so a date sort reliably surfaces titles nobody has heard of. What "now
 * playing" actually means is "popular among current releases", which is the
 * window plus a popularity sort. The window is what makes it *now*; the sort
 * is what makes it worth showing.
 */
export function sortByForCategory(category: DiscoverCategory): string {
  switch (category) {
    case "top_rated":
      return "vote_average.desc";
    case "now_playing":
    case "on_the_air":
    case "popular":
    default:
      return "popularity.desc";
  }
}

/** TMDB names the year filter differently per media type. */
export function yearParamFor(type: "movie" | "tv"): string {
  return type === "movie" ? "primary_release_year" : "first_air_date_year";
}

/** TMDB names the release-date filter differently per media type. */
export function dateParamFor(type: "movie" | "tv"): string {
  return type === "movie" ? "primary_release_date" : "first_air_date";
}

const DAY_MS = 86_400_000;
const isoDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);

/**
 * Vote-count floors — the single most effective quality signal TMDB exposes.
 *
 * A title nobody has rated is, almost by definition, a title nobody has
 * watched. The floors are deliberately different: a film released three weeks
 * ago hasn't had time to accumulate hundreds of votes, so holding recent
 * releases to the same bar as the back catalogue would empty the rail.
 */
const MIN_VOTES_RECENT = 20;
const MIN_VOTES_ANY = 80;

/**
 * Top Rated needs a far higher bar than the others, because `vote_average`
 * is a *raw* mean — TMDB's discover has no Bayesian weighting, so a title with
 * 378 votes at 8.9 outranks The Shawshank Redemption's 8.7 from 31,311.
 *
 * This number was measured, not guessed. Against live TMDB data:
 *   300  → "Accidental Partners" (378 votes) above Shawshank
 *   1000 → Shawshank finally appears, still 4th
 *   2500 → Shawshank, The Godfather, Godfather II, 12 Angry Men
 *   5000 → much the same, but drops well-received recent films
 * 2500 is the point where the canon surfaces without excluding modern work.
 */
const MIN_VOTES_ACCLAIM = 2500;

/**
 * Sanity bounds for a `/discover` request, per category.
 *
 * `/discover` has no idea what a category means — it only sorts. Asking it for
 * `primary_release_date.desc` with no ceiling returns TMDB's entire backlog of
 * unreleased placeholder entries, newest-fictional-date first: films dated
 * 2099, 2060, 2047, with no poster and no votes. That is what "Now Playing"
 * was showing.
 *
 * So each category carries the constraints that make its *name* true:
 *   - **now_playing / on_the_air** — a window ending today. "Now" means now,
 *     not "at some point this century".
 *   - **top_rated** — a vote floor. Sorting by `vote_average.desc` without one
 *     puts a film with a single 10/10 vote above every classic ever made.
 *   - **popular** — nothing but a ceiling; `popularity.desc` already buries
 *     entries nobody has heard of.
 *
 * Deliberately deterministic. A date being in the future is arithmetic, not a
 * judgement call, and nothing here should cost an AI request.
 */
export function discoverConstraints(
  category: DiscoverCategory,
  type: "movie" | "tv",
): Record<string, string | number> {
  const date = dateParamFor(type);

  switch (category) {
    case "now_playing":
      return {
        // Roughly a cinema run.
        [`${date}.gte`]: isoDay(-60),
        [`${date}.lte`]: isoDay(),
        "vote_count.gte": MIN_VOTES_RECENT,
        // Theatrical (3) or limited theatrical (2) — this is the difference
        // between "in cinemas" and "any file TMDB gained a record for this
        // month". Movies only; TMDB rejects it for TV.
        ...(type === "movie" ? { with_release_type: "2|3" } : {}),
      };
    case "on_the_air": {
      // `first_air_date` is when the *series premiered*, so a three-week
      // window on it only matches shows that launched this month — measured
      // against live TMDB, 4 results, all obscure. `air_date` matches
      // *episodes* airing in the window, which is what "on the air" means:
      // 248 results, led by Reacher and Lioness.
      const airField = type === "tv" ? "air_date" : date;
      return {
        [`${airField}.gte`]: isoDay(-21),
        [`${airField}.lte`]: isoDay(),
        "vote_count.gte": MIN_VOTES_RECENT,
      };
    }
    case "top_rated":
      return { [`${date}.lte`]: isoDay(), "vote_count.gte": MIN_VOTES_ACCLAIM };
    case "popular":
    default:
      return { [`${date}.lte`]: isoDay(), "vote_count.gte": MIN_VOTES_ANY };
  }
}
