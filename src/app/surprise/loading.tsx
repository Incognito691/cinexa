import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy>
      <span className="sr-only">Loading…</span>
      <Skeleton className="min-h-[calc(100vh-9rem)] rounded-2xl" />
    </div>
  );
}
