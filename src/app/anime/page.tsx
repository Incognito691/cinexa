import { AnimeView } from "@/features/anime";
import { buildMetadata } from "@/lib/metadata";
import { fetchAnimeHome } from "@/server/anilist/home";

// Matches the AniList query's own cache window.
export const revalidate = 1800;

export const metadata = buildMetadata({
  title: "Anime",
  description:
    "This season's anime, what's airing next, trending shows, all-time favourites and anime movies.",
  path: "/anime",
});

export default async function AnimePage() {
  const data = await fetchAnimeHome().catch(() => null);

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

  return <AnimeView data={data} />;
}
