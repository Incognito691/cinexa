import { MovieWatchScreen } from "@/features/watch/screens";
import { buildMetadata } from "@/lib/metadata";
import { fetchMoviePage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function load(params: PageProps["params"]) {
  const { id } = await params;
  return fetchMoviePage(id);
}

export async function generateMetadata({ params }: PageProps) {
  const page = await load(params).catch(() => null);
  if (!page) return buildMetadata({ title: "Not found", noIndex: true });
  return buildMetadata({
    title: `Watch ${page.detail.title}`,
    path: `/watch/movie/${page.detail.id}`,
    // Player pages carry no unique content worth indexing.
    noIndex: true,
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <MovieWatchScreen tmdbId={id} detailPath={`/movie/${id}`} />;
}
