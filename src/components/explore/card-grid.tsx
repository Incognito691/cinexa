"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Play, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { tmdbImage } from "@/lib/env";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaCardItem } from "@/types/media";

/**
 * 10 cards in a responsive grid — 5 cols on lg, 4 on md, 3 sm, 2 xs.
 * Uses the same MediaCard visual language as the home rails but renders
 * inside a grid instead of a horizontal scroll.
 */
const GRID_COLS =
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5";

interface CardGridProps {
  items: MediaCardItem[];
  /** When the rail is still loading, render skeletons. */
  loading?: boolean;
}

export function CardGrid({ items, loading }: CardGridProps) {
  if (loading) {
    return (
      <div className={cn("grid gap-3 sm:gap-4", GRID_COLS)}>
        {Array.from({ length: 10 }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="aspect-[2/3] rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-10 text-center backdrop-blur-xl">
        <p className="text-sm font-medium text-white">No titles found</p>
        <p className="mt-2 text-xs text-white/55">
          Try clearing some filters or widening the year range.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:gap-4", GRID_COLS)}>
      {items.map((item, idx) => (
        <CardItem
          key={`${item.mediaType}-${item.id}`}
          item={item}
          priority={idx < 6}
        />
      ))}
    </div>
  );
}

function CardItem({
  item,
  priority,
}: {
  item: MediaCardItem;
  priority?: boolean;
}) {
  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
  const watchHref =
    item.mediaType === "movie"
      ? `/watch/movie/${item.id}`
      : `/watch/tv/${item.id}?season=1&episode=1`;
  const poster = item.posterPath
    ? tmdbImage(item.posterPath, "w342")
    : null;
  const rating = item.rating > 0 ? (item.rating / 2).toFixed(1) : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : "";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-white/[0.04] shadow-md shadow-black/40 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-xl",
        "aspect-[2/3]",
      )}
    >
      <Link href={detailHref} aria-label={item.title} className="absolute inset-0">
        {poster ? (
          <Image
            src={poster}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        )}

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-90" />

        {/* Top chips */}
        <div className="absolute left-2 right-2 top-2 flex items-start justify-between gap-1">
          <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/85 backdrop-blur">
            {item.mediaType === "tv" ? "Series" : "Movie"}
          </span>
          {rating ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur">
              <Star className="h-2.5 w-2.5 fill-yellow-300" />
              {rating}
            </span>
          ) : null}
        </div>

        {/* Hover actions */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-2 px-3 pb-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="pointer-events-auto inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-semibold text-black shadow transition group-hover:bg-purple-200">
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch
          </div>
          <Link
            href={watchHref}
            onClick={(event) => event.stopPropagation()}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Watch"
          >
            <Play className="h-4 w-4 fill-current" />
          </Link>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            aria-label="Add to favourites"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-12">
        <p className="line-clamp-1 text-sm font-medium text-white">
          {item.title}
        </p>
        {year ? (
          <p className="text-[11px] text-white/55">{year}</p>
        ) : null}
      </div>
    </article>
  );
}
