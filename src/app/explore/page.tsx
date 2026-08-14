import { Suspense } from "react";

import { ExploreView } from "@/features/explore";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

// noIndex: every filter combination is its own URL, and indexing the whole
// cross-product would flood the index with near-duplicate pages.
export const metadata = buildMetadata({
  title: "Explore",
  description:
    "Browse movies, TV shows, and anime by genre, year, and rating — or search the full catalogue.",
  path: "/explore",
  noIndex: true,
});

/**
 * /explore — landing + filtered-results experience in a single page.
 *
 * Renders the Stitch "Explore & Discover" layout: a centered hero heading,
 * search bar, quick-filter chips, and "Browse by Genre" tiles. When the
 * URL carries any filter param (`tab` is always present), the same view
 * swaps to a results grid with the active-filter chip + pagination.
 */
export default function ExplorePage() {
  return (
    <main className="px-3 pb-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <ExploreView initialTab="movies" />
      </Suspense>
    </main>
  );
}
