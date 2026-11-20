import { Suspense } from "react";

import { ExploreView } from "@/features/explore";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "TV Shows",
  description: "Browse popular TV shows, page by page.",
  path: "/tv-shows/all",
  // Every filter and page is its own URL; the landing page is the one to index.
  noIndex: true,
});

/** TV Shows, the full paged grid. The explore results view, pinned to one catalogue. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1560px]">
      {/* `ExploreView` reads the URL's search params (page, genre…). */}
      <Suspense fallback={null}>
        <ExploreView initialTab="tv" fixedTab="tv" />
      </Suspense>
    </main>
  );
}
