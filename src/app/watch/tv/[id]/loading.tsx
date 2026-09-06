import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="-mx-1 space-y-8 pb-16 sm:-mx-3 lg:-mx-4" aria-busy>
      <span className="sr-only">Loading player…</span>
      <Skeleton className="mx-auto aspect-video w-full max-w-[1400px] rounded-2xl" />
      <div className="mx-auto max-w-[1400px] space-y-4 px-4 sm:px-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
