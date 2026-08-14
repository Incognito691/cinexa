import { cn } from "@/lib/utils";

/**
 * Ambient light behind the AI page.
 *
 * Three blurred blooms in the brand purple/pink plus the app's red primary,
 * each drifting on its own offset cycle. Pure CSS transform animation on a
 * `will-change`d layer, so it composites on the GPU and costs nothing.
 *
 * The radial mask keeps the light off the panel edges, so it reads as glow
 * rather than as three circles.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        maskImage: "radial-gradient(120% 100% at 50% 40%, black 40%, transparent 85%)",
        WebkitMaskImage:
          "radial-gradient(120% 100% at 50% 40%, black 40%, transparent 85%)",
      }}
    >
      <div
        className="aurora-blob absolute -left-[10%] top-[-15%] h-[55%] w-[55%] rounded-full opacity-50"
        style={{ background: "hsl(var(--brand-from))" }}
      />
      <div
        className="aurora-blob absolute right-[-8%] top-[5%] h-[50%] w-[50%] rounded-full opacity-40"
        style={{ background: "hsl(var(--brand-to))", animationDelay: "-9s" }}
      />
      <div
        className="aurora-blob absolute bottom-[-20%] left-[30%] h-[55%] w-[45%] rounded-full opacity-25"
        style={{ background: "hsl(var(--primary))", animationDelay: "-17s" }}
      />

      {/* Grain-free vignette so the blooms sit into the obsidian background. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
    </div>
  );
}
