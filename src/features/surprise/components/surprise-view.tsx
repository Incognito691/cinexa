"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { Play, Shuffle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { MediaCardItem, MediaType } from "@/types/media";

import { getPopularPage } from "../api";
import { drawRandom } from "../lib/draw";

export interface Genre {
  id: number;
  name: string;
}

interface SurpriseViewProps {
  /** Posters that tile the background and feed the shuffle animation. */
  wall: MediaCardItem[];
  genres: Record<MediaType, Genre[]>;
}

type Phase = "idle" | "shuffling" | "landed" | "empty";

/** 12 columns x 8 rows: covers the tallest layout; the rest is clipped. */
const TILE_COUNT = 96;
/** The spin runs at least this long, so a fast response still feels like a shuffle. */
const MIN_SPIN_MS = 1400;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/*
 * Every poster here is `unoptimized`: TMDB already serves pre-sized files
 * from its CDN, and routing ~30 spin frames through Next's optimizer queued
 * them behind each other until the final pick's request failed (the broken
 * image). The deck reuses the wall's exact w185 URL while spinning, so every
 * frame is a browser-cache hit.
 */

/** Memoised so a spin frame re-renders the two tiles that changed, not all 96. */
const Tile = memo(function Tile({ item, lit }: { item: MediaCardItem; lit: boolean }) {
  return (
    <Image
      src={tmdbImage(item.posterPath, "w185")!}
      alt=""
      width={185}
      height={278}
      unoptimized
      className={cn(
        "aspect-[2/3] h-auto w-full rounded-md object-cover",
        lit ? "relative z-10 scale-110 opacity-100 ring-2 ring-primary" : "opacity-30",
      )}
    />
  );
});

/**
 * The surprise page: a wall of small posters, and a deck in the middle that
 * shuffles through them and lands on one random title for the chosen type and
 * genre.
 *
 * The pick comes from `/api/discover`, so it has been through the content
 * filter like everything else. The wall is only decoration for the spin; the
 * pick is usually not on it.
 */
