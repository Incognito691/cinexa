"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Sparkles, Star } from "lucide-react";

import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { MediaCardItem } from "@/types/media";

/**
 * Stitch "Editorial Spotlight" — 3-column bento:
 *
 *   ┌───────────────────┬─────────┐
 *   │                   │    B    │
 *   │         A         ├─────────┤
 *   │   (2 cols × 2)    │    C    │
 *   └───────────────────┴─────────┘
 *
 * The 3-column split is load-bearing: A spans 2 columns and 2 rows, which
 * makes each of B/C land at ~16:9 too. (With a 2-column grid, B and C came
 * out ~3.5:1 and every image was cropped to a sliver.) All three tiles use
 * TMDB backdrops — landscape source into a landscape cell, so faces survive.
 *
 * Data is server-prefetched so the section hydrates with real content.
 */
export function BentoGrid({ initial }: { initial: MediaCardItem[] }) {
  const items = initial.slice(0, 3);
  const [a, b, c] = items;

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/65 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Editorial Spotlight
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Hand-picked from the charts
          </h2>
          <p className="text-sm text-white/50">
            What everyone&apos;s watching right now, in one look.
          </p>
        </div>
        <Link
          href="/explore?tab=movies&category=popular"
          className="shrink-0 rounded-full border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          See all
        </Link>
      </header>

      {/* B and C keep their 16:9 aspect at every breakpoint — that's what
          gives the two rows a height. A carries no aspect on md+ and just
          fills its 2×2 cell (which lands at ~16:9 as well). Give A an aspect
          there too and the grid fights itself; drop B/C's and the rows
          collapse to nothing, since `h-full` has no intrinsic height. */}
      <div className="grid gap-3 sm:gap-4 md:auto-rows-fr md:grid-cols-3">
        {a ? (
          <BentoCard
            item={a}
            variant="wide"
            className="aspect-[16/9] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full"
          />
        ) : (
          <CardSkeleton className="aspect-[16/9] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full" />
        )}

        {b ? (
          <BentoCard
            item={b}
            variant="compact"
            className="aspect-[16/9] md:col-start-3 md:row-start-1"
          />
        ) : (
          <CardSkeleton className="aspect-[16/9] md:col-start-3 md:row-start-1" />
        )}

        {c ? (
          <BentoCard
            item={c}
            variant="compact"
            className="aspect-[16/9] md:col-start-3 md:row-start-2"
          />
        ) : (
          <CardSkeleton className="aspect-[16/9] md:col-start-3 md:row-start-2" />
        )}
      </div>
    </section>
  );
}

type Variant = "compact" | "wide";

function BentoCard({
  item,
  variant,
  className,
}: {
  item: MediaCardItem;
  variant: Variant;
  className?: string;
}) {
  // Backdrops everywhere — every tile is landscape, so a 16:9 source needs
  // almost no cropping. Poster is only a fallback for titles TMDB has no
  // backdrop for (it will crop, but that's the rare case, not the default).
  const image = item.backdropPath
    ? tmdbImage(item.backdropPath, variant === "wide" ? "w1280" : "w780")
    : item.posterPath
      ? tmdbImage(item.posterPath, "w500")
      : null;

  const rating = item.rating ? (item.rating / 2).toFixed(1) : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : "";
  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

  return (
    <Link
      href={detailHref}
      className={cn(
        "group relative block overflow-hidden rounded-stitch-xl border border-white/[0.08]",
        "bg-surface-container-low shadow-md shadow-black/30",
        "transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.18] hover:primary-glow",
        className,
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={item.title}
          fill
          sizes={
            variant === "wide"
              ? "(max-width: 768px) 100vw, 60vw"
              : "(max-width: 768px) 100vw, 30vw"
          }
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b1b] via-[#0e0e0e] to-black" />
      )}

      {/* Scrim — bottom-weighted so the title reads without muddying the art. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
      {variant === "wide" ? (
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/55 to-transparent" />
      ) : null}

      {/* Top-left chip */}
      <span className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
        {item.mediaType === "tv" ? "Series" : "Film"}
      </span>

      {/* Top-right rating */}
      {rating ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur">
          <Star className="h-2.5 w-2.5 fill-yellow-300" />
          {rating}
        </span>
      ) : null}

      {/* Hover play overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/40 backdrop-blur-md">
          <Play className="h-6 w-6 fill-current" />
        </span>
      </div>

      {/* Title overlay at the bottom */}
      <div className={cn("absolute inset-x-0 bottom-0", variant === "wide" ? "p-5 sm:p-6" : "p-4")}>
        <p
          className={cn(
            "line-clamp-1 font-semibold tracking-tight text-white",
            variant === "wide" ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
          )}
        >
          {item.title}
        </p>
        {year ? (
          <p
            className={cn(
              "mt-1 text-white/60",
              variant === "wide" ? "text-sm" : "text-[11px]",
            )}
          >
            {year}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-stitch-xl border border-white/[0.06] bg-surface-container-low",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]" />
    </div>
  );
}