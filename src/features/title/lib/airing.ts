import type { EpisodeAiring, NextAiring, TvEpisode } from "@/types/media";

export type { EpisodeAiring };

export interface EpisodeCut {
  /** Everything aired, plus the single next episode. */
  visible: TvEpisode[];
  /** The next episode, if one is still to air. */
  nextId: number | null;
  /** When it airs, if known. */
  airing: EpisodeAiring | null;
}

const DAY = 86_400;

/**
 * Which episodes to list, and when the next one airs.
 *
 * TMDB lists episodes well before they exist, as "Episode 9" with no still
 * and no overview, so only the next unaired one is shown. Once it airs the
 * following one takes its place, which keeps the list honest without
 * guessing a release cadence.
 *
 * TMDB only knows the day. When AniList's exact `nextAiring` is available
 * (anime), it's matched to the TMDB episode airing within a day of it, by
 * date rather than number, since AniList renumbers a split season's second
 * part from 1. That match also decides what counts as aired, so an episode
 * isn't kept as "today" after AniList has already moved past it.
 */
export function cutAtNextEpisode(
  episodes: TvEpisode[],
  nextAiring: NextAiring | null | undefined,
  now = Date.now() / 1000,
): EpisodeCut {
  const dayOf = (e: TvEpisode) => (e.airDate ? Date.parse(`${e.airDate}T00:00:00Z`) / 1000 : null);

  const anchor = nextAiring
    ? episodes.find((e) => {
        const day = dayOf(e);
        return day !== null && Math.abs(day - nextAiring.airingAt) <= 1.5 * DAY;
      })
    : undefined;

  const unaired = (e: TvEpisode) => {
    if (anchor) return e.episodeNumber >= anchor.episodeNumber;
    const day = dayOf(e);
    // No date at all means TMDB has a placeholder for it.
    return day === null || day + DAY > now;
  };

  const next = episodes.find(unaired);
  if (!next) return { visible: episodes, nextId: null, airing: null };

  const day = dayOf(next);
  const airing: EpisodeAiring | null =
    anchor && nextAiring && next.id === anchor.id
      ? { at: nextAiring.airingAt, mode: "time" }
      : day !== null
        ? { at: day, mode: "date" }
        : null;

  return {
    visible: episodes.filter((e) => !unaired(e) || e.id === next.id),
    nextId: next.id,
    airing,
  };
}
