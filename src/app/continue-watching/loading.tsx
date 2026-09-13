import { Skeleton } from "@/components/ui/skeleton";

/**
 * This route was missing a loading state, which is the documented cause of
 * navigation feeling frozen — the transition blocks on one TMDB detail request
 * per history row with the old page still on screen.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2" aria-busy>
      <span className="sr-only">Loading watch history…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video card-shape" />
        ))}
      </div>
    </div>
  );
}
