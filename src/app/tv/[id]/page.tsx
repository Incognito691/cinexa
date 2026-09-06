import { notFound } from "next/navigation";

import { TvDetailView } from "@/features/title";
import { buildMetadata } from "@/lib/metadata";
import { tmdbImage } from "@/lib/env";
import { fetchTvPage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}

/**
 * `fetchTvPage` returns null for anything the content filter blocks, so a
 * blocked show 404s here exactly as it disappears from the lists — a detail
 * URL can't be used to route around moderation.
 */
async function load(
  params: PageProps["params"],
  searchParams?: PageProps["searchParams"],
) {
  const { id } = await params;
  const season = Number((await searchParams)?.season);
  return fetchTvPage(id, Number.isInteger(season) && season >= 0 ? season : undefined);
}

export async function generateMetadata({ params }: PageProps) {
  const page = await load(params).catch(() => null);
  if (!page) return buildMetadata({ title: "Not found", noIndex: true });

  const { detail } = page;
  const backdrop = detail.backdropPath
    ? tmdbImage(detail.backdropPath, "w1280")
    : undefined;

  return buildMetadata({
    title: detail.title,
    description: detail.overview.slice(0, 200) || undefined,
    path: `/tv/${detail.id}`,
    images: backdrop ? [backdrop] : undefined,
  });
}

export default async function Page({ params, searchParams }: PageProps) {
  const page = await load(params, searchParams);
  if (!page) notFound();
  return <TvDetailView {...page} />;
}
