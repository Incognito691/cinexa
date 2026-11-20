import { notFound, redirect } from "next/navigation";

import { cutAtNextEpisode } from "@/features/title";
import { isUnreleased, isUnreleasedTitle } from "@/lib/release";
import { animeEpisodeFor, asAnimeCards } from "@/server/anilist/resolve";
import { fetchMoviePage, fetchTvPage } from "@/server/tmdb";
import {
  getResumePosition,
  getEpisodeProgress,
  isSignedIn,
} from "@/server/watch-history";

import { WatchView } from "./components/watch-view";

/*
 * The two watch screens, shared by `/watch/{tv,movie}/:id` and the anime
 * section's `/anime/:id/:slug/watch`, which differ only in their URLs.
 *
 * Server-only (TMDB, history), so this file stays out of the feature's
 * `index.ts`, which client components import.
 */

interface Paths {
  /** Episodes play here; `?season=&episode=` is appended. */
  watchPath: string;
  /** The title's detail page, for the player's "Details" link. */
  detailPath: string;
  /**
   * Always look the title up in the anime cross-reference. Otherwise only
   * titles TMDB files under Animation pay for it.
   */
  anime?: boolean;
}

export async function TvWatchScreen({
  tmdbId,
  season: requestedSeason,
  episode: requestedEpisode,
  watchPath,
  detailPath,
  anime: forceAnime,
}: Paths & { tmdbId: string; season?: number; episode?: number }) {
  const page = await fetchTvPage(tmdbId, requestedSeason ?? 1);
  if (!page) notFound();

  const { detail, selectedSeason, seasons, similar } = page;

  // Only aired episodes are playable. TMDB lists later ones as placeholders
  // ("Episode 9", nothing to stream), so the lists here show aired episodes
  // plus the single next one, greyed out with its air date, and Next stops
  // at the last aired episode.
  const cut = cutAtNextEpisode(page.episodes, null);
  const episodes = cut.visible.filter((e) => e.id !== cut.nextId);
  const nextUp = cut.visible.find((e) => e.id === cut.nextId);
  const upcoming = nextUp
    ? { episodeNumber: nextUp.episodeNumber, name: nextUp.name, airing: cut.airing }
    : null;
  const episode = requestedEpisode ?? episodes[0]?.episodeNumber ?? 1;
  const current = episodes.find((e) => e.episodeNumber === episode);

  // Seasons with something to play: TMDB also lists announced seasons with
  // no episodes or a future premiere, and picking one of those opened a
  // player for nothing. The season being viewed always stays listed.
  const playable = seasons.filter(
    (s) =>
      s.seasonNumber === selectedSeason ||
      (s.episodeCount > 0 && !isUnreleased(s.airDate) && (s.airDate !== null || s.seasonNumber === 0)),
  );
  // Prev/Next cross season boundaries, but never into specials (season 0).
  const numbered = playable.filter((s) => s.seasonNumber >= 1);
  const prevSeason = numbered.filter((s) => s.seasonNumber < selectedSeason).at(-1);
  const nextSeason = numbered.find((s) => s.seasonNumber > selectedSeason);
  const last = episodes.at(-1)?.episodeNumber;

  // The requested episode isn't in this season. One past the end is what a
  // "next episode" link looks like at a season boundary (Continue Watching
  // builds those), so roll into the next season; anything else clamps,
  // rather than embedding a player for an episode that doesn't exist.
  if (!current && episodes.length > 0 && last !== undefined) {
    const past = episode > last;
    if (episode === last + 1 && nextSeason) {
      redirect(`${watchPath}?season=${nextSeason.seasonNumber}&episode=1`);
    }
    const fallback = past ? last : episodes[0].episodeNumber;
    redirect(`${watchPath}?season=${selectedSeason}&episode=${fallback}`);
  }

  const index = episodes.findIndex((e) => e.episodeNumber === episode);
  const before = index > 0 ? episodes[index - 1] : undefined;
  const after = index >= 0 ? episodes[index + 1] : undefined;
  const href = (s: number, e: number) => `${watchPath}?season=${s}&episode=${e}`;
  const prev = before
    ? { href: href(selectedSeason, before.episodeNumber), label: `E${before.episodeNumber} · ${before.name}` }
    : prevSeason && selectedSeason >= 1
      ? { href: href(prevSeason.seasonNumber, prevSeason.episodeCount), label: `${prevSeason.name} finale` }
      : null;
  const next = after
    ? { href: href(selectedSeason, after.episodeNumber), label: `E${after.episodeNumber} · ${after.name}` }
    : nextSeason && selectedSeason >= 1 && !upcoming
      ? { href: href(nextSeason.seasonNumber, 1), label: `${nextSeason.name} · Episode 1` }
      : null;

  // Anime gets the anime player, which numbers episodes MAL's way.
  const animeLookup =
    forceAnime || detail.genres.includes("Animation")
      ? animeEpisodeFor(
          { tmdbId: detail.id, mediaType: "tv", season: selectedSeason, episode },
          seasons,
        ).catch(() => null)
      : null;

  // All no-op to empty/false/undefined when signed out — login is optional.
  // In the anime section, "more like this" keeps to anime, linked within it.
  const [anime, progress, signedIn, startAt, related] = await Promise.all([
    animeLookup,
    getEpisodeProgress(detail.id),
    isSignedIn(),
    getResumePosition({
      tmdbId: detail.id,
      mediaType: "tv",
      season: selectedSeason,
      episode,
    }),
    forceAnime ? asAnimeCards(similar) : similar,
  ]);

  return (
    <WatchView
      target={{
        tmdbId: detail.id,
        mediaType: "tv",
        season: selectedSeason,
        episode,
        anime: anime ?? undefined,
      }}
      title={detail.title}
      subtitle={[`S${selectedSeason} · E${episode}`, current?.name]
        .filter(Boolean)
        .join(" · ")}
      overview={current?.overview || undefined}
      detailHref={`${detailPath}?season=${selectedSeason}`}
      watchPath={watchPath}
      similar={related}
      episodes={episodes}
      upcoming={upcoming}
      currentEpisode={episode}
      seasons={playable}
      prev={prev}
      next={next}
      // Nothing in this season has aired: lock the player instead of
      // embedding a source that has nothing to show.
      locked={
        episodes.length === 0
          ? { releaseDate: page.episodes[0]?.airDate ?? detail.releaseDate }
          : undefined
      }
      watchedKeys={Object.keys(progress)}
      progress={progress}
      signedIn={signedIn}
      startAt={startAt}
    />
  );
}

