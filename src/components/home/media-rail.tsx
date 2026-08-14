"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaCardItem } from "@/types/media";

import { MediaCard } from "./media-card";
import { RailCardSkeleton } from "./rail-card-skeleton";

/**
 * Stitch-style horizontal rail.
 *
 * - Section header: title left, "View All" link right.
 * - Single snap-scroll row of poster cards. No inner card chrome — the card
 *   owns its own hover/scrim so the rail row stays quiet.
 *
 * Cards are sized so ~5 fit visibly across the desktop content column after
 * the AppShell sidebar + padding. `RAIL_LIMIT` caps the row; the full set
 *   lives behind "View All".
 */

const DEFAULT_CARD_WIDTH = 200;
const RAIL_LIMIT = 10;
const SKELETON_COUNT = 6;

interface MediaRailProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  items: MediaCardItem[];
  error?: { message: string } | null;
  cardWidth?: number;
  /** Optional language tag propagated to each card (e.g. "Hindi"). */
  language?: string;
  className?: string;
}

export function MediaRail({
  title,
  subtitle,
  seeAllHref,
  items,
  error,
  cardWidth = DEFAULT_CARD_WIDTH,
  language,
  className,
}: MediaRailProps) {
  const visible = items.slice(0, RAIL_LIMIT);
  const total = items.length;
  const hasMore = Boolean(seeAllHref) && total > 0;
  const isEmpty = total === 0;

  return (
    <section className={cn("space-y-6", className)}>
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-white/50">{subtitle}</p>
          ) : null}
        </div>
        {hasMore ? (
          <Link
            href={seeAllHref!}
            className={cn(
              "group/link inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] px-3.5 py-1.5",
              "text-xs font-medium text-white/60 transition-colors duration-300",
              "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            View All
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5" />
          </Link>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-stitch-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          {error.message}
        </div>
      ) : null}

      {isEmpty && !error ? (
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-hide">
          {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <RailCardSkeleton key={idx} width={cardWidth} />
          ))}
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 scrollbar-hide">
          {visible.map((item, idx) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}`}
              item={item}
              width={cardWidth}
              priority={idx < 5}
              language={language}
            />
          ))}
        </div>
      )}
    </section>
  );
}