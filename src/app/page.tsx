import {
  BentoGrid,
  Hero,
  NowPlayingRail,
  SiteFooter,
  TopMoviesRail,
  TopTvRail,
  TopHindiMoviesRail,
  TopHindiTvRail,
} from "@/features/home";
import { ContinueWatchingRail } from "@/features/continue-watching";
import {
  fetchDiscover,
  fetchTrending,
  type TmdbListResult,
} from "@/server/tmdb";
import { buildMetadata } from "@/lib/metadata";

// Revalidate every 60s — same as the rails' staleTime. We rebuild the data
// on the server, so the first paint always has fresh-enough content.
export const revalidate = 60;

// No `title` — the home page uses the root default rather than the
// "%s · Cinexa" template, so it reads as the brand landing page.
export const metadata = buildMetadata({ path: "/" });

type RailData = {
  items: TmdbListResult["items"];
  error?: string;
};

/**
 * Server-side prefetch for every rail on the home page.
 *
 * Fails are caught per-rail so a single bad endpoint (e.g. TMDB rate-limit
 * on `/discover/tv?language=hi`) doesn't blank the rest of the page — the
 * affected rail renders an inline error UI instead.
 *
 * Results are passed to the rails as plain `initial` props. There is no
 * React Query on this page: client fetching here was the original cause of
 * the "stuck on skeletons forever" bug, because the dev server's first
 * API-route compile blocked the client request.
 */
async function safeFetch(
  fetcher: () => Promise<TmdbListResult>,
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