export async function MovieWatchScreen({
  tmdbId,
  detailPath,
  anime: forceAnime,
}: Omit<Paths, "watchPath"> & { tmdbId: string }) {
  const page = await fetchMoviePage(tmdbId);
  if (!page) notFound();

  const { detail, similar } = page;
  const year = detail.releaseDate?.slice(0, 4);
  // Both no-op when signed out — login is optional.
  const [anime, signedIn, startAt, related] = await Promise.all([
    forceAnime || detail.genres.includes("Animation")
      ? animeEpisodeFor({ tmdbId: detail.id, mediaType: "movie" }).catch(() => null)
      : null,
    isSignedIn(),
    getResumePosition({ tmdbId: detail.id, mediaType: "movie" }),
    forceAnime ? asAnimeCards(similar) : similar,
  ]);

  return (
    <WatchView
      target={{ tmdbId: detail.id, mediaType: "movie", anime: anime ?? undefined }}
      title={detail.title}
      subtitle={[year, detail.genres.slice(0, 3).join(", ")]
        .filter(Boolean)
        .join(" · ")}
      overview={detail.overview}
      detailHref={detailPath}
      locked={isUnreleasedTitle(detail) ? { releaseDate: detail.releaseDate } : undefined}
      similar={related}
      signedIn={signedIn}
      startAt={startAt}
    />
  );
}
