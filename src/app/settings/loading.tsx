import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-20 pt-2" aria-busy>
      <span className="sr-only">Loading settings…</span>
      <Skeleton className="h-10 w-44 rounded-lg" />
      <Skeleton className="h-28 rounded-2xl" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
