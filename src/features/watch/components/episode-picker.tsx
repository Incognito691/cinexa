"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { TvEpisode, TvSeasonSummary } from "@/types/media";

interface EpisodePickerProps {
  tmdbId: number;
  seasons: TvSeasonSummary[];
  episodes: TvEpisode[];
  season: number;
  episode: number;
  /** `s{n}e{n}` keys already watched, for the ticks. */
  watched: Set<string>;
}

/**
 * Season + episode in one control.
 *
 * Two dropdowns plus prev/next put four chevrons in a row, which is most of
 * what made the old bar noisy. This is a single button that opens a panel:
 * seasons across the top, episodes listed under them, so picking anything is
 * one click from one place.
 *
 * Hand-rolled rather than a popover dependency — the panel is anchored to its
 * own container, so it only needs outside-click and Escape, which is a few
 * lines. Radix would add a package for positioning we don't need.
 */
export function EpisodePicker({
  tmdbId,
  seasons,
  episodes,
  season,
  episode,
  watched,
}: EpisodePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = episodes.find((e) => e.episodeNumber === episode);

  const go = (nextSeason: number, nextEpisode: number) => {
    setOpen(false);
    router.push(`/watch/tv/${tmdbId}?season=${nextSeason}&episode=${nextEpisode}`);
  };

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left transition hover:bg-white/[0.06]"
      >
        <span className="shrink-0 rounded-md bg-white/[0.08] px-2 py-1 text-[11px] font-semibold tabular-nums text-white/80">
          S{season} E{episode}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {current?.name ?? "Select episode"}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 text-white/45 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose an episode"
          // Anchored to the control bar (its `relative` parent), not to this
          // button, so the panel spans the full bar. Opaque on purpose:
          // `bg-…/98` is off Tailwind's opacity scale, so it emitted no
          // background at all and the player showed straight through.
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0f] shadow-2xl shadow-black/60"
        >
          {seasons.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.07] p-2.5 [scrollbar-width:thin]">
              {seasons.map((s) => (
                <button
                  key={s.seasonNumber}
                  type="button"
                  // A new season starts at its first episode — carrying the old
                  // number over lands on a missing episode in shorter seasons.
                  onClick={() => go(s.seasonNumber, 1)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    s.seasonNumber === season
                      ? "bg-primary text-primary-foreground"
                      : "text-white/60 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="max-h-[320px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {episodes.map((e) => {
              const active = e.episodeNumber === episode;
              const seen = watched.has(`s${season}e${e.episodeNumber}`);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => go(season, e.episodeNumber)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      active
                        ? "bg-white/[0.1]"
                        : "hover:bg-white/[0.06]",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 shrink-0 text-xs font-semibold tabular-nums",
                        active ? "text-primary" : "text-white/40",
                      )}
                    >
                      {e.episodeNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                      {e.name}
                    </span>
                    {seen ? (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                        aria-label="Watched"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
