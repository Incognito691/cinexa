import { describe, expect, it } from "vitest";

import type { TvEpisode } from "@/types/media";

import { cutAtNextEpisode } from "./airing";

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
const numbers = (c: { visible: TvEpisode[] }) => c.visible.map((e) => e.episodeNumber);

describe("cutAtNextEpisode", () => {
  it("lists aired episodes plus only the next, with AniList's exact time", () => {
    const cut = cutAtNextEpisode(episodes, { episode: 7, airingAt: ep7At }, NOW);
    expect(numbers(cut)).toEqual([6, 7]);
    expect(cut.nextId).toBe(1007);
    expect(cut.airing).toEqual({ at: ep7At, mode: "time" });
  });

  it("moves on once AniList does: after 7 airs, 8 is next", () => {
    const ep8At = ep7At + 7 * 86_400;
    // Still Nov 14, so TMDB's date alone would call ep 7 "today".
    const later = Date.parse("2026-11-14T16:00:00Z") / 1000;
    const cut = cutAtNextEpisode(episodes, { episode: 8, airingAt: ep8At }, later);
    expect(numbers(cut)).toEqual([6, 7, 8]);
    expect(cut.airing).toEqual({ at: ep8At, mode: "time" });
  });

  it("matches by air date, not episode number (split-cour numbering differs)", () => {
    const cut = cutAtNextEpisode(episodes, { episode: 1, airingAt: ep7At }, NOW);
    expect(cut.nextId).toBe(1007);
    expect(cut.airing?.mode).toBe("time");
  });

  it("falls back to TMDB's date without AniList, or when nothing lines up", () => {
    const noMatch = cutAtNextEpisode(episodes, { episode: 7, airingAt: ep7At + 60 * 86_400 }, NOW);
    for (const cut of [cutAtNextEpisode(episodes, null, NOW), noMatch]) {
      expect(numbers(cut)).toEqual([6, 7]);
      expect(cut.airing).toEqual({ at: Date.parse("2026-11-14T00:00:00Z") / 1000, mode: "date" });
    }
  });

  it("shows everything once a season has finished airing", () => {
    const done = [ep(1, "2020-01-01"), ep(2, "2020-01-08")];
    const cut = cutAtNextEpisode(done, null, NOW);
    expect(numbers(cut)).toEqual([1, 2]);
    expect(cut.nextId).toBeNull();
  });
});
