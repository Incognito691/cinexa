"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AiringTime } from "@/components/airing-time";
import { tmdbImage } from "@/lib/env";
import { FINISHED_RATIO } from "@/lib/watch-progress";
import { cn } from "@/lib/utils";
import type { TvEpisode, TvSeasonSummary, UpcomingEpisode } from "@/types/media";

interface EpisodePickerProps {
  /** e.g. `/watch/tv/73223`; `?season=&episode=` is appended. */
  watchPath: string;
  seasons: TvSeasonSummary[];
  episodes: TvEpisode[];
  /** Listed after the aired episodes, locked: there's nothing to play yet. */
  upcoming?: UpcomingEpisode | null;
  season: number;
  episode: number;
  /** `s{n}e{n}` keys already watched, for the ticks. */
  watched: Set<string>;
  /** 0..1 per key, for the bars; null = watched, runtime unknown. */
  progress?: Record<string, number | null>;
}

/**
 * Season + episode in one control: a button showing what's playing, opening
 * a panel with season tabs on top and that season's episodes (thumbnail,
 * title, runtime) underneath.
 *
 * Hand-rolled rather than a popover dependency — the panel is anchored to
 * the control bar, so it only needs outside-click and Escape.
 */
export function EpisodePicker({
  watchPath,
  seasons,
  episodes,
  upcoming,
  season,
  episode,
  watched,
  progress = {},
}: EpisodePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;

    // Open on the episode that's playing, not at the top of a 22-episode list.
    // Set on the list itself: `scrollIntoView` would also scroll the page.
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[aria-current]");
    if (list && active) {
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    }

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
  const href = (s: number, e: number) => `${watchPath}?season=${s}&episode=${e}`;
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left transition hover:bg-white/[0.06]",
          open && "bg-white/[0.06]",
        )}
      >
        <span className="shrink-0 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-semibold tabular-nums text-primary">
          S{season} E{episode}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {current?.name ?? "Select episode"}
        </span>
        <span className="hidden shrink-0 text-xs text-white/40 lg:inline">Episodes</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 text-white/45 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose an episode"
          // Anchored to the control bar (its `relative` parent), not to this
          // button, so the panel spans the full bar.
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0f] shadow-2xl shadow-black/70 duration-150 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none"
        >
          {seasons.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.07] p-2.5 scrollbar-hide">
              {seasons.map((s) => (
                <Link
                  key={s.seasonNumber}
                  // A new season starts at its first episode — carrying the old
                  // number over lands on a missing episode in shorter seasons.
                  href={href(s.seasonNumber, 1)}
                  prefetch={false}
                  onClick={close}
                  aria-current={s.seasonNumber === season ? "true" : undefined}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    s.seasonNumber === season
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/[0.04] text-white/60 hover:bg-white/[0.09] hover:text-white",
                  )}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          ) : null}

          <ul ref={listRef} className="relative max-h-[min(420px,60vh)] space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {episodes.map((e) => {
              const active = e.episodeNumber === episode;
              const key = `s${season}e${e.episodeNumber}`;
              const ratio = progress[key];
              // Started but not finished: a bar. Finished, or marked watched
              // by a source that reports no position: a tick.
              const partial = typeof ratio === "number" && ratio < FINISHED_RATIO;
              const seen = watched.has(key) && !partial;
              const still = e.stillPath ? tmdbImage(e.stillPath, "w300") : null;
              return (
                <li key={e.id}>
                  <Link
                    href={href(season, e.episodeNumber)}
                    prefetch={false}
                    onClick={close}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl p-1.5 pr-3 transition",
                      active ? "bg-primary/[0.12]" : "hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-white/[0.05] sm:w-28">
                      {still ? (
                        <Image src={still} alt="" fill unoptimized className="object-cover" />
                      ) : null}
                      {partial ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                          <span
                            className="block h-full bg-primary"
                            style={{ width: `${Math.max(4, Math.round(ratio * 100))}%` }}
                          />
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">
                        <span className={cn("tabular-nums", active ? "text-primary" : "text-white/40")}>
                          {e.episodeNumber}.{" "}
                        </span>
                        {e.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        {active ? <span className="font-medium text-primary">Now playing</span> : null}
                        {active && e.runtime ? " · " : null}
                        {e.runtime ? `${e.runtime}m` : null}
                        {partial ? ` · ${Math.round(ratio * 100)}% watched` : null}
                      </span>
                    </span>
                    {seen ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Watched" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {upcoming ? (
              <li>
                <div aria-disabled="true" className="flex items-center gap-3 rounded-xl p-1.5 pr-3 opacity-60">
                  <span className="flex aspect-video w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 sm:w-28">
                    <Lock className="h-4 w-4 text-white/40" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white/70">
                      <span className="tabular-nums text-white/40">{upcoming.episodeNumber}. </span>
                      {upcoming.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-white/50">
                      {upcoming.airing ? (
                        <>
                          Airs <AiringTime at={upcoming.airing.at} mode={upcoming.airing.mode} />
                        </>
                      ) : (
                        "Coming soon"
                      )}
                    </span>
                  </span>
                </div>
              </li>
            ) : null}
            {episodes.length === 0 && !upcoming ? (
              <li className="px-3 py-8 text-center text-sm text-white/50">No episodes out yet.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
