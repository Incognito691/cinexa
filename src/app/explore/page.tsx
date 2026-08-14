import { Suspense } from "react";

import { ExploreView } from "@/features/explore";

export const dynamic = "force-dynamic";

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
