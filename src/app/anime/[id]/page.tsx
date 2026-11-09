import { notFound, redirect } from "next/navigation";

import { animeHref } from "@/lib/anime-slug";
import { anilistTitle } from "@/server/anilist/resolve";

/** `/anime/:id` (no slug, e.g. an older link) → `/anime/:id/:slug`. */
export default async function AnimeIdRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const title = await anilistTitle(id).catch(() => null);
  const { season } = await searchParams;
  redirect(`${animeHref(id, title ?? "anime")}${season ? `?season=${season}` : ""}`);
}
