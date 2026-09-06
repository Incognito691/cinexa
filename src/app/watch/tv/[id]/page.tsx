import { notFound } from "next/navigation";

import { WatchView } from "@/features/watch";
import { buildMetadata } from "@/lib/metadata";
import { fetchTvPage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

/** Coerce a query param to a positive int, or undefined. */
const num = (value?: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const page = await fetchTvPage(id).catch(() => null);
  if (!page) return buildMetadata({ title: "Not found", noIndex: true });
  return buildMetadata({
    title: `Watch ${page.detail.title}`,
    path: `/watch/tv/${page.detail.id}`,
    noIndex: true,
  });
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const season = num(query.season) ?? 1;

  const page = await fetchTvPage(id, season);
  if (!page) notFound();

  const { detail, episodes, selectedSeason, similar } = page;
  const episode = num(query.episode) ?? episodes[0]?.episodeNumber ?? 1;
  const current = episodes.find((e) => e.episodeNumber === episode);

  return (
    <WatchView
      target={{
        tmdbId: detail.id,
        mediaType: "tv",
        season: selectedSeason,
        episode,
      }}
      title={detail.title}
      subtitle={[
        `S${selectedSeason} · E${episode}`,
        current?.name,
      ]
        .filter(Boolean)
        .join(" · ")}
      detailHref={`/tv/${detail.id}?season=${selectedSeason}`}
      similar={similar}
      episodes={episodes}
      currentEpisode={episode}
    />
  );
}
