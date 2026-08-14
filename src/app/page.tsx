import { BentoGrid } from "@/components/home/bento-grid";
import { ContinueWatchingRail } from "@/components/home/continue-watching-rail";
import { Hero } from "@/components/home/hero";
import {
  NowPlayingRail,
  TopMoviesRail,
  TopTvRail,
  TopHindiMoviesRail,
  TopHindiTvRail,
} from "@/components/home/home-rails";
import { SiteFooter } from "@/components/home/site-footer";
import {
  fetchDiscover,
  fetchTrending,
  type FetchTrendingResult,
} from "@/server/services/tmdb.service";

// Revalidate every 60s — same as the rails' staleTime. We rebuild the data
// on the server, so the first paint always has fresh-enough content.
export const revalidate = 60;

type RailData = {
  items: FetchTrendingResult["items"];
  error?: string;
};

/**
 * Server-side prefetch for every rail on the home page.
 *
 * Fails are caught per-rail so a single bad endpoint (e.g. TMDB rate-limit
 * on `/discover/tv?language=hi`) doesn't blank the rest of the page — the
 * affected rail renders an inline error UI instead. This is the *primary*
 * fix for the "first load stuck on skeletons" issue: by the time the HTML
 * ships to the browser, the data already exists in the React Query cache
 * via HydrationBoundary so the client never needs to wait on a network
 * round-trip to render anything.
 */
async function safeFetch(
  fetcher: () => Promise<FetchTrendingResult>,
): Promise<RailData> {
  try {
    const r = await fetcher();
    return { items: r.items };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Unable to load",
    };
  }
}

export default async function HomePage() {
  const [
    trending,
    nowPlaying,
    topMovies,
    topTv,
    bento,
    topHindiMovies,
    topHindiTv,
  ] = await Promise.all([
    safeFetch(() => fetchTrending({ type: "movie", window: "week", page: 1 })),
    safeFetch(() =>
      fetchDiscover({ type: "movie", category: "now_playing", page: 1 }),
    ),
    safeFetch(() =>
      fetchDiscover({ type: "movie", category: "popular", page: 1 }),
    ),
    safeFetch(() =>
      fetchDiscover({ type: "tv", category: "popular", page: 1 }),
    ),
    safeFetch(() =>
      fetchDiscover({ type: "movie", category: "popular", page: 1 }),
    ),
    safeFetch(() =>
      fetchDiscover({
        type: "movie",
        category: "popular",
        language: "hi",
        page: 1,
      }),
    ),
    safeFetch(() =>
      fetchDiscover({
        type: "tv",
        category: "popular",
        language: "hi",
        page: 1,
      }),
    ),
  ]);

  const trendingItems = trending.items;

  return (
    // Capped + centered: past ~1560px the rails stop stretching and the page
    // keeps a readable measure instead of sprawling across an ultrawide.
    <div className="mx-auto w-full max-w-[1560px] space-y-14 pb-16 sm:space-y-20 sm:pb-20">
      <Hero initialTrending={trendingItems} />

      {/* Stitch "Obsidian Cinema" landing sections — in canonical order. */}
      <div className="space-y-14 sm:space-y-20">
        <ContinueWatchingRail />
        <NowPlayingRail initial={nowPlaying} />
        <TopMoviesRail initial={topMovies} />
        <TopTvRail initial={topTv} />
        <BentoGrid initial={bento.items} />
        <TopHindiMoviesRail initial={topHindiMovies} />
        <TopHindiTvRail initial={topHindiTv} />
      </div>

      <SiteFooter />
    </div>
  );
}