import { Suspense } from "react";

import { ExploreView } from "@/features/explore";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Movies",
  description: "Browse popular movies, page by page.",
  path: "/movies/all",
  // Every filter and page is its own URL; the landing page is the one to index.
  noIndex: true,
});

/** Movies, the full paged grid. The explore results view, pinned to one catalogue. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1560px]">
      {/* `ExploreView` reads the URL's search params (page, genre…). */}
      <Suspense fallback={null}>
        <ExploreView initialTab="movies" fixedTab="movies" />
      </Suspense>
    </main>
  );
}
