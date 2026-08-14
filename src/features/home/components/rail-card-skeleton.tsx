import { cn } from "@/lib/utils";

/**
 * Minimal skeleton card for a poster rail.
 *
 * Visual recipe (Stitch-style):
 *   - Aspect 2/3 poster card, 24px radius, 1px hairline border.
 *   - Subtle single-layer shimmer drifting left-to-right.
 *   - No chips, no inner placeholders — just the silhouette + light.
 */
export function RailCardSkeleton({ width }: { width: number }) {
  return (
    <div
      className={cn(
        "relative shrink-0 snap-start overflow-hidden rounded-stitch-xl border border-white/[0.06]",
        "bg-surface-container-low aspect-[2/3]",
      )}
      style={{ width: `${width}px` }}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          "from-transparent via-white/[0.05] to-transparent",
          "bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]",
        )}
      />
    </div>
  );
}