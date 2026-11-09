import { DetailSkeleton } from "@/features/title/components/detail-skeleton";

// Without this the parent `/anime` skeleton (rails) would show for a detail page.
export default function Loading() {
  return <DetailSkeleton tv />;
}
