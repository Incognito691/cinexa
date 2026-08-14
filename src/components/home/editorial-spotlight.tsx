"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Play, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSection } from "@/hooks/use-section";
import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * "Editor's Picks" — 1 large feature + 3 stacked smaller cards.
 * Data: TMDB top_rated movies (real).
 */
const NUM_PICKS = 4;

export function EditorialSpotlight() {
  const q = useSection({ type: "movie", category: "top_rated" });
  const items = q.data?.items ?? [];
  const featured = items[0];
  const small = items.slice(1, NUM_PICKS);

  return (
    <section className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/65 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Editor&apos;s Picks
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            This Week&apos;s Watchlist
          </h2>
          <p className="text-sm text-white/55">
            Hand-selected for the kind of evening where you only have two hours.
          </p>
        </div>
        <Link
          href="/explore?type=movie&category=top_rated"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
        >
          More picks
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Asymmetric grid: 1 big on the left (col-span-2), 3 stacked on the right. */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {featured ? (
          <FeatureCard item={featured} />
        ) : (
          <FeatureSkeleton loading={q.isLoading} />
        )}

        <div className="flex flex-col gap-4">
          {q.isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <SmallSkeleton key={idx} />
              ))
            : small.map((item) => (
                <SmallCard key={`pick-${item.id}`} item={item} />
              ))}
          {!q.isLoading && small.length === 0 ? (
            <SmallSkeleton />
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface PickLike {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
}

// ────────────────────── Feature card (large, left) ──────────────────────

function FeatureCard({ item }: { item: PickLike }) {
  const backdrop = item.backdropPath
    ? tmdbImage(item.backdropPath, "w1280")
    : item.posterPath
      ? tmdbImage(item.posterPath, "w1280")
      : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : "—";
  const rating = item.rating > 0 ? (item.rating / 2).toFixed(1) : null;
  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
  const watchHref =
    item.mediaType === "movie"
      ? `/watch/movie/${item.id}`
      : `/watch/tv/${item.id}?season=1&episode=1`;

  return (
    <Link
      href={detailHref}
      className={cn(
        "group relative block w-full overflow-hidden rounded-3xl border border-white/[0.08]",
        "bg-white/[0.02] shadow-2xl shadow-black/30 backdrop-blur-md",
        "transition-all duration-500 hover:-translate-y-0.5 hover:border-white/[0.18]",
      )}
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-slate-900 to-black" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-white/85 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Top Pick
            </span>
            {rating ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-semibold text-yellow-300 backdrop-blur">
                <Star className="h-3 w-3 fill-yellow-300" />
                {rating}
                <span className="text-white/40">/ 5</span>
              </span>
            ) : null}
            <span className="hidden text-xs text-white/55 sm:inline">
              · {year} · {item.mediaType === "tv" ? "Series" : "Film"}
            </span>
          </div>

          <h3 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
            {item.title}
          </h3>

          {item.overview ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 line-clamp-3 sm:text-base">
              {item.overview}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="brand"
              size="xl"
              className="rounded-full"
            >
              <Link href={watchHref}>
                <Play className="fill-current" />
                Watch Now
              </Link>
            </Button>
            <Button
              variant="glass"
              size="xl"
              className="rounded-full"
            >
              <Heart />
              Add to List
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeatureSkeleton({ loading }: { loading?: boolean }) {
  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]",
        loading && "animate-pulse",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
    </div>
  );
}

// ────────────────────── Small cards (right column) ──────────────────────

function SmallCard({ item }: { item: PickLike }) {
  const poster = item.posterPath
    ? tmdbImage(item.posterPath, "w500")
    : null;
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : "—";
  const rating = item.rating > 0 ? (item.rating / 2).toFixed(1) : null;
  const detailHref =
    item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

  return (
    <Link
      href={detailHref}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-white/[0.03] shadow-md shadow-black/40 backdrop-blur-md",
        "transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-xl",
      )}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        {poster ? (
          <Image
            src={poster}
            alt={item.title}
            fill
            sizes="(max-width: 1024px) 100vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />

        {rating ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-yellow-300" />
            {rating}
          </span>
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-brand-from/40 backdrop-blur-md">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </div>

        <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-4">
          <p className="line-clamp-1 text-base font-semibold text-white drop-shadow sm:text-lg">
            {item.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/55">
            {year} · {item.mediaType === "tv" ? "Series" : "Film"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SmallSkeleton() {
  return (
    <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-white/[0.04] sm:aspect-[2/1]" />
  );
}