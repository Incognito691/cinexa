"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Play, Plus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { MediaCardItem } from "@/types/media";

/**
 * Cinematic hero — Stitch "Obsidian Cinema" style.
 *
 * - Every slide's backdrop is mounted at once and crossfaded via opacity, so
 *   rotating doesn't flash a blank frame while the next image decodes.
 * - Strong left + bottom vignette fades the backdrop into the obsidian bg.
 * - Compact film-strip of the upcoming slides, bottom-right.
 * - CTA: red pill "Watch Now" + glass "Add to Watchlist".
 */

const CAROUSEL_SIZE = 5;
const POSTER_SIZE = "w342";
const ROTATE_MS = 7_000;

interface HeroProps {
  className?: string;
  initialTrending?: MediaCardItem[];
}

export function Hero({ className, initialTrending = [] }: HeroProps) {
  const items = useMemo(
    () => initialTrending.slice(0, CAROUSEL_SIZE),
    [initialTrending],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate when we have multiple slides.
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % items.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[activeIndex];
  const isHydrating = items.length === 0;

  const watchHref = item
    ? item.mediaType === "movie"
      ? `/watch/movie/${item.id}`
      : `/watch/tv/${item.id}?season=1&episode=1`
    : "#";

  const rating = item?.rating ? (item.rating / 2).toFixed(1) : null;
  const year = item?.releaseDate ? item.releaseDate.slice(0, 4) : null;

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden rounded-[28px]",
        "h-[72vh] min-h-[520px] max-h-[820px]",
        className,
      )}
    >
      {/* Backdrop stack — all slides mounted, crossfaded on `activeIndex`.
          `original` rather than w1280: this renders edge-to-edge, so w1280
          upscales (and blurs) on anything wider than ~1280 CSS px.
          ponytail: all CAROUSEL_SIZE frames load up front so the crossfade
          never shows a half-decoded image — swap to preloading only the next
          slide if hero bytes ever show up in a perf budget. */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e0e] via-[#1a0a0a] to-[#090909]">
        {items.map((slide, idx) =>
          slide.backdropPath ? (
            <Image
              key={`${slide.mediaType}-${slide.id}`}
              src={tmdbImage(slide.backdropPath, "original")!}
              alt={idx === activeIndex ? slide.title : ""}
              aria-hidden={idx !== activeIndex}
              fill
              priority={idx === 0}
              sizes="100vw"
              className={cn(
                "object-cover object-center transition-opacity duration-1000 ease-out",
                idx === activeIndex ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null,
        )}
      </div>

      {/* Vignette overlay — fades backdrop into the obsidian page bg. */}
      <div aria-hidden className="absolute inset-0 hero-overlay" />
      {/* Soft top fade so the chrome above reads cleanly. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 hero-top-vignette" />

      {/* Content — `key` re-runs the reveal on each rotation so the copy
          fades up with the backdrop instead of snapping. */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-40 sm:p-10 sm:pb-12 lg:p-14 lg:pb-14">
        <div
          key={item?.id ?? "placeholder"}
          className="reveal max-w-xl space-y-5 lg:max-w-2xl"
          style={{ animationDelay: "80ms" }}
        >
          {/* Chips: rating + 4K + Atmos + year */}
          <div className="flex flex-wrap items-center gap-2">
            {isHydrating ? (
              <>
                <span className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
                <span className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
                <span className="h-7 w-16 animate-pulse rounded-full bg-white/10" />
              </>
            ) : (
              <>
                {rating ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                    <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                    <span className="text-yellow-300">{rating}</span>
                    <span className="text-white/40">/ 5</span>
                  </span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                  4K HDR
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                  Dolby Atmos
                </span>
                {year ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur-md">
                    {year}
                  </span>
                ) : null}
              </>
            )}
          </div>

          {/* Title */}
          {isHydrating ? (
            <div className="space-y-2">
              <span className="block h-12 w-3/4 max-w-md animate-pulse rounded-lg bg-white/10" />
              <span className="block h-12 w-1/2 max-w-md animate-pulse rounded-lg bg-white/10" />
            </div>
          ) : (
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {item?.title ?? "Featured title"}
            </h1>
          )}

          {/* Overview */}
          {isHydrating ? (
            <div className="space-y-2">
              <span className="block h-4 w-full max-w-xl animate-pulse rounded bg-white/8" />
              <span className="block h-4 w-4/5 max-w-xl animate-pulse rounded bg-white/8" />
            </div>
          ) : item?.overview ? (
            <p className="line-clamp-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {item.overview}
            </p>
          ) : null}

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              variant="pill"
              size="2xl"
              className="h-12 px-7 text-sm font-semibold"
            >
              <Link href={watchHref}>
                <Play className="fill-current" />
                Watch Now
              </Link>
            </Button>

            <Button
              variant="glass"
              size="2xl"
              className="h-12 rounded-full px-6 text-sm font-semibold text-white"
            >
              <Plus />
              Add to Watchlist
            </Button>

            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Like"
              className="h-12 w-12 rounded-full border border-white/15 bg-white/10 backdrop-blur-md hover:bg-white/20"
            >
              <Heart />
            </Button>
          </div>
        </div>
      </div>

      {/* Film-strip — compact glass panel, bottom-right. Deliberately narrow
          (~300px) so it never crowds the hero copy on a wide viewport. */}
      {!isHydrating && items.length >= 2 ? (
        <div
          aria-label="Switch featured title"
          className="absolute bottom-6 left-6 sm:left-auto sm:bottom-8 sm:right-10 lg:right-14"
        >
          <div className="glass-elevated flex items-center gap-2 rounded-2xl p-2 sm:gap-2.5 sm:p-2.5">
            {items.map((cItem, idx) => {
              const poster = cItem.posterPath
                ? tmdbImage(cItem.posterPath, POSTER_SIZE)
                : null;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`${cItem.mediaType}-${cItem.id}`}
                  type="button"
                  aria-label={`Show ${cItem.title}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative aspect-[2/3] w-[46px] shrink-0 overflow-hidden rounded-lg border sm:w-[52px] lg:w-[58px]",
                    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isActive
                      ? "border-white/90 shadow-lg shadow-black/50 ring-1 ring-white/20"
                      : "border-white/10 opacity-45 hover:opacity-90",
                  )}
                >
                  {poster ? (
                    <Image
                      src={poster}
                      alt={cItem.title}
                      fill
                      sizes="58px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}