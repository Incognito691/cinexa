"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Play, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/env";
import type { MediaCardItem } from "@/types/media";

/**
 * The poster card, shared by every surface that lists media.
 *
 * Two layouts, one visual language:
 *   - `rail` — fixed width, snap-scroll child, title sits *below* the poster.
 *   - `grid` — fills its grid cell, title is *overlaid*, plus a hover action
 *     row (watch + favourite).
 *
 * This replaced two divergent implementations (home's rail card and the
 * `CardItem` that lived inside explore's card-grid) which had already drifted
 * apart on poster size, easing, and chip shape. Anything that lists media —
 * favourites, collections, AI recommendations — should render this rather
 * than growing a third copy.
 */

// w500 rather than w342: cards render at 200-240 CSS px, which is 400+ device
// px on a retina display, where w342 visibly softens.
const POSTER_SIZE = "w500";

interface MediaCardProps {
  item: MediaCardItem;
  /** Defaults to the rail layout. */
  layout?: "rail" | "grid";
  priority?: boolean;
  /** Rail only — fixed px width that drives the horizontal scroll. */
  width?: number;
  /** Optional language tag, e.g. "Hindi" — swaps the media-type chip. */
  language?: string;
}

export function MediaCard({
  item,
  layout = "rail",
  priority,
  width,
  language,
}: MediaCardProps) {
  const isGrid = layout === "grid";

  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
  const watchHref =
    item.mediaType === "movie"
      ? `/watch/movie/${item.id}`
      : `/watch/tv/${item.id}?season=1&episode=1`;

  const poster = item.posterPath ? tmdbImage(item.posterPath, POSTER_SIZE) : null;
  const rating = item.rating > 0 ? (item.rating / 2).toFixed(1) : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;

  const surface = (
    <>
      {poster ? (
        <Image
          src={poster}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black" />
      )}

      {/* Scrim — heavier on the grid layout, where the title sits on top. */}
      <div
        className={cn(
          "absolute inset-0",
          isGrid
            ? "bg-gradient-to-t from-black/85 via-black/15 to-transparent"
            : "bg-gradient-to-t from-black/55 via-transparent to-black/35",
        )}
      />

      {/* Top-left chip — language tag when given, otherwise media type. */}
      <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        {language ? (
          <span className="chip-hindi rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {language}
          </span>
        ) : (
          <span className="rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            {item.mediaType === "tv" ? "Series" : "Movie"}
          </span>
        )}
      </div>

      {/* Top-right rating */}
      {rating ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur">
          <Star className="h-2.5 w-2.5 fill-yellow-300" />
          {rating}
        </span>
      ) : null}

      {/* Centered play affordance on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isGrid && "items-start pt-[38%]",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/40 backdrop-blur-md">
          <Play className="h-5 w-5 fill-current" />
        </span>
      </div>
    </>
  );

  const cardChrome = cn(
    "relative block overflow-hidden rounded-stitch-xl border border-white/[0.08]",
    "bg-surface-container-low shadow-md shadow-black/30",
    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:-translate-y-1.5 hover:border-white/[0.18] hover:primary-glow",
  );

  if (!isGrid) {
    return (
      <article
        className="group flex shrink-0 snap-start flex-col gap-2"
        style={width ? { width: `${width}px` } : undefined}
      >
        <Link
          href={detailHref}
          aria-label={item.title}
          className={cn(cardChrome, "aspect-[2/3]")}
        >
          {surface}
        </Link>

        <div className="px-0.5">
          <p className="line-clamp-1 text-sm font-medium text-white/90">
            {item.title}
          </p>
          {year ? <p className="mt-0.5 text-[11px] text-white/45">{year}</p> : null}
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group", cardChrome, "aspect-[2/3]")}>
      {/* The detail link covers the whole tile. The action row below is a
          sibling, not a child — nesting an <a> inside an <a> is invalid HTML
          and browsers resolve the click unpredictably. */}
      <Link href={detailHref} aria-label={item.title} className="absolute inset-0">
        {surface}
      </Link>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3">
        <p className="line-clamp-1 text-sm font-medium text-white">{item.title}</p>
        {year ? <p className="text-[11px] text-white/55">{year}</p> : null}

        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            href={watchHref}
            className="pointer-events-auto inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-semibold text-black shadow transition hover:bg-white/90"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch
          </Link>
          <button
            type="button"
            aria-label={`Add ${item.title} to favourites`}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
