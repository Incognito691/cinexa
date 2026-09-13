import { Skeleton } from "@/components/ui/skeleton";

/**
 * Without this the App Router blocks the transition on the server fetch and
 * leaves the *previous* page on screen — which is what makes navigation feel
 * frozen. It matters more here than on most routes: the page resolves one TMDB
 * detail request per saved title before it can render anything.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2" aria-busy>
      <span className="sr-only">Loading favourites…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] card-shape" />
        ))}
      </div>
    </div>
  );
}
