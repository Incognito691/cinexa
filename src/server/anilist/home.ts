import type { AnimeHome, AnimeItem } from "@/types/anime";

import { anilistQuery } from "./client";

/**
 * Kept off the page entirely. AniList's `isAdult` flag covers explicit
 * titles; Ecchi is excluded too because its covers are what the content
 * filter exists to keep off the screen. Playback still goes through the TMDB
 * detail page, whose full content filter 404s anything it blocks.
 */
const HIDDEN_GENRES = ["Hentai", "Ecchi"];

const REVALIDATE = 1800;

const FIELDS = `
  id isAdult format episodes seasonYear genres averageScore bannerImage
  title { english romaji }
  coverImage { extraLarge color }
  description(asHtml: false)
  studios(isMain: true) { nodes { name } }
  nextAiringEpisode { episode airingAt }
`;

const list = (args: string) =>
  `Page(perPage: 20) { media(type: ANIME, isAdult: false, genre_not_in: $hide, ${args}) { ${FIELDS} } }`;

/** Every rail in one request, via aliases: one hit against the rate limit. */
const HOME_QUERY = `
  query ($season: MediaSeason, $year: Int, $hide: [String]) {
    trending: ${list("sort: TRENDING_DESC")}
    season: ${list("season: $season, seasonYear: $year, sort: POPULARITY_DESC")}
    top: ${list("sort: SCORE_DESC")}
    movies: ${list("format: MOVIE, sort: POPULARITY_DESC")}
  }
`;

interface RawMedia {
  id: number;
  isAdult: boolean;
  format: string | null;
  episodes: number | null;
  seasonYear: number | null;
  genres: string[] | null;
  averageScore: number | null;
  bannerImage: string | null;
  title: { english: string | null; romaji: string | null };
  coverImage: { extraLarge: string | null; color: string | null };
  description: string | null;
  studios: { nodes: { name: string }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

type RawPage = { media: RawMedia[] };

/** AniList's own season boundaries: Winter is Jan–Mar, and so on. */
export function currentSeason(date = new Date()) {
  const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
  const season = seasons[Math.floor(date.getMonth() / 3)];
  const year = date.getFullYear();
  const label = `${season[0]}${season.slice(1).toLowerCase()} ${year}`;
  return { season, year, label };
}

/** AniList descriptions carry `<br>`, `<i>` and entities even with asHtml off. */
export function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toItem(m: RawMedia): AnimeItem {
  return {
    id: m.id,
    title: m.title.english ?? m.title.romaji ?? "Untitled",
    format: m.format,
    cover: m.coverImage.extraLarge,
    color: m.coverImage.color,
    banner: m.bannerImage,
    score: m.averageScore,
    episodes: m.episodes,
    seasonYear: m.seasonYear,
    genres: m.genres ?? [],
    studio: m.studios.nodes[0]?.name ?? null,
    description: m.description ? stripHtml(m.description) : null,
    nextEpisode: m.nextAiringEpisode,
  };
}

/** Belt and braces on top of the query's own `isAdult`/`genre_not_in`. */
const allowed = (m: RawMedia) =>
  !m.isAdult && !(m.genres ?? []).some((g) => HIDDEN_GENRES.includes(g));

export async function fetchAnimeHome(): Promise<AnimeHome> {
  const { season, year, label } = currentSeason();
  const data = await anilistQuery<Record<"trending" | "season" | "top" | "movies", RawPage>>(
    HOME_QUERY,
    { season, year, hide: HIDDEN_GENRES },
    REVALIDATE,
  );

  const pick = (page: RawPage) => page.media.filter(allowed).map(toItem);
  const seasonItems = pick(data.season);

  return {
    seasonLabel: label,
    trending: pick(data.trending),
    season: seasonItems,
    airing: seasonItems
      .filter((i) => i.nextEpisode)
      .sort((a, b) => a.nextEpisode!.airingAt - b.nextEpisode!.airingAt),
    top: pick(data.top),
    movies: pick(data.movies),
  };
}
