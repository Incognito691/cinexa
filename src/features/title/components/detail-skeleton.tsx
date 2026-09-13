import { cn } from "@/lib/utils";

/**
 * Loading state for the movie / TV detail pages.
 *
 * Mirrors `TitleHero`'s geometry exactly — full-bleed hero with the poster and
 * text block sitting *inside* it. The previous version still described the old
 * layout (a banner with a `-mt-24` card pulled up over it), so the placeholder
 * and the real page disagreed and the swap read as content jumping around.
 *
 * Shimmer rather than `animate-pulse`: pulsing opacity across blocks this large
 * makes the whole viewport throb, which reads as jank. A travelling highlight
 * stays calm at any size.
 */

function Bar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-lg bg-white/[0.05]",
        "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent",
        "bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

export function DetailSkeleton({ tv = false }: { tv?: boolean }) {
  return (
    <article className="-mx-1 sm:-mx-3 lg:-mx-4" aria-busy>
      <span className="sr-only">Loading title…</span>

      {/* Hero — same min-height and top padding as the real one, so nothing
          shifts vertically when the content arrives. */}
      <header className="relative isolate min-h-[560px] overflow-hidden px-4 pb-10 pt-[22vh] sm:px-8 sm:pt-[26vh] lg:px-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.04] to-transparent"
        />
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
          <Bar className="aspect-[2/3] w-36 shrink-0 rounded-2xl sm:w-52" />
          <div className="min-w-0 flex-1 space-y-5">
            <Bar className="h-12 w-3/4 max-w-xl sm:h-14" />
            <Bar className="h-4 w-1/3 max-w-xs" />
            <div className="flex gap-2">
              <Bar className="h-7 w-20 rounded-full" />
              <Bar className="h-7 w-24 rounded-full" />
              <Bar className="h-7 w-16 rounded-full" />
            </div>
            <div className="flex gap-3 pt-1">
              <Bar className="h-11 w-44 rounded-full" />
              <Bar className="h-11 w-40 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-14 px-4 pb-16 sm:px-8 lg:px-12">
        <section className="space-y-4">
          <Bar className="h-5 w-32" />
          <Bar className="h-16 w-full max-w-3xl" />
        </section>

        {/* Movies show three box-office tiles here; TV shows an episode list. */}
        {tv ? (
          <section className="space-y-4">
            <Bar className="h-5 w-28" />
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Bar key={i} className="h-[104px] w-full rounded-2xl" />
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <Bar className="h-5 w-32" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Bar key={i} className="h-[108px] rounded-2xl" />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <Bar className="h-5 w-20" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[116px] shrink-0 space-y-2">
                <Bar className="aspect-[2/3] rounded-xl" />
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
