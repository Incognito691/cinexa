import Link from "next/link";
import { Check, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaCardItem, TvEpisode, TvSeasonSummary } from "@/types/media";

import type { PlaybackTarget } from "../lib/sources";
import { EpisodeNav } from "./episode-nav";
import { WATCH_CHROME_PX } from "../lib/layout";
import { WatchPlayer } from "./watch-player";
import { WatchTracker } from "./watch-tracker";
import { SimilarGrid } from "@/features/title/components/parts";

interface WatchViewProps {
  target: PlaybackTarget;
  title: string;
  /** e.g. "S1 · E3 · Spoonful" — the line under the title. */
  subtitle?: string;
  /** Movies only — fills the control bar, which has no episode picker to hold. */
  overview?: string;
  /** Where the "details" link goes. */
  detailHref: string;
  similar: MediaCardItem[];
  /** TV only — powers the episode strip and the header nav. */
  episodes?: TvEpisode[];
  currentEpisode?: number;
  seasons?: TvSeasonSummary[];
  /** `s{n}e{n}` keys the signed-in user has already watched. */
  watchedKeys?: string[];
  signedIn?: boolean;
  /** Stored playback position for this exact title/episode, in seconds. */
  startAt?: number;
}

/**
 * The watch page: player first, everything else under it.
 *
 * Nothing here is heavier than it needs to be — the point of the page is the
 * picture, so metadata is a single line and the rest is navigation.
 */
export function WatchView({
  target,
  title,
  subtitle,
  overview,
  detailHref,
  similar,
  episodes,
  currentEpisode,
  seasons,
  watchedKeys = [],
  signedIn = false,
  startAt,
}: WatchViewProps) {
  const watched = new Set(watchedKeys);
  const isTv = target.mediaType === "tv";
  const season = target.season ?? 1;

  const episodeHref = (episodeNumber: number) =>
    `/watch/tv/${target.tmdbId}?season=${target.season ?? 1}&episode=${episodeNumber}`;

  return (
    <div
      className="-mx-1 space-y-5 pb-16 pt-2 sm:-mx-3 lg:-mx-4"
      style={{ "--watch-chrome": `${WATCH_CHROME_PX}px` } as React.CSSProperties}
    >
      {/* Navigation above the picture: on a player page the control you reach
          for is "next episode", and burying it under the frame means scrolling
          past the video to change what you're watching. The strip spans the
          full width now that the title has moved below. */}
      {/* `relative z-30` is load-bearing: the bar's `backdrop-blur` creates a
          stacking context, so its subtree paints atomically at the bar's place
          in document order — and the player, being a later sibling, painted on
          top of the open episode panel and swallowed the clicks. */}
      <header className="relative z-30 mx-auto w-full max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] px-4 sm:px-6">
        {/* One bar rather than loose pills: grouping the controls gives them a
            shared edge to breathe against, and keeps the row from reading as
            four unrelated buttons floating over the page. */}
        <div className="relative flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5 backdrop-blur-md">
          {isTv && seasons && episodes ? (
            <EpisodeNav
              tmdbId={target.tmdbId}
              seasons={seasons}
              episodes={episodes}
              season={season}
              episode={currentEpisode ?? 1}
              watchedKeys={watchedKeys}
              signedIn={signedIn}
            />
          ) : (
            // A movie has no episodes to pick, so the bar carries what it's
            // playing instead of sitting empty.
            // It's an `h1` because for a movie this is the page's only title —
            // the block under the player is TV-only.
            <div className="min-w-0 flex-1 px-3.5 py-1">
              <h1 className="truncate text-sm font-medium text-white">{title}</h1>
              {subtitle || overview ? (
                <p className="truncate text-xs text-white/45">
                  {[subtitle, overview].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          )}

          <span aria-hidden className="h-6 w-px shrink-0 bg-white/[0.08]" />

          <Link
            href={detailHref}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Details</span>
          </Link>
        </div>
      </header>

      {/* Position tracking runs for both media types. Only the *dwell* half is
          TV-exempt, because `EpisodeNav` already runs that timer to drive its
          watched tick. */}
      <WatchTracker
        target={target}
        signedIn={signedIn}
        dwellFallback={!isTv}
      />

      <WatchPlayer target={target} title={title} startAt={startAt} />

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 sm:px-6">
        {isTv ? (
          <div className="min-w-0 pt-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-white/55">{subtitle}</p>
            ) : null}
          </div>
        ) : null}

        {episodes && episodes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white/80">
              Season {season}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {episodes.map((episode) => {
                const active = episode.episodeNumber === currentEpisode;
                return (
                  <li key={episode.id}>
                    <Link
                      href={episodeHref(episode.episodeNumber)}
                      aria-current={active ? "page" : undefined}
                      title={episode.name}
                      className={cn(
                        "block min-w-[3rem] rounded-lg border px-3 py-2 text-center text-xs font-medium transition",
                        active
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        {episode.episodeNumber}
                        {watched.has(`s${season}e${episode.episodeNumber}`) ? (
                          <Check
                            className={cn(
                              "h-3 w-3",
                              active ? "text-primary-foreground" : "text-emerald-400",
                            )}
                            aria-label="Watched"
                          />
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <SimilarGrid
          items={similar}
          title={target.mediaType === "movie" ? "More like this" : "More shows like this"}
        />
      </div>
    </div>
  );
}
