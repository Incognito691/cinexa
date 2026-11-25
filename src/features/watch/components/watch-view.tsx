import Link from "next/link";
import { ArrowLeft, Info, Lock } from "lucide-react";

import { releaseLabel } from "@/lib/release";
import type { MediaCardItem, TvEpisode, TvSeasonSummary, UpcomingEpisode } from "@/types/media";

import type { PlaybackTarget } from "../lib/sources";
import { CinemaGate } from "./cinema-gate";
import { EpisodeNav, type EpisodeStep } from "./episode-nav";
import { WATCH_CHROME_PX } from "../lib/layout";
import { WatchPlayer } from "./watch-player";
import { WatchTracker } from "./watch-tracker";
import { SimilarGrid } from "@/features/title/components/parts";

interface WatchViewProps {
  target: PlaybackTarget;
  title: string;
  /** e.g. "S1 · E3 · Spoonful" — the line under the title. */
  subtitle?: string;
  /** The movie's or the episode's overview, shown under the title. */
  overview?: string;
  /** Where the "details" link goes. */
  detailHref: string;
  /**
   * Base URL episodes play at; `?season=&episode=` is appended. Defaults to
   * `/watch/tv/:id`. Anime passes `/anime/:id/:slug/watch` so it never
   * leaves its own section.
   */
  watchPath?: string;
  similar: MediaCardItem[];
  /** TV only — the aired episodes of this season, for the picker. */
  episodes?: TvEpisode[];
  /** The next, not-yet-aired episode: listed, but not playable. */
  upcoming?: UpcomingEpisode | null;
  currentEpisode?: number;
  /** TV only — seasons that have something to play. */
  seasons?: TvSeasonSummary[];
  /** TV only — resolved by the server, season boundaries included. */
  prev?: EpisodeStep | null;
  next?: EpisodeStep | null;
  /** Set when there's nothing to play yet; replaces the player. */
  locked?: { releaseDate: string | null };
  /** Movie only showing in cinemas: a panel stands in for the player. */
  inCinemas?: { digital: string | null; trailerKey?: string };
  /** `s{n}e{n}` keys the signed-in user has already watched. */
  watchedKeys?: string[];
  /** Per-episode progress (0..1, null = watched with no runtime), same keys. */
  progress?: Record<string, number | null>;
  signedIn?: boolean;
  /** Stored playback position for this exact title/episode, in seconds. */
  startAt?: number;
}

const FRAME_WIDTH = "max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))]";

/**
 * The watch page: control bar, player, then what's playing and what's next.
 *
 * There is exactly one episode control, the picker in the bar. A second strip
 * of numbered buttons used to sit under the player; two controls for one
 * choice only raised the question of which to use.
 */
export function WatchView({
  target,
  title,
  subtitle,
  overview,
  detailHref,
  watchPath,
  similar,
  episodes,
  upcoming,
  currentEpisode,
  seasons,
  prev = null,
  next = null,
  locked,
  inCinemas,
  watchedKeys = [],
  progress = {},
  signedIn = false,
  startAt,
}: WatchViewProps) {
  const isTv = target.mediaType === "tv";
  const season = target.season ?? 1;
  const playPath = watchPath ?? `/watch/tv/${target.tmdbId}`;
  const releases = releaseLabel(locked?.releaseDate);

  return (
    <div
      className="-mx-1 space-y-5 pb-16 pt-2 sm:-mx-3 lg:-mx-4"
      style={{ "--watch-chrome": `${WATCH_CHROME_PX}px` } as React.CSSProperties}
    >
      {/* Navigation above the picture: on a player page the control you reach
          for is "next episode", and burying it under the frame means scrolling
          past the video to change what you're watching. `relative z-30` keeps
          the open episode panel above the player, a later sibling. */}
      <header className={`relative z-30 mx-auto w-full ${FRAME_WIDTH} px-4 sm:px-6`}>
        <div className="relative flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0e0e10] p-1.5">
          {/* Back to the title's page. One control on the left instead of a
              "Details" link on the right: it's where the eye starts. */}
          <Link
            href={detailHref}
            aria-label="Back to details"
            title="Back to details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/65 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>

          {isTv && seasons && episodes ? (
            <EpisodeNav
              tmdbId={target.tmdbId}
              watchPath={playPath}
              seasons={seasons}
              episodes={episodes}
              upcoming={upcoming}
              season={season}
              episode={currentEpisode ?? 1}
              prev={prev}
              next={next}
              watchedKeys={watchedKeys}
              progress={progress}
              signedIn={signedIn && !locked}
            />
          ) : (
            // A movie has no episodes to pick, so the bar just names it. The
            // page's `h1` and the overview sit under the player.
            <div className="min-w-0 flex-1 px-1.5 py-1">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              {subtitle ? <p className="truncate text-xs text-white/45">{subtitle}</p> : null}
            </div>
          )}
        </div>
      </header>

      {locked ? (
        <div className={`mx-auto w-full ${FRAME_WIDTH}`}>
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_40%,rgba(229,9,20,0.14),transparent_60%)] bg-black">
            <div className="max-w-md space-y-4 px-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <Lock className="h-6 w-6 text-white/80" aria-hidden />
              </span>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-white">Not released yet</h2>
                <p className="text-sm leading-relaxed text-white/60">
                  {releases
                    ? `${title} comes out on ${releases}. It unlocks here once it's released.`
                    : `${title} doesn't have a release date yet. It unlocks here once it's released.`}
                </p>
              </div>
              <Link
                href={detailHref}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              >
                <Info className="h-4 w-4" aria-hidden /> View details
              </Link>
            </div>
          </div>
        </div>
      ) : inCinemas ? (
        <CinemaGate
          title={title}
          digital={inCinemas.digital}
          trailerKey={inCinemas.trailerKey}
          frameWidth={FRAME_WIDTH}
        >
          <WatchTracker target={target} signedIn={signedIn} dwellFallback={!isTv} />
          <WatchPlayer target={target} title={title} startAt={startAt} />
        </CinemaGate>
      ) : (
        <>
          {/* Position tracking runs for both media types. Only the *dwell*
              half is TV-exempt, because `EpisodeNav` already runs that timer
              to drive its watched tick. */}
          <WatchTracker target={target} signedIn={signedIn} dwellFallback={!isTv} />
          <WatchPlayer
            target={target}
            title={title}
            startAt={startAt}
            nextHref={next?.href}
            watchPath={isTv ? playPath : undefined}
          />
        </>
      )}

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 sm:px-6">
        <div className="min-w-0 max-w-3xl pt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
          {overview ? (
            <p className="mt-3 text-sm leading-relaxed text-white/65">{overview}</p>
          ) : null}
        </div>

        <SimilarGrid
          items={similar}
          title={target.mediaType === "movie" ? "More like this" : "More shows like this"}
        />
      </div>
    </div>
  );
}
