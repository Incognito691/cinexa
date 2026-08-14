"use client";

import Link from "next/link";
import { Play } from "lucide-react";

interface PlaceholderItem {
  id: number;
  title: string;
  subtitle: string;
  /** 0..1 watch progress */
  progress: number;
}

// Placeholder data — swap for real useProgress() data in phase 8.
const placeholders: PlaceholderItem[] = [
  { id: 1, title: "Echoes of Tomorrow", subtitle: "S1 · E4 · 32m left",   progress: 0.72 },
  { id: 2, title: "Neon Atlas",         subtitle: "S1 · E2 · 1h 12m left", progress: 0.31 },
  { id: 3, title: "Smoke & Static",     subtitle: "Movie · 18m left",     progress: 0.85 },
  { id: 4, title: "Cinder House",       subtitle: "S1 · E1 · 4m left",    progress: 0.12 },
  { id: 5, title: "Half-Light",         subtitle: "Movie · 1h 24m left",  progress: 0.50 },
  { id: 6, title: "Paper Boats",        subtitle: "S2 · E5 · 47m left",   progress: 0.90 },
];

const RAIL_LIMIT = 8;

/**
 * Stitch "Continue Watching" rail.
 *
 * Wide cards (~340px) with a 16:9 thumbnail strip, progress bar, title +
 * episode meta. Card surface is glass-elevated so it sits cleanly over the
 *   obsidian bg.
 *
 * Real data hook (`useProgress`) lands in phase 8 — until then we render
 *   placeholder rows so the layout is exercisable.
 */
export function ContinueWatchingRail() {
  const visible = placeholders.slice(0, RAIL_LIMIT);
  const hasMore = placeholders.length > RAIL_LIMIT;

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Continue Watching
          </h2>
          <p className="text-sm text-white/50">Pick up where you left off.</p>
        </div>
        {hasMore ? (
          <Link
            href="/continue-watching"
            className="shrink-0 rounded-full border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            View All
          </Link>
        ) : null}
      </header>

      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-hide">
        {visible.map((item) => (
          <ContinueCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ContinueCard({ item }: { item: PlaceholderItem }) {
  return (
    <article className="group w-[300px] shrink-0 snap-start sm:w-[340px]">
      <Link
        href="/continue-watching"
        className="glass-elevated block overflow-hidden rounded-stitch-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40"
      >
        {/* Thumbnail strip — a faux poster block; will be replaced with
            per-item backdrop when real progress data lands. */}
        <div className="relative aspect-video w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b1b] via-[#0e0e0e] to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />

          {/* Centered play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/40 transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </div>

          {/* Progress bar */}
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary-container"
                style={{ width: `${Math.round(item.progress * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium tabular-nums text-white/80">
              {Math.round(item.progress * 100)}%
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="space-y-1 px-4 py-3">
          <p className="line-clamp-1 text-sm font-semibold text-white">
            {item.title}
          </p>
          <p className="text-xs text-white/55">{item.subtitle}</p>
        </div>
      </Link>
    </article>
  );
}