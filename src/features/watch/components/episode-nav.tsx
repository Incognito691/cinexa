"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { markWatched, toggleWatched } from "@/server/watch-history";
import type { TvEpisode, TvSeasonSummary } from "@/types/media";

import { EpisodePicker } from "./episode-picker";
import { AUTO_MARK_MS } from "./watch-tracker";

interface EpisodeNavProps {
  tmdbId: number;
  seasons: TvSeasonSummary[];
  episodes: TvEpisode[];
  season: number;
  episode: number;
  /** `s{n}e{n}` keys already watched. */
  watchedKeys: string[];
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
  seasons,
  episodes,
  season,
  episode,
  watchedKeys,
  signedIn,
}: EpisodeNavProps) {
  const router = useRouter();
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

  const index = episodes.findIndex((e) => e.episodeNumber === episode);
  const prev = index > 0 ? episodes[index - 1] : undefined;
  const next =
    index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : undefined;

  const go = (episodeNumber: number) =>
    router.push(`/watch/tv/${tmdbId}?season=${season}&episode=${episodeNumber}`);

  const stepClass =
    "inline-flex h-11 shrink-0 items-center rounded-xl px-3.5 text-xs font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-25";

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <EpisodePicker
        tmdbId={tmdbId}
        seasons={seasons}
        episodes={episodes}
        season={season}
        episode={episode}
        watched={watched}
      />

      <button
        type="button"
        disabled={!prev}
        title={prev ? `E${prev.episodeNumber} · ${prev.name}` : undefined}
        onClick={() => prev && go(prev.episodeNumber)}
        className={stepClass}
      >
        Prev
      </button>
      <button
        type="button"
        disabled={!next}
        title={next ? `E${next.episodeNumber} · ${next.name}` : undefined}
        onClick={() => next && go(next.episodeNumber)}
        className={stepClass}
      >
        Next
      </button>

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