export function SurpriseView({ wall, genres }: SurpriseViewProps) {
  const [type, setType] = useState<MediaType>("movie");
  const [genre, setGenre] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [face, setFace] = useState<MediaCardItem | null>(null);
  const [pick, setPick] = useState<MediaCardItem | null>(null);
  const [lit, setLit] = useState(-1);

  // Bumped on every shuffle and on unmount, so a superseded spin stops.
  const run = useRef(0);
  const knownPages = useRef<Record<string, number>>({});
  useEffect(() => () => void run.current++, []);

  const tiles = wall.length
    ? Array.from({ length: TILE_COUNT }, (_, i) => wall[i % wall.length])
    : [];

  function chooseType(next: MediaType) {
    setType(next);
    // Genre ids differ between movies and TV, so a selection rarely carries over.
    if (!genres[next].some((g) => g.id === genre)) setGenre(null);
  }

  async function shuffle() {
    const id = ++run.current;
    setPhase("shuffling");

    const key = `${type}:${genre ?? "any"}`;
    let settled = false;
    const draw = drawRandom(
      (page) => getPopularPage(type, genre, page),
      knownPages.current[key],
      pick?.id,
    )
      .then((r) => {
        knownPages.current[key] = r.totalPages;
        return r.pick;
      })
      .catch(() => null)
      .finally(() => {
        settled = true;
      });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && tiles.length > 0) {
      // Fast flicks until the minimum time is up and the pick has arrived,
      // then each flick slows down until it stops: a wheel losing speed.
      const start = Date.now();
      let delay = 60;
      while (delay < 450) {
        const i = Math.floor(Math.random() * tiles.length);
        setLit(i);
        setFace(tiles[i]);
        await sleep(delay);
        if (run.current !== id) return;
        if (settled && Date.now() - start > MIN_SPIN_MS) delay *= 1.3;
      }
    }

    const result = await draw;
    if (run.current !== id) return;
    setLit(-1);
    setPick(result);
    setFace(result);
    setPhase(result ? "landed" : "empty");
  }

  const shuffling = phase === "shuffling";

  return (
    // Exactly the viewport left under the topbar (mt-3 + h-14 + main pt-4),
    // with `-mb-14` cancelling most of main's pb-16, so the page never scrolls.
    <section className="relative isolate -mb-14 h-[calc(100dvh-6.75rem)] overflow-hidden rounded-[28px] border border-white/[0.07] bg-black">
      {/* Poster wall */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 grid grid-cols-5 content-start gap-1.5 p-1.5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
      >
        {tiles.map((item, i) => (
          <Tile key={i} item={item} lit={i === lit} />
        ))}
      </div>

      {/* Darken the middle so the controls read over the wall. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.75)_40%,rgba(0,0,0,0.25)_100%)]"
      />

      <div className="flex h-full flex-col items-center justify-[safe_center] gap-5 overflow-y-auto px-4 py-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Can&apos;t decide? <span className="text-brand-gradient">Shuffle it.</span>
          </h1>
          <p className="text-sm text-white/60">Pick a type and a genre, and we&apos;ll choose for you.</p>
        </div>

        {/* Type */}
        <div role="group" aria-label="Type" className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
          {(["movie", "tv"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              disabled={shuffling}
              onClick={() => chooseType(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                type === t ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white",
              )}
            >
              {t === "movie" ? "Movies" : "TV Shows"}
            </button>
          ))}
        </div>

        {/* Genre */}
        <div role="group" aria-label="Genre" className="flex max-w-3xl flex-wrap justify-center gap-2">
          {[{ id: null, name: "Any genre" }, ...genres[type]].map((g) => (
            <button
              key={g.id ?? "any"}
              type="button"
              aria-pressed={genre === g.id}
              disabled={shuffling}
              onClick={() => setGenre(g.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                genre === g.id
                  ? "border-primary bg-primary/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white",
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Deck: only once there's something to show. */}
        {phase === "shuffling" || (phase === "landed" && pick) ? (
          <div className="flex flex-col items-center gap-6 md:flex-row md:text-left">
            <div
              key={phase === "landed" ? pick?.id : "deck"}
              className={cn(
                "relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] shadow-2xl shadow-primary/20 sm:w-44",
                phase === "landed" && "pick-pop ring-2 ring-primary",
              )}
            >
              {face?.posterPath ? (
                <Image
                  src={tmdbImage(face.posterPath, "w185")!}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
              {/* Sharp version on top once landed; the w185 shows until it loads. */}
              {phase === "landed" && pick?.posterPath ? (
                <Image
                  src={tmdbImage(pick.posterPath, "w500")!}
                  alt={pick.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>

            {phase === "landed" && pick ? (
              <div className="pick-pop max-w-md space-y-4">
                <div className="space-y-1.5">
                  <Link
                    href={`/${pick.mediaType}/${pick.id}`}
                    className="text-xl font-semibold text-white hover:underline"
                  >
                    {pick.title}
                  </Link>
                  <p className="flex items-center justify-center gap-2 text-xs text-white/60 md:justify-start">
                    <span>{pick.mediaType === "tv" ? "Series" : "Movie"}</span>
                    {pick.releaseDate ? <span>· {pick.releaseDate.slice(0, 4)}</span> : null}
                    {pick.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-yellow-300">
                        · <Star className="h-3 w-3 fill-yellow-300" aria-hidden />
                        {(pick.rating / 2).toFixed(1)}
                      </span>
                    ) : null}
                  </p>
                  {pick.overview ? (
                    <p className="line-clamp-3 text-sm text-white/70">{pick.overview}</p>
                  ) : null}
                </div>
                <div className="flex justify-center gap-3 md:justify-start">
                  <Button asChild size="lg">
                    <Link
                      href={
                        pick.mediaType === "movie"
                          ? `/watch/movie/${pick.id}`
                          : `/watch/tv/${pick.id}?season=1&episode=1`
                      }
                    >
                      <Play className="fill-current" aria-hidden /> Watch now
                    </Link>
                  </Button>
                  <Button variant="secondary" size="lg" onClick={shuffle}>
                    <Shuffle aria-hidden /> Shuffle again
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {phase === "landed" && pick ? `Your pick: ${pick.title}` : ""}
        </p>

        {phase === "empty" ? (
          <p className="text-sm text-white/60">Nothing found. Try another genre.</p>
        ) : null}

        {phase !== "landed" ? (
          <Button size="lg" onClick={shuffle} disabled={shuffling}>
            <Shuffle aria-hidden /> {shuffling ? "Shuffling…" : "Surprise me"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
