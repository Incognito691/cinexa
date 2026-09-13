import { tmdbImage } from "@/lib/env";
import { isFinished, progressRatio, timeLeftLabel } from "@/lib/watch-progress";
import { fetchTitleDetail } from "@/server/tmdb";
import {
  getContinueWatching,
  type ContinueWatchingEntry,
} from "@/server/watch-history";

/** One card's worth of data: everything resolved, nothing left to fetch. */
export interface ContinueCard {
  key: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  backdropUrl: string | null;
  posterUrl: string | null;
  /** Where "resume" goes — the next episode when the last one finished. */
  href: string;
  /** "S1 · E4" or "Movie". */
  label: string;
  /** "32m left", or null when the provider never reported a runtime. */
  timeLeft: string | null;
  /** 0..1, or null when there's no runtime to measure against. */
  ratio: number | null;
}

/**
 * History rows → cards.
 *
 * History stores TMDB ids and seconds, so each card costs one (cached) TMDB
 * detail request for its title and artwork. A row whose title 404s or is now
 * filtered is dropped rather than rendered as a hole.
 */
export async function loadContinueCards(limit = 8): Promise<ContinueCard[]> {
  const entries = await getContinueWatching(limit);
  const cards = await Promise.all(entries.map(toCard));
  return cards.filter((card): card is ContinueCard => card !== null);
}

async function toCard(
  entry: ContinueWatchingEntry,
): Promise<ContinueCard | null> {
  const detail = await fetchTitleDetail(entry.mediaType, entry.tmdbId).catch(
    () => null,
  );
  if (!detail) return null;

  const { positionSeconds, runtimeSeconds } = entry;
  const done = isFinished(positionSeconds, runtimeSeconds);

  // A finished episode means "watch the next one". The watch page rolls a
  // past-the-end episode into the next season, so this doesn't need to know
  // how long the season is.
  const episode = entry.mediaType === "tv" && done
    ? entry.episode + 1
    : entry.episode;
  const resumedEpisode = episode !== entry.episode;

  return {
    key: `${entry.mediaType}:${entry.tmdbId}`,
    tmdbId: entry.tmdbId,
    mediaType: entry.mediaType,
    title: detail.title,
    backdropUrl: tmdbImage(detail.backdropPath, "w780") ?? null,
    posterUrl: tmdbImage(detail.posterPath, "w500") ?? null,
    href:
      entry.mediaType === "tv"
        ? `/watch/tv/${entry.tmdbId}?season=${entry.season}&episode=${episode}`
        : `/watch/movie/${entry.tmdbId}`,
    label:
      entry.mediaType === "tv" ? `S${entry.season} · E${episode}` : "Movie",
    // A card pointing at the *next* episode has no position of its own yet.
    timeLeft: resumedEpisode
      ? "Up next"
      : timeLeftLabel(positionSeconds, runtimeSeconds),
    ratio: resumedEpisode ? null : progressRatio(positionSeconds, runtimeSeconds),
  };
}
