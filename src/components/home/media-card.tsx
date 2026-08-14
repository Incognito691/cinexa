"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/env";
import type { MediaCardItem } from "@/types/media";

/**
 * Stitch-style poster card.
 *
 * - Aspect 2/3, 24px radius, 1px hairline border.
 * - Hover lifts and reveals a centered play button + soft red glow.
 * - Subtle chip + rating badge top-left/right; title lives below the card
 *   (matches the Stitch rail layout).
 */

interface MediaCardProps {
  item: MediaCardItem;
  priority?: boolean;
  /** Width in px (controls the rail scroll). */
  width?: number;
  /** Optional language tag, e.g. "Hindi" — adds a red chip on the poster. */
  language?: string;
}

// w500 not w342 — cards render at 200 CSS px, which is 400+ device px on a
// retina display, and w342 visibly softens there.
const POSTER_SIZE = "w500";

export function MediaCard({
  item,
  priority,
  width,
  language,
}: MediaCardProps) {
  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

  const poster = item.posterPath
    ? tmdbImage(item.posterPath, POSTER_SIZE)
    : null;

  const rating = item.rating ? (item.rating / 2).toFixed(1) : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;

  return (
    <article
      className={cn(
        "group flex shrink-0 snap-start flex-col gap-2",
      )}
      style={width ? { width: `${width}px` } : undefined}
    >
      <Link
        href={detailHref}
        aria-label={item.title}
        className={cn(
          "relative block aspect-[2/3] overflow-hidden rounded-stitch-xl border border-white/[0.08]",
          "bg-surface-container-low shadow-md shadow-black/30",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          // Hover — lift + red glow + scale-up image.
          "hover:-translate-y-1.5 hover:border-white/[0.18] hover:primary-glow",
        )}
      >
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

        {/* Subtle scrim — strong enough for top-left chip readability. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35" />

        {/* Top-left chip — mediaType OR language tag */}
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

        {/* Hover play overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              "bg-primary-container text-white shadow-lg shadow-primary/40 backdrop-blur-md",
            )}
          >
            <Play className="h-5 w-5 fill-current" />
          </span>
        </div>
      </Link>

      {/* Title + year below the poster */}
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