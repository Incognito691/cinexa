import { TvWatchScreen } from "@/features/watch/screens";
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
  return (
    <TvWatchScreen
      tmdbId={id}
      season={num(query.season)}
      episode={num(query.episode)}
      watchPath={`/watch/tv/${id}`}
      detailPath={`/tv/${id}`}
    />
  );
}
