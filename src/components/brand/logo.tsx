import { cn } from "@/lib/utils";

/**
 * The Cinexa mark: an open "C" drawn as a lens ring, with a play notch
 * sitting in its mouth. Reads as the initial, a camera aperture, and "watch"
 * at once, and stays legible down to a 16px favicon.
 *
 * Plain SVG primitives only, so `next/og` (Satori) can render the same glyph
 * in `app/icon.tsx` and the Open Graph card.
 */
export function LogoGlyph({
  color = "white",
  className,
  size,
}: {
  color?: string;
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
      <path
        d="M23.1 9.9A9 9 0 1 0 23.1 22.1"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M13.6 12.3v7.4c0 .8.9 1.3 1.6.9l5.9-3.7c.6-.4.6-1.3 0-1.7l-5.9-3.7c-.7-.5-1.6 0-1.6.8z"
        fill={color}
      />
    </svg>
  );
}

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

/** Lowercase wordmark; the red "x" echoes the mark. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold lowercase tracking-tight text-white", className)}>
      cine<span className="text-primary">x</span>a
    </span>
  );
}
