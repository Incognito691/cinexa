import type { NextAiring, TvEpisode } from "@/types/media";

export interface EpisodeAiring {
  /** Unix seconds. */
  at: number;
  /** "time": exact air time; "date": a UTC calendar day only. */
  mode: "time" | "date";
  /** Projected from the next episode, not reported for this one. */
  estimated: boolean;
}

const DAY = 86_400;
const WEEK = 7 * DAY;

/**
 * When each upcoming episode airs.
 *
 * TMDB only knows the day. When AniList's exact `nextAiring` is available
 * (anime), it's matched to the TMDB episode airing within a day of it, which
 * is safer than trusting episode numbers, since AniList numbers a split
 * season's second part from 1. Later episodes are projected a week apart,
 * the usual simulcast cadence, and flagged as estimates. Everything else
 * upcoming falls back to TMDB's date.
 */
export function airingSchedule(
  episodes: TvEpisode[],
  nextAiring: NextAiring | null | undefined,
  now = Date.now() / 1000,
): Map<number, EpisodeAiring> {
  const out = new Map<number, EpisodeAiring>();
  const dayOf = (e: TvEpisode) => (e.airDate ? Date.parse(`${e.airDate}T00:00:00Z`) / 1000 : null);

  const anchor = nextAiring
    ? episodes.find((e) => {
        const day = dayOf(e);
        return day !== null && Math.abs(day - nextAiring.airingAt) <= 1.5 * DAY;
      })
    : undefined;

  for (const e of episodes) {
    const day = dayOf(e);
    if (anchor && nextAiring && e.episodeNumber >= anchor.episodeNumber) {
      const steps = e.episodeNumber - anchor.episodeNumber;
      out.set(e.id, { at: nextAiring.airingAt + steps * WEEK, mode: "time", estimated: steps > 0 });
    } else if (day !== null && day + DAY > now) {
      out.set(e.id, { at: day, mode: "date", estimated: false });
    }
  }
  return out;
}
