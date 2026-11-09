import { notFound } from "next/navigation";

import { MovieDetailView, TvDetailView } from "@/features/title";
import { buildMetadata, buildTitleMetadata } from "@/lib/metadata";
import { asAnimeCards, fetchNextAiring, resolveAnilist } from "@/server/anilist/resolve";
import { fetchMoviePage, fetchTvPage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ season?: string }>;
}

/**
 * `/anime/:anilistId/:slug` — an anime's page, in the anime section.
 *
 * Anime cards carry AniList ids, while the title data (cast, episodes, the
 * content filter) comes from TMDB, so the id is resolved here (see
 * `resolveAnilist`) and the detail view renders in place. Every link on it,
 * seasons and episodes included, stays under `/anime/...`; nothing here
 * sends the viewer into `/tv` or `/watch`. The slug is cosmetic.
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
    if (!page) return null;
    return { kind: "movie" as const, page: { ...page, similar: await asAnimeCards(page.similar) }, id };
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
  return {
    kind: "tv" as const,
    page: { ...page, similar: await asAnimeCards(page.similar) },
    id,
    nextAiring: ownSeason ? nextAiring : null,
  };
}

export async function generateMetadata(props: PageProps) {
  const result = await load(props).catch(() => null);
  if (!result) return buildMetadata({ title: "Not found", noIndex: true });
  return buildTitleMetadata(result.page.detail);
}

export default async function AnimeTitlePage(props: PageProps) {
  const result = await load(props);
  if (!result) notFound();

  const { slug } = await props.params;
  const basePath = `/anime/${result.id}/${slug}`;

  if (result.kind === "movie") {
    return <MovieDetailView {...result.page} watchPath={`${basePath}/watch`} />;
  }
  return (
    <TvDetailView
      {...result.page}
      basePath={basePath}
      watchPath={`${basePath}/watch`}
      nextAiring={result.nextAiring}
    />
  );
}
