import { notFound, redirect } from "next/navigation";

import { cutAtNextEpisode } from "@/features/title";
import { animeEpisodeFor, asAnimeCards } from "@/server/anilist/resolve";
import { fetchMoviePage, fetchTvPage } from "@/server/tmdb";
import {
  getResumePosition,
  getWatchedEpisodes,
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

  // The requested episode isn't in this season. That's what a "next episode"
  // link looks like at a season boundary — roll into the next season if there
  // is one, otherwise clamp, rather than embedding a player for an episode
  // that doesn't exist.
  if (!current && episodes.length > 0) {
    const past = episode > episodes[episodes.length - 1].episodeNumber;
    const nextSeason = seasons.find((s) => s.seasonNumber > selectedSeason);
    if (past && nextSeason) {
      redirect(`${watchPath}?season=${nextSeason.seasonNumber}&episode=1`);
    }
    const fallback = past
      ? episodes[episodes.length - 1].episodeNumber
      : episodes[0].episodeNumber;
    redirect(`${watchPath}?season=${selectedSeason}&episode=${fallback}`);
  }

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
  const [anime, watchedKeys, signedIn, startAt, related] = await Promise.all([
    animeLookup,
    getWatchedEpisodes(detail.id),
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
      detailHref={`${detailPath}?season=${selectedSeason}`}
      watchPath={watchPath}
      similar={related}
      episodes={episodes}
      upcoming={upcoming}
      currentEpisode={episode}
      seasons={seasons}
      watchedKeys={watchedKeys}
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
      similar={related}
      signedIn={signedIn}
      startAt={startAt}
    />
  );
}
