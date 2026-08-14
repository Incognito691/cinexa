"use client";

import { cn } from "@/lib/utils";
import { MediaCard } from "@/components/media/media-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaCardItem } from "@/types/media";

/**
 * Responsive grid wrapper — 5 cols on lg, 4 on md, 3 sm, 2 xs.
 *
 * The card itself lives in `components/media` and is shared with the home
 * rails; this file owns only the grid, the loading skeletons, and the empty
 * state.
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
          <Skeleton key={idx} className="aspect-[2/3] rounded-stitch-xl" />
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
        <MediaCard
          key={`${item.mediaType}-${item.id}`}
          item={item}
          layout="grid"
          priority={idx < 6}
        />
      ))}
    </div>
  );
}
