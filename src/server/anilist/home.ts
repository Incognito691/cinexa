import type { AnimeHome, AnimeItem } from "@/types/anime";

import { anilistQuery } from "./client";
import { playableAnime } from "./resolve";

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

/**
 * Anime matching a search term, most popular first. Same exclusions as
 * the page. AniList's SEARCH_MATCH ranks short exact titles first ("one"
 * gives "001", "AS ONE"); popularity puts One Piece and One-Punch Man on top.
 *
 * ponytail: AniList's 30 req/min is shared by every visitor, so each term is
 * cached for a day and the search box debounces. If search traffic outgrows
 * that, mirror titles into Postgres and search locally.
 */
export async function searchAnime(q: string): Promise<AnimeItem[]> {
  const run = async (term: string, perPage: number) => {
    const data = await anilistQuery<{ Page: RawPage }>(
      `query ($q: String, $hide: [String], $n: Int) {
        Page(perPage: $n) {
          media(type: ANIME, search: $q, isAdult: false, genre_not_in: $hide,
                sort: POPULARITY_DESC) { ${FIELDS} }
        }
      }`,
      { q: term, hide: HIDDEN_GENRES, n: perPage },
      86_400,
    );
    return data.Page.media.filter(allowed).map(toItem);
  };

  const items = await run(q, 8);
  // AniList matches whole words only, so a half-typed last word ("one p")
  // finds nothing. Search the finished words and keep titles containing
  // what was typed so far.
  const head = q.replace(/\s+\S+$/, "");
  if (items.length || head === q) return items;
  const typed = q.toLowerCase();
  return (await run(head, 25)).filter((i) => i.title.toLowerCase().includes(typed)).slice(0, 8);
}

/**
 * Small cover images of trending and popular anime, for the Surprise page's
 * poster wall. One request, cached a day.
 */
export async function fetchAnimeWallCovers(): Promise<string[]> {
  const page = (sort: string) =>
    `Page(perPage: 50) { media(type: ANIME, isAdult: false, genre_not_in: $hide, sort: ${sort}) { coverImage { large } } }`;
  const data = await anilistQuery<Record<"trending" | "popular", { media: { coverImage: { large: string | null } }[] }>>(
    `query ($hide: [String]) { trending: ${page("TRENDING_DESC")} popular: ${page("POPULARITY_DESC")} }`,
    { hide: HIDDEN_GENRES },
    86_400,
  );
  const covers = [...data.trending.media, ...data.popular.media]
    .map((m) => m.coverImage.large)
    .filter((c): c is string => Boolean(c));
  return [...new Set(covers)];
}

/** AniList's genre list, minus the ones the site never shows. Cached a day. */
export async function fetchAnimeGenres(): Promise<string[]> {
  const { GenreCollection } = await anilistQuery<{ GenreCollection: string[] }>(
    "query { GenreCollection }",
    {},
    86_400,
  );
  return GenreCollection.filter((g) => !HIDDEN_GENRES.includes(g));
}

/**
 * One random anime, for the Surprise page: a random page of the genre's 400
 * most popular, then a random title on it.
 *
 * Only titles the cross-reference can map to TMDB are drawn, so "Watch now"
 * always has something to play. Each (genre, page) query is cached a day, so
 * a shuffle costs at most one AniList request and usually none.
 */
export async function randomAnime(genre: string | null, excludeId?: number): Promise<AnimeItem | null> {
  const run = async (page: number) => {
    const data = await anilistQuery<{ Page: RawPage }>(
      `query ($page: Int, $genre: String, $hide: [String]) {
        Page(page: $page, perPage: 50) {
          media(type: ANIME, isAdult: false, genre: $genre, genre_not_in: $hide,
                format_in: [TV, MOVIE, ONA], sort: POPULARITY_DESC) { ${FIELDS} }
        }
      }`,
      // AniList ignores a null argument, so "any genre" is just genre: null.
      { page, genre, hide: HIDDEN_GENRES },
      86_400,
    );
    return data.Page.media;
  };

  const page = 1 + Math.floor(Math.random() * 8);
  let media = await run(page);
  // A niche genre may not have that many pages.
  if (media.length === 0 && page > 1) media = await run(1);

  const known = await playableAnime().catch(() => null);
  const pool = media
    .filter(allowed)
    .filter((m) => !known || known.has(m.id))
    .map(toItem)
    .filter((i) => i.cover && i.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

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
