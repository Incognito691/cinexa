import { notFound } from "next/navigation";

import { TvDetailView } from "@/features/title";
import { buildMetadata, buildTitleMetadata } from "@/lib/metadata";
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

  // Canonical is the season-less `/tv/:id` — `?season=2` is the same show, and
  // letting each season mint its own canonical splits the page's ranking.
  return buildTitleMetadata(page.detail);
}

export default async function Page({ params, searchParams }: PageProps) {
  const page = await load(params, searchParams);
  if (!page) notFound();
  return <TvDetailView {...page} />;
}
