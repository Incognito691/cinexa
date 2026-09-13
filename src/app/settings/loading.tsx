import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-20 pt-2" aria-busy>
      <span className="sr-only">Loading settings…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>
      {[2, 1, 2, 3].map((rows, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton
            className="rounded-2xl"
            style={{ height: `${rows * 68}px` }}
          />
        </div>
      ))}
    </div>
  );
}
