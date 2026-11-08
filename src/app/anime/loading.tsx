import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-12 pb-16 pt-2" aria-busy>
      <span className="sr-only">Loading anime…</span>
      <Skeleton className="h-[420px] rounded-[28px]" />
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="space-y-5">
          <Skeleton className="h-7 w-56 rounded-lg" />
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-[180px] shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
