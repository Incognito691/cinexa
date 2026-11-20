"use client";

import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { markWatched, toggleWatched } from "@/server/watch-history";
import type { TvEpisode, TvSeasonSummary, UpcomingEpisode } from "@/types/media";

import { EpisodePicker } from "./episode-picker";
import { AUTO_MARK_MS } from "./watch-tracker";

/** A Prev/Next target, resolved on the server (it can cross seasons). */
export interface EpisodeStep {
  href: string;
  /** e.g. "E4 · Phantom Traveler" or "Season 2 · Episode 1". */
  label: string;
}

interface EpisodeNavProps {
  tmdbId: number;
  /** e.g. `/watch/tv/73223`; `?season=&episode=` is appended. */
  watchPath: string;
  seasons: TvSeasonSummary[];
  episodes: TvEpisode[];
  /** The next, not-yet-aired episode; shown in the picker, never navigated to. */
  upcoming?: UpcomingEpisode | null;
  season: number;
  episode: number;
  prev: EpisodeStep | null;
  next: EpisodeStep | null;
  /** `s{n}e{n}` keys already watched. */
  watchedKeys: string[];
  progress: Record<string, number | null>;
  /** Server-resolved: hide the watched control entirely when signed out. */
  signedIn: boolean;
}

/**
 * Watch-page controls: the episode picker, Prev/Next, and the watched toggle.
 *
 * Prev/Next are text rather than arrow buttons on purpose — alongside the
 * picker's chevron they'd put three arrows in a row, which is what made the
 * previous version read as noise.
 *
 * Auto-marking is a dwell timer, not a progress signal: the player is a
 * cross-origin iframe, so we genuinely cannot see how much was watched. Sitting
 * on the episode for {@link AUTO_MARK_MS} is the best proxy available, and the
 * tick stays manually toggleable precisely because that proxy is imperfect.
 */
export function EpisodeNav({
  tmdbId,
  watchPath,
  seasons,
  episodes,
  upcoming,
  season,
  episode,
  prev,
  next,
  watchedKeys,
  progress,
  signedIn,
}: EpisodeNavProps) {
  const watched = new Set(watchedKeys);
  const isCurrentWatched = watched.has(`s${season}e${episode}`);

  const [isWatched, setIsWatched] = useState(isCurrentWatched);
  const [pending, startTransition] = useTransition();

  // Server state wins whenever we navigate to a different episode.
  useEffect(
    () => setIsWatched(isCurrentWatched),
    [isCurrentWatched, season, episode],
  );

  useEffect(() => {
    if (!signedIn || isWatched) return;
    const timer = setTimeout(() => {
      void markWatched({ tmdbId, mediaType: "tv", season, episode }).then(
        (ok) => ok && setIsWatched(true),
      );
    }, AUTO_MARK_MS);
    return () => clearTimeout(timer);
  }, [signedIn, isWatched, tmdbId, season, episode]);

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <EpisodePicker
        watchPath={watchPath}
        seasons={seasons}
        episodes={episodes}
        upcoming={upcoming}
        season={season}
        episode={episode}
        watched={watched}
        progress={progress}
      />

      <Step step={prev} direction="prev" />
      <Step step={next} direction="next" />

      {signedIn ? (
        <button
          type="button"
          aria-pressed={isWatched}
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              // Optimistic: the tick is cosmetic, and a failed write just
              // re-syncs on the next navigation.
              setIsWatched((v) => !v);
              void toggleWatched({
                tmdbId,
                mediaType: "tv",
                season,
                episode,
              }).then(setIsWatched);
            })
          }
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition",
            isWatched
              ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"
              : "text-white/65 hover:bg-white/[0.06] hover:text-white",
          )}
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border transition",
              isWatched
                ? "border-emerald-400/70 bg-emerald-400/25"
                : "border-white/25",
            )}
          >
            {isWatched ? <Check className="h-2.5 w-2.5" /> : null}
          </span>
          <span className="hidden sm:inline">
            {isWatched ? "Watched" : "Mark watched"}
          </span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * Prev / Next. Real links rather than `router.push` buttons, so Next.js
 * prefetches the neighbouring episode and the switch is near-instant; and
 * they work with middle-click and "open in new tab".
 */
function Step({ step, direction }: { step: EpisodeStep | null; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  const className = cn(
    "inline-flex h-10 shrink-0 items-center gap-1 rounded-xl text-xs font-medium transition",
    isNext ? "px-2.5 sm:pl-3.5" : "px-2.5 sm:pr-3.5",
    !step
      ? "pointer-events-none text-white/20"
      : isNext
        ? "bg-white/[0.08] text-white hover:bg-white/[0.14]"
        : "text-white/65 hover:bg-white/[0.06] hover:text-white",
  );
  const content = (
    <>
      {isNext ? null : <ChevronLeft className="h-4 w-4" aria-hidden />}
      <span className="hidden sm:inline">{isNext ? "Next" : "Prev"}</span>
      {isNext ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
    </>
  );
  return step ? (
    <Link href={step.href} title={step.label} className={className}>
      {content}
    </Link>
  ) : (
    <span aria-disabled="true" className={className}>
      {content}
    </span>
  );
}
