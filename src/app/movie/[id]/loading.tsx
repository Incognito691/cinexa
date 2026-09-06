import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-12" aria-busy>
      <span className="sr-only">Loading…</span>
      <Skeleton className="-mx-2 h-[38vh] min-h-[240px] rounded-b-3xl sm:-mx-3 lg:-mx-4" />
      <div className="-mt-24 flex flex-col gap-6 sm:flex-row sm:items-end">
        <Skeleton className="aspect-[2/3] w-36 shrink-0 rounded-2xl sm:w-48" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
      <div className="mt-8 max-w-3xl space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
