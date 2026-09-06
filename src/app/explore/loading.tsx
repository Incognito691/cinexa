import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 pb-12 pt-2 sm:pt-6" aria-busy>
      <span className="sr-only">Loading…</span>
      <Skeleton className="mx-auto h-12 w-full max-w-2xl rounded-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-stitch-xl" />
        ))}
      </div>
    </div>
  );
}
