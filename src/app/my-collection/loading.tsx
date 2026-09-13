import { Skeleton } from "@/components/ui/skeleton";

/** See the note in `/favourites/loading.tsx` — same reason, same cost. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2" aria-busy>
      <span className="sr-only">Loading collection…</span>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] card-shape" />
        ))}
      </div>
    </div>
  );
}
