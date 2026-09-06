import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streams instantly on every navigation that doesn't have a closer
 * `loading.tsx`. Without one, App Router blocks the transition on the server
 * fetch and the old page just sits there — which is what made navigation feel
 * frozen rather than slow.
 */
export default function Loading() {
  return (
    <div className="space-y-10 pb-12 pt-2 sm:pt-6" aria-busy>
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-[42vh] min-h-[260px] w-full rounded-stitch-xl" />
      {[0, 1].map((rail) => (
        <section key={rail} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[2/3] w-[150px] shrink-0 rounded-stitch-xl sm:w-[180px]"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
