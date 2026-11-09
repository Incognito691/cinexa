import { notFound } from "next/navigation";

import { MovieWatchScreen, TvWatchScreen } from "@/features/watch/screens";
import { buildMetadata } from "@/lib/metadata";
import { anilistTitle, resolveAnilist } from "@/server/anilist/resolve";

interface PageProps {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

/** Coerce a query param to a positive int, or undefined. */
const num = (value?: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/**
 * `/anime/:anilistId/:slug/watch?season=&episode=` — the anime player.
 *
 * The same watch screen as `/watch/tv/:id`, with every link (episodes,
 * Prev/Next, auto-next, "Details") kept under this anime's own URLs. The
 * anime player is the default source here.
 */
export async function generateMetadata({ params }: PageProps) {
  const id = Number((await params).id);
  const title = Number.isInteger(id) ? await anilistTitle(id).catch(() => null) : null;
  return buildMetadata({ title: title ? `Watch ${title}` : "Watch", noIndex: true });
}

export default async function AnimeWatchPage({ params, searchParams }: PageProps) {
  const { id: rawId, slug } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const target = await resolveAnilist(id).catch(() => null);
  if (!target) notFound();

  const detailPath = `/anime/${id}/${slug}`;
  if (target.type === "movie") {
    return <MovieWatchScreen tmdbId={String(target.tmdbId)} detailPath={detailPath} anime />;
  }

  const query = await searchParams;
  return (
    <TvWatchScreen
      tmdbId={String(target.tmdbId)}
      season={num(query.season) ?? target.season}
      episode={num(query.episode)}
      watchPath={`${detailPath}/watch`}
      detailPath={detailPath}
      anime
    />
  );
}
