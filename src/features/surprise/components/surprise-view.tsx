"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Play, Shuffle, SlidersHorizontal, Star } from "lucide-react";

import { LogoGlyph } from "@/components/brand/logo";
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
   * Poster URLs per type: they fill the carousel, so choosing Anime spins
   * through anime, not this week's films.
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
  /** Wide artwork that takes over the page once the pick lands. */
  backdrop: string | null;
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
  backdrop: tmdbImage(item.backdropPath, "w1280") ?? null,
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
    backdrop: item.banner,
    kind: item.format === "MOVIE" ? "Anime movie" : "Anime",
    year: item.seasonYear ? String(item.seasonYear) : null,
    stars: item.score ? (item.score / 20).toFixed(1) : null,
    overview: item.description,
    href,
    // The anime watch page opens on the right season and first episode itself.
    watchHref: `${href}/watch`,
  };
};

type Phase = "idle" | "drawing" | "spinning" | "landed" | "empty";

/*
 * The carousel: SLOTS posters standing in a ring, seen from just outside it.
 * Each card is turned to its angle and pushed out by RADIUS; rotating the
 * ring brings a card to the front. Everything that moves is a transform, so
 * the browser composites it on the GPU without repainting posters.
 */
const SLOTS = 20;
const STEP = 360 / SLOTS;
const CARD_W = 140;
const RADIUS = 500;
/** One slot per this many ms while idling: a slow, constant drift. */
const DRIFT_MS = 3000;
/** Degrees per second while the pick is being fetched: one turn a second. */
const SPIN_SPEED = 360;
/*
 * The slow-down. The curve's starting slope is 2, so covering DECEL_TURN
 * degrees in DECEL_MS starts at 540 / 3 x 2 = 360 deg/s: exactly SPIN_SPEED.
 * The ring therefore eases out of the fast spin with no jolt. Change one of
 * the three numbers and the other two have to follow.
 */
const DECEL_TURN = 540;
const DECEL_MS = 3000;
const DECEL_EASE = "cubic-bezier(0.3, 0.6, 0.2, 1)";
/*
 * The "vortex": while spinning at full speed the ring tips forward, so it is
 * seen from slightly above, and the posters ride a wave, alternately lifted
 * and dropped, that travels round as the ring turns. Both ease back to level
 * during the slow-down, so the pick arrives on a flat, calm ring.
 */
const TILT_DEG = 13;
const WAVE_PX = 26;
/** How far the tilt drops the front of the ring; cancelled so it stays put. */
const TILT_DROP = RADIUS * Math.sin((TILT_DEG * Math.PI) / 180);
/** Earlier picks kept on screen. */
const HISTORY = 5;

/** One poster per slot, repeating the list if it is shorter than the ring. */
const fill = (wall: string[]) =>
  wall.length ? Array.from({ length: SLOTS }, (_, i) => wall[i % wall.length]) : [];

/**
 * The surprise page: a ring of posters turning in 3D. Choose a type and
 * genre, and the ring spins up and stops on one random title.
 *
 * Movies and TV come from `/api/discover`, so they've been through the
 * content filter like everything else; anime comes from `/api/anime/random`
 * with the anime section's own exclusions.
 *
 * Posters are `unoptimized`: TMDB and AniList already serve pre-sized files.
 */
