import type { Metadata } from "next";

/**
 * Central metadata builder.
 *
 * Every page (and every future `generateMetadata` on a detail route) should
 * go through `buildMetadata` rather than hand-rolling an object, so canonical
 * URLs, Open Graph, and Twitter cards stay consistent as pages are added.
 */

export const SITE_NAME = "Cinexa";

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
}

export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  images,
  type = "website",
  noIndex = false,
}: BuildMetadataArgs = {}): Metadata {
  const url = new URL(path, SITE_URL).toString();
  // Fall back to the generated app/opengraph-image when a page has no art.
  const ogImages = images?.length ? images : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: type === "website" ? "website" : "video.other",
      siteName: SITE_NAME,
      title: title ? `${title} · ${SITE_NAME}` : SITE_NAME,
      description,
      url,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${SITE_NAME}` : SITE_NAME,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
  };
}
