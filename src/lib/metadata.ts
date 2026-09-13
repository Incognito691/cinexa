import type { Metadata } from "next";

import { tmdbImage } from "@/lib/env";
import type { TitleDetail } from "@/types/media";

/**
 * Central metadata builder.
 *
 * Every page (and every future `generateMetadata` on a detail route) should
 * go through `buildMetadata` rather than hand-rolling an object, so canonical
 * URLs, Open Graph, and Twitter cards stay consistent as pages are added.
 */

export const SITE_NAME = "Cinexa";

/** Used verbatim as the root <title> and as the OG title on untitled pages. */
export const SITE_TITLE = `${SITE_NAME} — Premium Movie & TV Streaming`;

export const SITE_DESCRIPTION =
  "Discover and stream thousands of movies and TV shows — what's trending now, top-rated classics, anime, and more.";

/**
 * Absolute origin, needed for canonical URLs and OG image resolution.
 *
 * `NEXT_PUBLIC_` because Open Graph tags are rendered in client-navigable
 * pages too. This is the documented exception to the "always use
 * requireServerEnv" rule — it is public by definition and must be inlined at
 * build time. Set it in production or links will point at localhost.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface BuildMetadataArgs {
  /** Page title, without the site name — the template appends it. */
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/explore" or "/movie/27205". */
  path?: string;
  /** Absolute image URLs (TMDB backdrops work directly). */
  images?: string[];
  /** `video.movie` / `video.tv_show` give richer cards on detail pages. */
  type?: "website" | "video.movie" | "video.tv_show";
  /** Set on pages that shouldn't be indexed (search results, user library). */
  noIndex?: boolean;
  /** Page-specific keywords, merged after the site-wide ones. */
  keywords?: string[];
  /** `YYYY-MM-DD`; emitted as `video:release_date` on the video OG types. */
  releaseDate?: string | null;
  /** Genres, emitted as `video:tag`. */
  tags?: string[];
}

/**
 * Truncate to a word boundary.
 *
 * A raw `slice(0, 200)` cuts mid-word — "a young FBI trainee must confi" —
 * which is what search engines and link previews then render. Backing up to
 * the last space costs a few characters and reads like a sentence.
 */
export function truncate(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  // Guard against a single enormous "word" leaving nothing behind.
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.replace(/[,;:.\s]+$/, "")}…`;
}

export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  images,
  type = "website",
  noIndex = false,
  keywords,
  releaseDate,
  tags,
}: BuildMetadataArgs = {}): Metadata {
  const url = new URL(path, SITE_URL).toString();
  // Fall back to the generated app/opengraph-image when a page has no art.
  const ogImages = images?.length ? images : undefined;
  const ogTitle = title ? `${title} · ${SITE_NAME}` : SITE_TITLE;

  const shared = {
    siteName: SITE_NAME,
    title: ogTitle,
    description,
    url,
    ...(ogImages ? { images: ogImages } : {}),
  };

  // Built per-branch rather than with a computed `type` because Next's
  // OpenGraph type is a discriminated union — `video:release_date` and
  // `video:tag` only exist on the video variants, and a spread wide enough to
  // satisfy both would lose that checking.
  const openGraph: Metadata["openGraph"] =
    type === "website"
      ? { type: "website", ...shared }
      : {
          type,
          ...shared,
          ...(releaseDate ? { releaseDate } : {}),
          ...(tags?.length ? { tags } : {}),
        };

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
  };
}

/**
 * Metadata for a movie or TV detail page.
 *
 * Shared because the two routes had drifted into near-identical copies of it,
 * and because the description fallback below is the part most worth getting
 * right in one place: TMDB has no overview for a long tail of titles, and the
 * old code let those fall through to {@link SITE_DESCRIPTION}. That gave
 * hundreds of pages one identical description, which is precisely the
 * duplicate-content signal that keeps them out of search results. Synthesising
 * from the title, year and genres keeps every page distinct.
 */
export function buildTitleMetadata(detail: TitleDetail): Metadata {
  const isMovie = detail.mediaType === "movie";
  const year = detail.releaseDate?.slice(0, 4);
  const kind = isMovie ? "movie" : "TV series";

  const description = detail.overview
    ? truncate(detail.overview)
    : `Watch ${detail.title}${year ? ` (${year})` : ""} on ${SITE_NAME} — ` +
      `the ${kind}${detail.genres.length ? ` in ${detail.genres.join(", ")}` : ""}.`;

  return buildMetadata({
    // The year disambiguates remakes, which otherwise produce two identical
    // <title>s ("Dune · Cinexa" twice).
    title: year ? `${detail.title} (${year})` : detail.title,
    description,
    path: `/${detail.mediaType}/${detail.id}`,
    type: isMovie ? "video.movie" : "video.tv_show",
    images: [tmdbImage(detail.backdropPath, "w1280") ?? tmdbImage(detail.posterPath, "w780")]
      .filter((url): url is string => Boolean(url)),
    // Discrete terms only. A composed display string like
    // "1999 · Drama, Thriller" is one nonsense keyword, not three real ones.
    keywords: [detail.title, year, kind, ...detail.genres].filter(
      (k): k is string => Boolean(k),
    ),
    releaseDate: detail.releaseDate,
    tags: detail.genres,
  });
}
