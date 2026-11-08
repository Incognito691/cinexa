import { SurpriseView, type Genre } from "@/features/surprise";
import { buildMetadata } from "@/lib/metadata";
import { fetchTrending, tmdbFetch } from "@/server/tmdb";
import type { MediaCardItem, MediaType } from "@/types/media";

export const revalidate = 600;

// Random by design: nothing here is worth a search result.
export const metadata = buildMetadata({
  title: "Surprise",
  description: "Can't decide? Pick a genre and let Cinexa choose a movie or show for you.",
  path: "/surprise",
  noIndex: true,
});

const GENRE_LIST_TTL = 60 * 60 * 24;

/** A failed genre list just leaves "Any genre"; the page still works. */
const genresFor = (type: MediaType) =>
  tmdbFetch<{ genres?: Genre[] }>(`/genre/${type}/list`, {}, GENRE_LIST_TTL).then(
    (r) => r.genres ?? [],
    () => [],
  );

/** Trending titles for the background wall. Already content-filtered. */
async function posterWall(): Promise<MediaCardItem[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) => fetchTrending({ page }).then((r) => r.items, () => [])),
  );
  const seen = new Set<string>();
  return pages.flat().filter((item) => {
    const key = `${item.mediaType}:${item.id}`;
    // Trending "all" also returns people, who have no poster.
    if (!item.posterPath || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function SurprisePage() {
  const [wall, movie, tv] = await Promise.all([posterWall(), genresFor("movie"), genresFor("tv")]);
  return <SurpriseView wall={wall} genres={{ movie, tv }} />;
}
