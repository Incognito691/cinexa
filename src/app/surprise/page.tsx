import { SurpriseView, type Genre } from "@/features/surprise";
import { buildMetadata } from "@/lib/metadata";
import { tmdbImage } from "@/lib/env";
import { fetchAnimeGenres, fetchAnimeWallCovers } from "@/server/anilist/home";
import { fetchTrending, tmdbFetch } from "@/server/tmdb";
import type { MediaType } from "@/types/media";

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
const genresFor = (type: MediaType): Promise<Genre[]> =>
  tmdbFetch<{ genres?: { id: number; name: string }[] }>(`/genre/${type}/list`, {}, GENRE_LIST_TTL).then(
    (r) => (r.genres ?? []).map((g) => ({ id: String(g.id), name: g.name })),
    () => [],
  );

/** AniList genres are names, so the name is the id. */
const animeGenres = (): Promise<Genre[]> =>
  fetchAnimeGenres().then(
    (names) => names.map((name) => ({ id: name, name })),
    () => [],
  );

/**
 * Background posters for one type: trending titles, already content-filtered,
 * as small-poster URLs. The shuffle flips through the same images, so the
 * spin shows the kind of thing you asked for.
 */
async function posterWall(type: MediaType): Promise<string[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) => fetchTrending({ type, page }).then((r) => r.items, () => [])),
  );
  const urls = pages.flat().flatMap((i) => (i.posterPath ? [tmdbImage(i.posterPath, "w185")!] : []));
  return [...new Set(urls)];
}

export default async function SurprisePage() {
  const [movieWall, tvWall, animeWall, movie, tv, anime] = await Promise.all([
    posterWall("movie"),
    posterWall("tv"),
    fetchAnimeWallCovers().catch(() => []),
    genresFor("movie"),
    genresFor("tv"),
    animeGenres(),
  ]);
  return (
    <SurpriseView
      walls={{ movie: movieWall, tv: tvWall, anime: animeWall }}
      genres={{ movie, tv, anime }}
    />
  );
}
