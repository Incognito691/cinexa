import { notFound } from "next/navigation";

import { MovieDetailView, TvDetailView } from "@/features/title";
import { animeSlug } from "@/lib/anime-slug";
import { buildMetadata, buildTitleMetadata } from "@/lib/metadata";
import { fetchNextAiring, resolveAnilist } from "@/server/anilist/resolve";
import { fetchMoviePage, fetchTvPage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>;
  searchParams: Promise<{ season?: string }>;
}

/**
 * `/anime/:anilistId/:slug` — the TMDB detail page, rendered in place.
 *
 * Anime cards carry AniList ids, while everything that plays runs on TMDB
 * ids, so the id is resolved here (see `resolveAnilist`) and the same detail
 * view renders without a redirect, keeping the URL under `/anime`. The slug
 * is cosmetic and ignored. `?season=` overrides the season AniList implies.
 *
 * `fetchTvPage`/`fetchMoviePage` run the content filter, so a blocked title
 * 404s here as it does on `/tv/:id`. Metadata's canonical stays `/tv/:id`
 * (or `/movie/:id`) so the two URLs don't compete in search.
 */
async function load({ params, searchParams }: PageProps) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const target = await resolveAnilist(id).catch(() => null);
  if (!target) return null;

  if (target.type === "movie") {
    const page = await fetchMoviePage(String(target.tmdbId));
    return page ? { kind: "movie" as const, page } : null;
  }

  const requested = Number((await searchParams).season);
  const season = Number.isInteger(requested) && requested >= 0 ? requested : target.season;
  const [page, nextAiring] = await Promise.all([
    fetchTvPage(String(target.tmdbId), season),
    fetchNextAiring(id).catch(() => null),
  ]);
  if (!page) return null;
  // AniList's schedule belongs to this entry's season only; on any other
  // season the episode list falls back to TMDB's dates.
  const ownSeason = page.selectedSeason === (target.season ?? 1);
  return { kind: "tv" as const, page, id, nextAiring: ownSeason ? nextAiring : null };
}

export async function generateMetadata(props: PageProps) {
  const result = await load(props).catch(() => null);
  if (!result) return buildMetadata({ title: "Not found", noIndex: true });
  return buildTitleMetadata(result.page.detail);
}

export default async function AnimeTitlePage(props: PageProps) {
  const result = await load(props);
  if (!result) notFound();

  if (result.kind === "movie") return <MovieDetailView {...result.page} />;

  const { slug } = await props.params;
  const basePath = `/anime/${result.id}/${slug?.[0] ?? animeSlug(result.page.detail.title)}`;
  return <TvDetailView {...result.page} basePath={basePath} nextAiring={result.nextAiring} />;
}
