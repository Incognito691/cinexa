import { AnimeView } from "@/features/anime";
import { loadContinueCards } from "@/features/continue-watching/lib/entries";
import { buildMetadata } from "@/lib/metadata";
import { fetchAnimeHome } from "@/server/anilist/home";
import { animeHref } from "@/lib/anime-slug";
import { anilistIdFor, animeTmdbKeys } from "@/server/anilist/resolve";
import { isSignedIn } from "@/server/watch-history";

// No page-level `revalidate`: the continue row reads the session, so the page
// is per-request. The AniList query still caches itself for 30 minutes.

/**
 * The viewer's anime in progress. Signed out it's an empty list before the
 * anime cross-reference is ever loaded, so anonymous visits don't pay for it.
 */
async function animeInProgress() {
  if (!(await isSignedIn())) return [];
  const anime = await animeTmdbKeys();
  const cards = await loadContinueCards(8, (e) => anime.has(`${e.mediaType}:${e.tmdbId}`));

  // Resume inside the anime section: `/anime/:id/:slug/watch?season=&episode=`
  // rather than the card's default `/watch/tv/...`.
  return Promise.all(
    cards.map(async (card) => {
      const query = card.href.includes("?") ? card.href.slice(card.href.indexOf("?")) : "";
      const season = Number(new URLSearchParams(query).get("season")) || undefined;
      const anilistId = await anilistIdFor({ tmdbId: card.tmdbId, mediaType: card.mediaType, season });
      return anilistId ? { ...card, href: `${animeHref(anilistId, card.title)}/watch${query}` } : card;
    }),
  );
}

export const metadata = buildMetadata({
  title: "Anime",
  description:
    "This season's anime, what's airing next, trending shows, all-time favourites and anime movies.",
  path: "/anime",
});

export default async function AnimePage() {
  const [data, continueCards] = await Promise.all([
    fetchAnimeHome().catch(() => null),
    animeInProgress().catch(() => []),
  ]);

  if (!data) {
    return (
      <div className="mx-auto max-w-xl rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Anime is taking a breather</h1>
        <p className="mt-2 text-sm text-white/60">
          We couldn&apos;t reach our anime source just now. Try again in a minute.
        </p>
      </div>
    );
  }

  return <AnimeView data={data} continueCards={continueCards} />;
}
