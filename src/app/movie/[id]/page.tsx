import { notFound } from "next/navigation";

import { MovieDetailView } from "@/features/title";
import { buildMetadata, buildTitleMetadata } from "@/lib/metadata";
import { fetchMoviePage } from "@/server/tmdb";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * `fetchMoviePage` returns null for anything the content filter blocks, so a
 * blocked title 404s here exactly as it disappears from the lists — a detail
 * URL can't be used to route around moderation.
 */
async function load(params: PageProps["params"]) {
  const { id } = await params;
  return fetchMoviePage(id);
}

export async function generateMetadata({ params }: PageProps) {
  const page = await load(params).catch(() => null);
  if (!page) return buildMetadata({ title: "Not found", noIndex: true });

  return buildTitleMetadata(page.detail);
}

export default async function Page({ params }: PageProps) {
  const page = await load(params);
  if (!page) notFound();
  return <MovieDetailView {...page} />;
}
