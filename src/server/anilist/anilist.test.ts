import { describe, expect, it } from "vitest";

import { currentSeason, stripHtml } from "./home";
import { absoluteEpisode, buildMap, locateInParts, splitSeason } from "./resolve";

describe("splitSeason", () => {
  it("splits the season number off the title", () => {
    expect(splitSeason("Black Clover Season 2")).toEqual({ query: "Black Clover", season: 2 });
    expect(splitSeason("Black Clover 2nd Season")).toEqual({ query: "Black Clover", season: 2 });
    expect(splitSeason("Jujutsu Kaisen: Season 3 Part 2")).toEqual({ query: "Jujutsu Kaisen", season: 3 });
    expect(splitSeason("Frieren: Beyond Journey's End")).toEqual({ query: "Frieren: Beyond Journey's End" });
  });
});

describe("buildMap", () => {
  it("maps TV with its TMDB season, movies to their first id, and skips the rest", () => {
    const map = buildMap([
      { anilist_id: 145064, themoviedb_id: { tv: 95479 }, season: { tmdb: 2 } },
      { anilist_id: 199, themoviedb_id: { movie: [129, 999] } },
      { anilist_id: 5 },
    ]);
    expect(map.get(145064)).toEqual({ type: "tv", tmdbId: 95479, season: 2 });
    expect(map.get(199)).toEqual({ type: "movie", tmdbId: 129 });
    expect(map.has(5)).toBe(false);
  });
});

describe("home helpers", () => {
  it("uses AniList's season boundaries", () => {
    expect(currentSeason(new Date(2026, 10, 8)).label).toBe("Fall 2026");
    expect(currentSeason(new Date(2027, 0, 2)).season).toBe("WINTER");
  });

  it("strips AniList's HTML", () => {
    expect(stripHtml("A <i>boy</i>.<br><br>He&#039;s &quot;here&quot;.")).toBe(`A boy. He's "here".`);
  });
});

describe("anime episode mapping", () => {
  it("finds the part of a split season an episode falls in", () => {
    const parts = [
      { malId: 1, episodes: 12 },
      { malId: 2, episodes: null }, // second cour, still airing
    ];
    expect(locateInParts(parts, 5)).toEqual({ malId: 1, episode: 5 });
    expect(locateInParts(parts, 12)).toEqual({ malId: 1, episode: 12 });
    expect(locateInParts(parts, 13)).toEqual({ malId: 2, episode: 1 });
    expect(locateInParts([{ malId: 1, episodes: 12 }], 13)).toBeNull();
  });

  it("counts absolute episodes across seasons, ignoring specials", () => {
    const seasons = [
      { seasonNumber: 0, episodeCount: 5 },
      { seasonNumber: 1, episodeCount: 61 },
      { seasonNumber: 2, episodeCount: 16 },
    ];
    expect(absoluteEpisode(seasons, 1, 3)).toBe(3);
    expect(absoluteEpisode(seasons, 3, 2)).toBe(79);
  });
});
