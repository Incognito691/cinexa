"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Play, Star } from "lucide-react";
import { useState } from "react";

import { AiringTime } from "@/components/airing-time";
import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { TvEpisode } from "@/types/media";

import type { EpisodeAiring, EpisodeCut } from "../lib/airing";
import { formatDate, formatRuntime } from "./parts";

/** Episodes shown before the rest collapse behind "Show more": two rows of four. */
const EPISODE_LIMIT = 8;

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
  cut,
  watchPath,
}: {
  /**
   * Aired episodes plus only the next one. Computed by the server and passed
   * in, never here: it depends on the current time, and server and browser
   * computing it separately is a hydration mismatch.
   */
  cut: EpisodeCut;
  /** e.g. `/watch/tv/73223` or `/anime/195604/black-clover-season-2/watch`. */
  watchPath: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? cut.visible : cut.visible.slice(0, EPISODE_LIMIT);
  const hidden = cut.visible.length - visible.length;

  const toggle = () => {
    const update = () => setExpanded((v) => !v);
    if (!document.startViewTransition) {
      update();
      return;
    }
    document.startViewTransition(update);
  };

  return (
    <div className="space-y-4">
      {/* A grid of cards rather than a list of rows: a season reads as a set
          of stills, and eight fit where three rows did. */}
      <ol className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            watchPath={watchPath}
            airing={episode.id === cut.nextId ? (cut.airing ?? undefined) : undefined}
          />
        ))}
      </ol>

      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="mx-auto flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-white/70 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
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
  watchPath,
  airing,
}: {
  episode: TvEpisode;
  watchPath: string;
  /** Set only on the next, not-yet-aired episode. */
  airing?: EpisodeAiring;
}) {
  const still = episode.stillPath ? tmdbImage(episode.stillPath, "w300") : null;
  // An upcoming episode shows its air time instead of a bare date.
  const aired = airing ? null : formatDate(episode.airDate);
  const rating = episode.rating > 0 ? (episode.rating / 2).toFixed(1) : null;

  return (
    <li
      // The name must be unique per card so the browser pairs it across the
      // expand and animates it to its new position. `.vt-episode` carries the
      // shared `view-transition-class` that one CSS rule then tunes.
      style={{ viewTransitionName: `ep-${episode.id}` }}
      className="vt-episode"
    >
      <Row
        // The next episode hasn't aired, so there's nothing to play yet.
        href={
          airing
            ? undefined
            : `${watchPath}?season=${episode.seasonNumber}&episode=${episode.episodeNumber}`
        }
      >
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] transition group-hover:ring-white/25",
            airing && "opacity-60",
          )}
        >
          {still ? (
            <Image
              src={still}
              alt=""
              fill
              // TMDB's w300 is already the right size. Through the optimizer,
              // "Show more" queued a dozen at once and some came back broken.
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : null}
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            E{episode.episodeNumber}
          </span>
          {episode.runtime && !airing ? (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white/85">
              {formatRuntime(episode.runtime)}
            </span>
          ) : null}
          {airing ? null : (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <Play className="h-4 w-4 fill-current" />
              </span>
            </span>
          )}
        </div>

        <div className="space-y-1 px-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 min-w-0 text-sm font-semibold text-white">{episode.name}</h3>
            {rating ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-white/60">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {rating}
              </span>
            ) : null}
          </div>

          {airing ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Airs <AiringTime at={airing.at} mode={airing.mode} />
            </p>
          ) : aired ? (
            <p className="text-[11px] text-white/45">{aired}</p>
          ) : null}

          {episode.overview ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/55">
              {episode.overview}
            </p>
          ) : null}
        </div>
      </Row>
    </li>
  );
}

/** A playable episode is a link; the not-yet-aired one is a plain card. */
function Row({ href, children }: { href?: string; children: React.ReactNode }) {
  const base = "group flex flex-col gap-2.5";
  return href ? (
    <Link href={href} className={base}>
      {children}
    </Link>
  ) : (
    <div className={base}>{children}</div>
  );
}
