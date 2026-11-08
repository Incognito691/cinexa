import { describe, expect, it } from "vitest";

import type { TvEpisode } from "@/types/media";

import { airingSchedule } from "./airing";

const ep = (n: number, airDate: string | null): TvEpisode => ({
  id: 1000 + n,
  episodeNumber: n,
  seasonNumber: 2,
  name: `Episode ${n}`,
  overview: "",
  stillPath: null,
  airDate,
  runtime: 24,
  rating: 0,
});

// Black Clover S2 as TMDB has it: weekly Saturdays, ep 7 on Nov 14.
const episodes = [ep(6, "2026-11-07"), ep(7, "2026-11-14"), ep(8, "2026-11-21"), ep(9, null)];
const NOW = Date.parse("2026-11-08T12:00:00Z") / 1000;
// AniList's exact time for ep 7: 2026-11-14 14:00 UTC.
const ep7At = Date.parse("2026-11-14T14:00:00Z") / 1000;

describe("airingSchedule", () => {
  it("uses AniList's exact time for the matching episode and projects weekly after it", () => {
    const s = airingSchedule(episodes, { episode: 7, airingAt: ep7At }, NOW);
    expect(s.has(1006)).toBe(false); // already aired
    expect(s.get(1007)).toEqual({ at: ep7At, mode: "time", estimated: false });
    expect(s.get(1008)).toEqual({ at: ep7At + 7 * 86_400, mode: "time", estimated: true });
    expect(s.get(1009)?.estimated).toBe(true); // no TMDB date, still projected
  });

  it("matches by air date, not episode number (split-cour numbering differs)", () => {
    const s = airingSchedule(episodes, { episode: 1, airingAt: ep7At }, NOW);
    expect(s.get(1007)?.mode).toBe("time");
  });

  it("falls back to TMDB dates without AniList, or when nothing lines up", () => {
    const noMatch = airingSchedule(episodes, { episode: 7, airingAt: ep7At + 60 * 86_400 }, NOW);
    for (const s of [airingSchedule(episodes, null, NOW), noMatch]) {
      expect(s.get(1007)).toEqual({ at: Date.parse("2026-11-14T00:00:00Z") / 1000, mode: "date", estimated: false });
      expect(s.has(1006)).toBe(false);
      expect(s.has(1009)).toBe(false); // no date, nothing to show
    }
  });
});
