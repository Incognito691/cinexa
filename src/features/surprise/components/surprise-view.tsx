"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { Play, Shuffle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { animeHref } from "@/lib/anime-slug";
import { tmdbImage } from "@/lib/env";
import { request } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { AnimeItem } from "@/types/anime";
import type { MediaCardItem } from "@/types/media";

import { getPopularPage } from "../api";
import { drawRandom } from "../lib/draw";

/** A genre chip. Ids are strings: TMDB's numeric ids, or AniList's genre names. */
export interface Genre {
  id: string;
  name: string;
}

type Kind = "movie" | "tv" | "anime";

const KINDS: { id: Kind; label: string }[] = [
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV Shows" },
  { id: "anime", label: "Anime" },
];

interface SurpriseViewProps {
  /**
   * Poster URLs per type: they tile the background and feed the shuffle, so
   * choosing Anime spins through anime, not this week's films.
   */
  walls: Record<Kind, string[]>;
  genres: Record<Kind, Genre[]>;
}

/**
 * The landed pick, whichever catalogue it came from, with its own links:
 * a TMDB pick goes to `/movie|tv/...` and `/watch/...`, an anime pick stays in
 * the anime section at `/anime/:id/:slug` and `/anime/:id/:slug/watch`.
 */
interface Pick {
  id: number;
  title: string;
  /** Sharp poster, and a small one shown while it loads. */
  image: string | null;
  thumb: string | null;
  kind: string;
  year: string | null;
  stars: string | null;
  overview: string | null;
  href: string;
  watchHref: string;
}

const fromTmdb = (item: MediaCardItem): Pick => ({
  id: item.id,
  title: item.title,
  image: tmdbImage(item.posterPath, "w500") ?? null,
  thumb: tmdbImage(item.posterPath, "w185") ?? null,
  kind: item.mediaType === "tv" ? "Series" : "Movie",
  year: item.releaseDate?.slice(0, 4) ?? null,
  stars: item.rating > 0 ? (item.rating / 2).toFixed(1) : null,
  overview: item.overview || null,
  href: `/${item.mediaType}/${item.id}`,
  watchHref:
    item.mediaType === "movie" ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}?season=1&episode=1`,
});

const fromAnime = (item: AnimeItem): Pick => {
  const href = animeHref(item.id, item.title);
  return {
    id: item.id,
    title: item.title,
    image: item.cover,
    thumb: item.cover,
    kind: item.format === "MOVIE" ? "Anime movie" : "Anime",
    year: item.seasonYear ? String(item.seasonYear) : null,
    stars: item.score ? (item.score / 20).toFixed(1) : null,
    overview: item.description,
    href,
    // The anime watch page opens on the right season and first episode itself.
    watchHref: `${href}/watch`,
  };
};

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
 * image). The deck reuses the wall's exact URLs while spinning, so every
 * frame is a browser-cache hit.
 */

/** Memoised so a spin frame re-renders the two tiles that changed, not all 96. */
const Tile = memo(function Tile({ src, lit }: { src: string; lit: boolean }) {
  return (
    <Image
      src={src}
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
 * Movies and TV come from `/api/discover`, so they've been through the
 * content filter like everything else; anime comes from `/api/anime/random`
 * with the anime section's own exclusions. The wall is only decoration for
 * the spin; the pick is usually not on it.
 */
export function SurpriseView({ walls, genres }: SurpriseViewProps) {
  const [type, setType] = useState<Kind>("movie");
  const [genre, setGenre] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [face, setFace] = useState<string | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [lit, setLit] = useState(-1);

  // Bumped on every shuffle and on unmount, so a superseded spin stops.
  const run = useRef(0);
  const knownPages = useRef<Record<string, number>>({});
  useEffect(() => () => void run.current++, []);

  const wall = walls[type];
  const tiles = wall.length
    ? Array.from({ length: TILE_COUNT }, (_, i) => wall[i % wall.length])
    : [];

  function chooseType(next: Kind) {
    setType(next);
    // Genre ids differ per catalogue, so a selection rarely carries over.
    if (!genres[next].some((g) => g.id === genre)) setGenre(null);
  }

  /** One random title of the chosen kind and genre, or null. */
  function draw(): Promise<Pick | null> {
    if (type === "anime") {
      const params = new URLSearchParams();
      if (genre) params.set("genre", genre);
      if (pick) params.set("exclude", String(pick.id));
      return request<AnimeItem | null>(`/api/anime/random?${params}`).then((a) => (a ? fromAnime(a) : null));
    }
    const key = `${type}:${genre ?? "any"}`;
    return drawRandom(
      (page) => getPopularPage(type, genre ? Number(genre) : null, page),
      knownPages.current[key],
      pick?.id,
    ).then((r) => {
      knownPages.current[key] = r.totalPages;
      return r.pick ? fromTmdb(r.pick) : null;
    });
  }

  async function shuffle() {
    const id = ++run.current;
    setPhase("shuffling");

    let settled = false;
    const drawn = draw()
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

    const result = await drawn;
    if (run.current !== id) return;
    setLit(-1);
    setPick(result);
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
        {tiles.map((src, i) => (
          <Tile key={i} src={src} lit={i === lit} />
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
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={type === k.id}
              disabled={shuffling}
              onClick={() => chooseType(k.id)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                type === k.id ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white",
              )}
            >
              {k.label}
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
              {/* Spinning: the wall's own w185 posters (cache hits). Landed: the
                  pick's small poster, with the sharp one on top once loaded. */}
              {phase === "landed" ? (
                pick?.thumb ? (
                  <Image src={pick.thumb} alt="" fill unoptimized className="object-cover" />
                ) : null
              ) : face ? (
                <Image
                  src={face}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
              {phase === "landed" && pick?.image ? (
                <Image src={pick.image} alt={pick.title} fill unoptimized className="object-cover" />
              ) : null}
            </div>

            {phase === "landed" && pick ? (
              <div className="pick-pop max-w-md space-y-4">
                <div className="space-y-1.5">
                  <Link href={pick.href} className="text-xl font-semibold text-white hover:underline">
                    {pick.title}
                  </Link>
                  <p className="flex items-center justify-center gap-2 text-xs text-white/60 md:justify-start">
                    <span>{pick.kind}</span>
                    {pick.year ? <span>· {pick.year}</span> : null}
                    {pick.stars ? (
                      <span className="inline-flex items-center gap-1 text-yellow-300">
                        · <Star className="h-3 w-3 fill-yellow-300" aria-hidden />
                        {pick.stars}
                      </span>
                    ) : null}
                  </p>
                  {pick.overview ? (
                    <p className="line-clamp-3 text-sm text-white/70">{pick.overview}</p>
                  ) : null}
                </div>
                <div className="flex justify-center gap-3 md:justify-start">
                  <Button asChild size="lg">
                    <Link href={pick.watchHref}>
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