export function SurpriseView({ walls, genres }: SurpriseViewProps) {
  const [type, setType] = useState<Kind>("movie");
  const [genre, setGenre] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pick, setPick] = useState<Pick | null>(null);
  const [history, setHistory] = useState<Pick[]>([]);
  /** Result view vs. the filter console. */
  const [showFilters, setShowFilters] = useState(true);

  /** What stands in each slot, the ring's rotation, and how it gets there. */
  const [cards, setCards] = useState<string[]>(() => fill(walls.movie));
  const [angle, setAngle] = useState(0);
  const [motion, setMotion] = useState("none");
  const [lockedSlot, setLockedSlot] = useState<number | null>(null);
  /** Full-speed spin: tilt and wave on. Off again once the slow-down starts. */
  const [vortex, setVortex] = useState(false);

  // The rotation last asked for. A ref as well as state because `launch`
  // is async and would otherwise read the angle from before it started.
  const angleRef = useRef(0);
  const rotateTo = (value: number, transition: string) => {
    angleRef.current = value;
    setMotion(transition);
    setAngle(value);
  };

  // Bumped on every launch and on unmount, so a superseded spin stops.
  const run = useRef(0);
  const knownPages = useRef<Record<string, number>>({});
  useEffect(() => () => void run.current++, []);

  const busy = phase === "drawing" || phase === "spinning";
  const landed = phase === "landed" && pick ? pick : null;

  // Idle drift: one slot at a time, linear, so consecutive steps join into a
  // constant slow rotation. Stops while spinning and once a pick has landed.
  useEffect(() => {
    if (busy || landed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const step = () => rotateTo(angleRef.current + STEP, `transform ${DRIFT_MS}ms linear`);
    const first = setTimeout(step, 50);
    const timer = setInterval(step, DRIFT_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [busy, landed]);

  function chooseType(next: Kind) {
    setType(next);
    setCards(fill(walls[next]));
    setLockedSlot(null);
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

  function land(result: Pick, slot: number | null) {
    setHistory((prev) =>
      pick && pick.id !== result.id
        ? [pick, ...prev.filter((p) => p.id !== pick.id && p.id !== result.id)].slice(0, HISTORY)
        : prev,
    );
    setPick(result);
    setLockedSlot(slot);
    setShowFilters(false);
    setPhase("landed");
  }

  async function launch() {
    const id = ++run.current;
    setLockedSlot(null);

    const wall = walls[type];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = !reduceMotion && wall.length > 0;

    // Spin fast straight away, at a constant speed, for as long as the pick
    // takes to arrive. The transition is far longer than any fetch; it gets
    // replaced by the slow-down below.
    const from = angleRef.current;
    const started = performance.now();
    if (animate) rotateTo(from + SPIN_SPEED * 60, "transform 60000ms linear");
    setVortex(animate);
    setPhase(animate ? "spinning" : "drawing");
    /** Where the ring actually is right now. */
    const current = () => from + (SPIN_SPEED * (performance.now() - started)) / 1000;

    const result = await draw().catch(() => null);
    if (run.current !== id) return;

    if (!result) {
      // Settle on the nearest poster rather than freezing mid-turn.
      if (animate) {
        rotateTo(Math.ceil((current() + 90) / STEP) * STEP, "transform 900ms ease-out");
      }
      setVortex(false);
      setPhase("empty");
      setShowFilters(true);
      return;
    }
    if (!animate || !result.thumb) {
      land(result, null);
      return;
    }

    // Stop DECEL_TURN degrees ahead, on a slot boundary. That slot is at the
    // back of the ring right now (540 = a turn and a half), so its poster can
    // be swapped for the pick out of sight.
    const target = Math.ceil((current() + DECEL_TURN) / STEP) * STEP;
    const slot = (((target / STEP) % SLOTS) + SLOTS) % SLOTS;
    setCards((prev) => prev.map((src, i) => (i === slot ? result.thumb! : src)));
    rotateTo(target, `transform ${DECEL_MS}ms ${DECEL_EASE}`);
    setVortex(false);

    // A timer rather than `transitionend`, which doesn't fire if the tab is
    // hidden mid-spin and would leave the page stuck spinning.
    setTimeout(() => {
      if (run.current === id) land(result, slot);
    }, DECEL_MS + 100);
  }

  return (
    // Exactly the viewport left under the topbar (mt-3 + h-14 + main pt-4),
    // with `-mb-14` cancelling most of main's pb-16, so the page never scrolls.
    <section // From 768px up; on phones the section grows with its content and the
    // page scrolls, instead of a scroll area nested inside a fixed box.
    className="relative isolate flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0a] md:-mb-14 md:h-[calc(100dvh-6.75rem)] md:min-h-0">
      {/* The pick's own artwork, dimmed, once it lands. */}
      {landed?.backdrop ? (
        <Image
          key={landed.id}
          src={landed.backdrop}
          alt=""
          fill
          unoptimized
          className="backdrop-in -z-30 object-cover"
        />
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_75%_60%_at_50%_38%,rgba(10,10,10,0.35)_0%,rgba(10,10,10,0.85)_70%,#0a0a0a_100%)]"
      />

      {/* A soft pool of the brand red under the ring; everything else is the
          site's plain near-black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] -z-10 h-[280px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(229,9,20,0.14),transparent)]"
      />

      {/* Stage */}
      <div
        aria-hidden
        // Scaled down on phones: the ring is sized in px for the 3D maths.
        className="relative mx-auto -my-6 h-[280px] w-full max-w-[980px] shrink-0 scale-[0.72] sm:my-0 sm:mt-8 sm:scale-100"
        style={{
          perspective: 1100,
          maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        {/* Two nested 3D layers so the tilt and the spin animate on their
            own clocks: the outer one tips the ring, the inner one turns it. */}
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{
            transformStyle: "preserve-3d",
            transform: vortex
              ? `translateZ(${-RADIUS}px) translateY(${-TILT_DROP}px) rotateX(${-TILT_DEG}deg)`
              : `translateZ(${-RADIUS}px) translateY(0px) rotateX(0deg)`,
            transition: "transform 1400ms cubic-bezier(0.3, 0.6, 0.2, 1)",
          }}
        >
        <div
          className="absolute left-0 top-0 h-0 w-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${-angle}deg)`,
            transition: motion,
            willChange: "transform",
          }}
        >
          {cards.map((src, i) => {
            const locked = landed && i === lockedSlot;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  width: CARD_W,
                  height: CARD_W * 1.5,
                  left: -CARD_W / 2,
                  top: -(CARD_W * 1.5) / 2,
                  // The wave: five crests round the ring.
                  transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px) translateY(${
                    vortex ? Math.round(Math.sin((i / SLOTS) * Math.PI * 2 * 5) * WAVE_PX) : 0
                  }px)`,
                  transition: "transform 1200ms cubic-bezier(0.3, 0.6, 0.2, 1)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div
                  className={cn(
                    "relative h-full w-full overflow-hidden rounded-lg ring-1 ring-white/10 transition duration-500",
                    locked && "scale-110 shadow-2xl shadow-black/70 ring-2 ring-white",
                    landed && !locked && "opacity-25",
                  )}
                >
                  <Image src={src} alt="" fill unoptimized className="object-cover" />
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Console / result */}
      <div className="flex flex-1 flex-col items-center justify-start gap-4 px-4 pb-6 pt-2 text-center md:min-h-0 md:overflow-y-auto">
        {landed && !showFilters ? (
          <div key={landed.id} className="max-w-xl space-y-4 duration-500 animate-in fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
            <div className="space-y-2.5">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-black/40 px-3 py-1 text-[11px] font-medium text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Your pick
              </p>
              <Link
                href={landed.href}
                className="block text-3xl font-bold tracking-tight text-white hover:underline sm:text-4xl"
              >
                {landed.title}
              </Link>
              <ul className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium text-white/80">
                <li className="rounded-md bg-white/[0.08] px-2 py-1">{landed.kind}</li>
                {landed.year ? <li className="rounded-md bg-white/[0.08] px-2 py-1">{landed.year}</li> : null}
                {landed.stars ? (
                  <li className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-1 text-yellow-300">
                    <Star className="h-3 w-3 fill-yellow-300" aria-hidden />
                    {landed.stars}
                  </li>
                ) : null}
              </ul>
              {landed.overview ? (
                <p className="mx-auto line-clamp-2 max-w-lg text-sm leading-relaxed text-white/65">
                  {landed.overview}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href={landed.watchHref}>
                  <Play className="fill-current" aria-hidden /> Watch now
                </Link>
              </Button>
              <Button variant="secondary" onClick={launch}>
                <Shuffle aria-hidden /> Spin again
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(true)}
                aria-label="Change filters"
                title="Change filters"
                className="rounded-xl"
              >
                <SlidersHorizontal aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Can&apos;t decide? <span className="text-primary">Let it choose.</span>
              </h1>
              {phase === "empty" ? null : (
                <p className="text-sm text-white/55">Pick a type and a genre, then spin.</p>
              )}
              {phase === "empty" ? (
                <p className="text-sm text-white/60">Nothing found for that. Try another genre.</p>
              ) : null}
            </div>

            {/* Type */}
            <div role="group" aria-label="Type" className="inline-flex rounded-xl border border-white/10 bg-black/50 p-1">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={type === k.id}
                  disabled={busy}
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
                  disabled={busy}
                  onClick={() => setGenre(g.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    genre === g.id
                      ? "border-white bg-white text-black"
                      : "border-white/[0.08] bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* No "Spinning…" label: the ring says it. The button just steps
                aside while it turns, keeping its space so nothing jumps. */}
            <Button
              onClick={launch}
              disabled={busy}
              className={cn("px-5 transition-opacity duration-200", busy && "invisible opacity-0")}
            >
              {/* The brand's popcorn bucket, as on the logo tile. */}
              <LogoGlyph className="!size-5" />
              Surprise me
            </Button>
          </>
        )}

        {/* Earlier picks: a spin isn't a one-way door. */}
        {history.length > 0 && !busy ? (
          <div className="mt-auto space-y-2 pt-2">
            <p className="text-xs text-white/40">Earlier picks</p>
            <ul className="flex justify-center gap-2">
              {history.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    title={p.title}
                    className="relative block aspect-[2/3] w-11 overflow-hidden rounded-md opacity-60 ring-1 ring-white/10 transition hover:opacity-100 hover:ring-white/40"
                  >
                    {p.thumb ? <Image src={p.thumb} alt={p.title} fill unoptimized className="object-cover" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {landed ? `Your pick: ${landed.title}` : ""}
        </p>
      </div>
    </section>
  );
}
