"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock, Play, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/env";
import { isUnreleased } from "@/lib/release";
import type { MediaCardItem } from "@/types/media";

/**
 * The poster card, shared by every surface that lists media.
 *
 * Two layouts, one visual language:
 *   - `rail` — fixed width, snap-scroll child, title sits *below* the poster.
 *   - `grid` — fills its grid cell, title is *overlaid*.
 *
 * Both hover the same way: one play button, and the whole card opens the
 * title's page. Favouriting and saving live on that page.
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
    item.href ?? (item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`);

  const poster = item.posterPath
    ? tmdbImage(item.posterPath, POSTER_SIZE)
    : null;
  const rating = item.rating > 0 ? (item.rating / 2).toFixed(1) : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;
  // Announced but not out: the card still opens the detail page, but it's
  // marked locked and offers no Watch button.
  // No date at all counts too: in TMDB's lists that's an announced title
  // ("Ramayana: Part Two"), not an old one with missing data.
  const unreleased = !item.releaseDate || isUnreleased(item.releaseDate);

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
          <span className="rounded-md border border-white/15 bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {item.mediaType === "tv" ? "Series" : "Movie"}
          </span>
        )}
      </div>

      {/* Top-right rating */}
      {rating ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300">
          <Star className="h-2.5 w-2.5 fill-yellow-300" />
          {rating}
        </span>
      ) : null}

      {unreleased ? (
        // Always visible, unlike the hover play button it replaces.
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
            <Lock className="h-3 w-3" aria-hidden />
            Not released
          </span>
        </div>
      ) : (
        // Centered play affordance on hover
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center",
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/40">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </div>
      )}
    </>
  );

  // `card-frame` + `card-face` is a two-layer shape (see globals.css): the
  // outer layer paints the 1px edge and casts the shadow, because clip-path
  // clips both a real `border` and a `box-shadow` away on the diagonals.
  // The border, background and shadow all live in CSS now — what's left here
  // is only the lift.
  const cardChrome = "card-frame block hover:-translate-y-1.5";

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
          <span className="card-face block bg-surface-container-low">
            {surface}
          </span>
        </Link>

        <div className="px-0.5">
          <p className="line-clamp-1 text-sm font-medium text-white/90">
            {item.title}
          </p>
          {year ? (
            <p className="mt-0.5 text-[11px] text-white/45">{year}</p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group", cardChrome, "aspect-[2/3]")}>
      <div className="card-face bg-surface-container-low">
        {/* The detail link covers the whole tile. The action row below is a
          sibling, not a child — nesting an <a> inside an <a> is invalid HTML
          and browsers resolve the click unpredictably. */}
        <Link
          href={detailHref}
          aria-label={item.title}
          className="absolute inset-0"
        >
          {surface}
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3">
          <p className="line-clamp-1 text-sm font-medium text-white">
            {item.title}
          </p>
          {year ? <p className="text-[11px] text-white/55">{year}</p> : null}

        </div>
      </div>
    </article>
  );
}
