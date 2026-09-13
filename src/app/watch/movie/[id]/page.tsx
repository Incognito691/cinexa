import { notFound } from "next/navigation";

import { WatchView } from "@/features/watch";
import { buildMetadata } from "@/lib/metadata";
import { fetchMoviePage } from "@/server/tmdb";
import { getResumePosition, isSignedIn } from "@/server/watch-history";

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
  const page = await load(params);
  if (!page) notFound();

  const { detail, similar } = page;
  const year = detail.releaseDate?.slice(0, 4);
  // Both no-op when signed out — login is optional.
  const [signedIn, startAt] = await Promise.all([
    isSignedIn(),
    getResumePosition({ tmdbId: detail.id, mediaType: "movie" }),
  ]);

  return (
    <WatchView
      target={{ tmdbId: detail.id, mediaType: "movie" }}
      title={detail.title}
      subtitle={[year, detail.genres.slice(0, 3).join(", ")]
        .filter(Boolean)
        .join(" · ")}
      overview={detail.overview}
      detailHref={`/movie/${detail.id}`}
      similar={similar}
      signedIn={signedIn}
      startAt={startAt}
    />
  );
}
