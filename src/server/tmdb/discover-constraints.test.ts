import { describe, expect, it } from "vitest";

import { discoverConstraints, sortByForCategory } from "./types";

/**
 * Guards for the `/discover` sanity bounds.
 *
 * These exist because the rails shipped broken twice in a row, both times from
 * a plausible-looking one-line change:
 *
 *  1. `now_playing` sorted by `primary_release_date.desc` with no ceiling, so
 *     TMDB returned its backlog of unreleased placeholders — films dated 2099,
 *     2060, 2047, no poster, no votes.
 *  2. Adding the ceiling fixed the dates but not the quality: a date sort over
 *     a date window still surfaces whatever was added most recently, which is
 *     overwhelmingly festival shorts nobody has rated.
 *
 * Neither was catchable by typecheck, and both looked fine until someone
 * opened the page. The assertions below are the cheap version of opening the
 * page.
 */

const today = () => new Date().toISOString().slice(0, 10);

describe("release-date ceilings", () => {
  it("never lets an unreleased title through, on any category", () => {
    // The 2099 bug. Every category needs an upper bound on the date, or
    // `/discover` happily returns things that do not exist yet.
    for (const category of [
      "popular",
      "top_rated",
      "now_playing",
      "on_the_air",
    ] as const) {
      for (const type of ["movie", "tv"] as const) {
        const c = discoverConstraints(category, type);
        const ceiling = Object.entries(c).find(([k]) => k.endsWith(".lte"));
        expect(ceiling, `${category}/${type} has no date ceiling`).toBeDefined();
        expect(String(ceiling?.[1]) <= today()).toBe(true);
      }
    }
  });
});

describe("quality floors", () => {
  it("requires votes on every category", () => {
    // A title nobody has rated is a title nobody has watched.
    for (const category of [
      "popular",
      "top_rated",
      "now_playing",
      "on_the_air",
    ] as const) {
      expect(
        discoverConstraints(category, "movie")["vote_count.gte"],
        `${category} has no vote floor`,
      ).toBeGreaterThan(0);
    }
  });

  it("holds top_rated to a far higher bar than the rest", () => {
    // `vote_average` is a raw mean, so a low floor lets a 378-vote title
    // outrank The Shawshank Redemption. Measured: 2500 is where the canon
    // surfaces.
    const acclaim = discoverConstraints("top_rated", "movie")[
      "vote_count.gte"
    ] as number;
    const popular = discoverConstraints("popular", "movie")[
      "vote_count.gte"
    ] as number;

    expect(acclaim).toBeGreaterThanOrEqual(2500);
    expect(acclaim).toBeGreaterThan(popular * 10);
  });

  it("goes easier on recent releases than the back catalogue", () => {
    // Three weeks isn't long enough to accumulate hundreds of votes; holding
    // new releases to the catalogue bar would empty the rail.
    const recent = discoverConstraints("now_playing", "movie")[
      "vote_count.gte"
    ] as number;
    const any = discoverConstraints("popular", "movie")[
      "vote_count.gte"
    ] as number;
    expect(recent).toBeLessThan(any);
  });
});

describe("per-media-type fields", () => {
  it("filters now_playing movies to theatrical releases", () => {
    expect(discoverConstraints("now_playing", "movie").with_release_type).toBe(
      "2|3",
    );
  });

  it("never sends with_release_type for TV — TMDB rejects it", () => {
    expect(
      discoverConstraints("now_playing", "tv").with_release_type,
    ).toBeUndefined();
    expect(
      discoverConstraints("on_the_air", "tv").with_release_type,
    ).toBeUndefined();
  });

  it("uses episode air dates for on-the-air TV, not the series premiere", () => {
    // `first_air_date` is when the series *started*, so a three-week window on
    // it matched 4 obscure shows. `air_date` matched 248, led by Reacher.
    const tv = discoverConstraints("on_the_air", "tv");
    expect(tv["air_date.gte"]).toBeDefined();
    expect(tv["first_air_date.gte"]).toBeUndefined();
  });

  it("uses first_air_date for the other TV categories", () => {
    expect(discoverConstraints("popular", "tv")["first_air_date.lte"]).toBeDefined();
    expect(discoverConstraints("top_rated", "tv")["first_air_date.lte"]).toBeDefined();
  });

  it("names the movie date field primary_release_date", () => {
    expect(
      discoverConstraints("popular", "movie")["primary_release_date.lte"],
    ).toBeDefined();
  });
});

describe("sort order", () => {
  it("sorts current releases by popularity, never by date", () => {
    // A date sort over a date window returns the most recently *added* title,
    // which on TMDB is almost always something nobody has heard of.
    expect(sortByForCategory("now_playing")).toBe("popularity.desc");
    expect(sortByForCategory("on_the_air")).toBe("popularity.desc");
  });

  it("still sorts top_rated by score", () => {
    expect(sortByForCategory("top_rated")).toBe("vote_average.desc");
  });
});
