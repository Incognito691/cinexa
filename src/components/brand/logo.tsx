import { cn } from "@/lib/utils";

/**
 * The Popcornly mark: a striped popcorn bucket with golden kernels spilling
 * over the top. The bucket's stripes are gaps that let the red tile through,
 * so it reads as the classic red-and-white carton at any size, down to a
 * 16px favicon.
 *
 * Plain SVG primitives only, so `next/og` (Satori) can render the same glyph
 * in `app/icon.tsx` and the Open Graph card.
 */
export function LogoGlyph({
  color = "white",
  kernel = KERNEL_COLOR,
  className,
  size,
}: {
  /** The bucket. */
  color?: string;
  /** The popcorn. */
  kernel?: string;
  className?: string;
  /** Pixel size; needed under `next/og`, which has no CSS sizing for SVG. */
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
      width={size ?? "100%"}
      height={size ?? "100%"}
    >
      {/* Bucket: three stripes, tapering towards the base. */}
      <path d="M7.5 16H12.2L13.3 27H10Z" fill={color} />
      <path d="M13.6 16H18.4L17.7 27H14.3Z" fill={color} />
      <path d="M19.8 16H24.5L22 27H18.7Z" fill={color} />
      {/* Kernels, drawn last so they sit over the rim. */}
      <circle cx="11" cy="12.8" r="3.6" fill={kernel} />
      <circle cx="21" cy="12.6" r="3.7" fill={kernel} />
      <circle cx="16" cy="10.2" r="4.2" fill={kernel} />
      <circle cx="13.8" cy="14.6" r="2.4" fill={kernel} />
      <circle cx="18.4" cy="14.4" r="2.6" fill={kernel} />
    </svg>
  );
}

/** Buttery yellow for the kernels. */
export const KERNEL_COLOR = "#ffd166";

/** Red-to-crimson tile with a lit top edge. Shared with the favicon. */
export const LOGO_GRADIENT = "linear-gradient(135deg, #ff4d4d 0%, #e50914 45%, #8a0610 100%)";

/** The glyph on its tile. Size it with `className` (e.g. `h-8 w-8`). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[28%] shadow-md shadow-primary/30 ring-1 ring-inset ring-white/15",
        className,
      )}
      style={{ backgroundImage: LOGO_GRADIENT }}
    >
      <LogoGlyph className="h-[68%] w-[68%]" />
    </span>
  );
}

/** Lowercase wordmark: "popcorn" in white, "ly" in the brand red. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold lowercase tracking-tight text-white", className)}>
      popcorn<span className="text-primary">ly</span>
    </span>
  );
}
