"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Play, Star } from "lucide-react";
import { useState } from "react";

import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { TvEpisode } from "@/types/media";

import { formatDate, formatRuntime } from "./parts";

/** Episodes shown before the rest collapse behind "Show more". */
const EPISODE_LIMIT = 3;

/**
 * Episode list, capped until the viewer asks for the rest.
 *
 * Expanding runs through the View Transitions API: each card carries a unique
 * `view-transition-name`, so the cards already on screen slide to their new
 * positions and the revealed ones ease in, rather than the list snapping to a
 * new height. `startViewTransition` is progressive enhancement — where it's
 * missing the state just updates immediately.
 */
export function EpisodeList({
  episodes,
  titleId,
}: {
  episodes: TvEpisode[];
  titleId: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? episodes : episodes.slice(0, EPISODE_LIMIT);
  const hidden = episodes.length - visible.length;

  const toggle = () => {
    const update = () => setExpanded((v) => !v);
    if (!document.startViewTransition) {
      update();
      return;
    }
    document.startViewTransition(update);
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {visible.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} titleId={titleId} />
        ))}
      </ol>

      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 text-xs font-medium text-white/70 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
        >
          {expanded
            ? "Show fewer episodes"
            : `Show ${hidden} more episode${hidden === 1 ? "" : "s"}`}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

function EpisodeCard({
  episode,
  titleId,
}: {
  episode: TvEpisode;
  titleId: number;
}) {
  const still = episode.stillPath ? tmdbImage(episode.stillPath, "w300") : null;
  const aired = formatDate(episode.airDate);
  const rating = episode.rating > 0 ? (episode.rating / 2).toFixed(1) : null;
  const upcoming = episode.airDate
    ? new Date(`${episode.airDate}T00:00:00Z`) > new Date()
    : false;

  return (
    <li
      // The name must be unique per card so the browser pairs it across the
      // expand and animates it to its new position. `.vt-episode` carries the
      // shared `view-transition-class` that one CSS rule then tunes.
      style={{ viewTransitionName: `ep-${episode.id}` }}
      className="vt-episode"
    >
      <Link
        href={`/watch/tv/${titleId}?season=${episode.seasonNumber}&episode=${episode.episodeNumber}`}
        className="group flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-white/[0.18] hover:bg-white/[0.06]"
      >
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-white/[0.05] sm:w-44">
          {still ? (
            <Image
              src={still}
              alt=""
              fill
              sizes="176px"
              className="object-cover"
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-6 w-6 fill-white text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-sm font-semibold text-white">
              <span className="text-white/40">{episode.episodeNumber}. </span>
              {episode.name}
            </h3>
            {rating ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-white/60">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {rating}
              </span>
            ) : null}
          </div>

          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-white/45">
            {aired ? <span>{aired}</span> : null}
            {episode.runtime ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatRuntime(episode.runtime)}</span>
              </>
            ) : null}
            {upcoming ? (
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-medium text-white/70">
                Upcoming
              </span>
            ) : null}
          </p>

          {episode.overview ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/55">
              {episode.overview}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
