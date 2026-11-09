import { fetchSearch } from "@/server/tmdb";
import { animeHref } from "@/lib/anime-slug";
import type { MediaCardItem, NextAiring } from "@/types/media";

import { anilistQuery } from "./client";

/**
 * AniList id → the TMDB title that actually plays.
 *
 * Playback, the detail pages and the content filter all run on TMDB ids, so
 * an AniList card has to be matched to one before it can be watched. Two
 * steps:
 *
 *  1. **Fribb/anime-lists**, a community-maintained cross-reference of every
 *     anime database. It also knows that AniList's "Jujutsu Kaisen Season 2"
 *     is season 2 of TMDB's one Jujutsu Kaisen show, which no title search
 *     can work out.
 *  2. For shows too new to be listed yet, a TMDB search on the title with any
 *     "Season N" suffix split off into the season number.
 */

export interface PlayTarget {
  type: "movie" | "tv";
  tmdbId: number;
  /** TV only; absent means season 1. */
  season?: number;
  /** MyAnimeList id: the anime player is keyed on it. */
  malId?: number;
}

const FRIBB_URL =
  "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-mini.json";
const MAP_TTL_MS = 24 * 60 * 60 * 1000;

interface FribbRow {
  anilist_id?: number;
  mal_id?: number;
  themoviedb_id?: { tv?: number; movie?: number[] };
  season?: { tmdb?: number };
}

/** Exported for the test; builds the lookup from the raw list. */
export function buildMap(rows: FribbRow[]): Map<number, PlayTarget> {
  const map = new Map<number, PlayTarget>();
  for (const row of rows) {
    const tmdb = row.themoviedb_id;
    if (!row.anilist_id || !tmdb) continue;
    if (tmdb.tv) {
      map.set(row.anilist_id, { type: "tv", tmdbId: tmdb.tv, season: row.season?.tmdb, malId: row.mal_id });
    } else if (tmdb.movie?.length) {
      map.set(row.anilist_id, { type: "movie", tmdbId: tmdb.movie[0], malId: row.mal_id });
    }
  }
  return map;
}

/*
 * ponytail: the list is ~6 MB, over Next's 2 MB data-cache ceiling, so it's
 * held in module memory for a day instead. That's one download per server
 * instance per day; vendor a trimmed copy into `data/` if cold starts on
 * serverless make it hurt. Storing the promise stops parallel requests from
 * each downloading it.
 */
let mapping: { at: number; map: Promise<Map<number, PlayTarget>> } | null = null;

/** AniList ids the cross-reference can turn into something playable. */
export const playableAnime = (): Promise<Map<number, PlayTarget>> => loadMap();

function loadMap(): Promise<Map<number, PlayTarget>> {
  if (!mapping || Date.now() - mapping.at > MAP_TTL_MS) {
    const map = fetch(FRIBB_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`anime-lists failed: ${res.status}`);
        return res.json() as Promise<FribbRow[]>;
      })
      .then(buildMap);
    // A failed download mustn't be cached for a day.
    map.catch(() => {
      mapping = null;
    });
    mapping = { at: Date.now(), map };
  }
  return mapping.map;
}

let animeKeys: { from: Promise<Map<number, PlayTarget>>; keys: Promise<Set<string>> } | null = null;

/**
 * Every TMDB title that is anime, as `${mediaType}:${tmdbId}` keys, derived
 * from the same cross-reference. More precise than TMDB's "Animation" genre,
 * which also covers Western cartoons. Rebuilt only when the list reloads.
 */
export function animeTmdbKeys(): Promise<Set<string>> {
  const map = loadMap();
  if (animeKeys?.from !== map) {
    const keys = map.then((m) => new Set([...m.values()].map((t) => `${t.type}:${t.tmdbId}`)));
    animeKeys = { from: map, keys };
  }
  return animeKeys.keys;
}

/**
 * An episode in anime-database terms: the MyAnimeList entry and its own
 * episode number. MAL rather than AniList because the anime player's
 * `/stream/anilist/...` route 404s for every id, while `/stream/mal/...` works.
 */
export interface AnimeEpisodeRef {
  malId: number;
  episode: number;
}

/** One entry covering part of a TMDB season, in airing order. */
export interface SeasonPart {
  malId: number;
  /** null while still airing: then it's the last part and open-ended. */
  episodes: number | null;
}

/**
 * Which part of a split TMDB season an episode falls in, and its number
 * within that part. TMDB often keeps a two-cour season as one season while
 * AniList lists each cour separately, numbering each from 1.
 */
export function locateInParts(parts: SeasonPart[], episode: number): AnimeEpisodeRef | null {
  let before = 0;
  for (const part of parts) {
    if (part.episodes === null || episode <= before + part.episodes) {
      return { malId: part.malId, episode: episode - before };
    }
    before += part.episodes;
  }
  return null;
}

/** Episode number counted from the show's first episode, across seasons. */
export function absoluteEpisode(
  seasons: { seasonNumber: number; episodeCount: number }[],
  season: number,
  episode: number,
): number {
  return (
    seasons
      .filter((s) => s.seasonNumber >= 1 && s.seasonNumber < season)
      .reduce((sum, s) => sum + s.episodeCount, 0) + episode
  );
}

type Entry = { anilistId: number; malId?: number };

let reverse: { from: Promise<Map<number, PlayTarget>>; index: Promise<Map<string, Entry[]>> } | null = null;

/**
 * TMDB → AniList ids, keyed `movie:<id>`, `tv:<id>:<season>` or, for entries
 * the cross-reference maps to a whole show without a season (One Piece),
 * `tv:<id>:all`.
 */
function reverseIndex(): Promise<Map<string, Entry[]>> {
  const map = loadMap();
  if (reverse?.from !== map) {
    const index = map.then((m) => {
      const out = new Map<string, Entry[]>();
      for (const [anilistId, t] of m) {
        const key = t.type === "movie" ? `movie:${t.tmdbId}` : `tv:${t.tmdbId}:${t.season ?? "all"}`;
        out.set(key, [...(out.get(key) ?? []), { anilistId, malId: t.malId }]);
      }
      return out;
    });
    reverse = { from: map, index };
  }
  return reverse.index;
}

/**
 * The AniList id for a TMDB title (and season), for building `/anime/...`
 * links to something only known by its TMDB id, like a history row.
 */
export async function anilistIdFor(target: {
  tmdbId: number;
  mediaType: "movie" | "tv";
  season?: number;
}): Promise<number | null> {
  const index = await reverseIndex();
  const entries =
    target.mediaType === "movie"
      ? index.get(`movie:${target.tmdbId}`)
      : (index.get(`tv:${target.tmdbId}:${target.season ?? 1}`) ?? index.get(`tv:${target.tmdbId}:all`));
  return entries?.[0]?.anilistId ?? null;
}

/**
 * TMDB cards relinked into the anime section, keeping only the anime: on an
 * anime page, "more like this" shouldn't send the viewer out to `/tv/...`.
 */
export async function asAnimeCards(items: MediaCardItem[]): Promise<MediaCardItem[]> {
  const linked = await Promise.all(
    items.map(async (item) => {
      const anilistId = await anilistIdFor({ tmdbId: item.id, mediaType: item.mediaType });
      if (!anilistId) return null;
      const href = animeHref(anilistId, item.title);
      return { ...item, href, watchHref: `${href}/watch` };
    }),
  );
  return linked.filter((item): item is NonNullable<typeof item> => item !== null);
}

/** Split parts of one TMDB season, in airing order. Specials and films are left out. */
async function seasonParts(ids: number[]): Promise<SeasonPart[]> {
  const { Page } = await anilistQuery<{
    Page: {
      media: {
        id: number;
        idMal: number | null;
        format: string | null;
        episodes: number | null;
        startDate: { year: number | null; month: number | null; day: number | null };
      }[];
    };
  }>(
    `query ($ids: [Int]) {
      Page(perPage: 50) {
        media(id_in: $ids, type: ANIME) { id idMal format episodes startDate { year month day } }
      }
    }`,
    { ids },
    86_400,
  );
  const date = (d: { year: number | null; month: number | null; day: number | null }) =>
    (d.year ?? 9999) * 10_000 + (d.month ?? 12) * 100 + (d.day ?? 31);
  return Page.media
    .filter((m) => m.idMal && (m.format === "TV" || m.format === "TV_SHORT" || m.format === "ONA"))
    .sort((a, b) => date(a.startDate) - date(b.startDate))
    .map((m) => ({ malId: m.idMal!, episodes: m.episodes }));
}

/**
 * The AniList entry and episode for a TMDB title, or null when it isn't
 * anime the cross-reference knows. `seasons` (TMDB's per-season episode
 * counts) is only needed for whole-show entries numbered absolutely.
 */
export async function animeEpisodeFor(
  target: { tmdbId: number; mediaType: "movie" | "tv"; season?: number; episode?: number },
  seasons: { seasonNumber: number; episodeCount: number }[] = [],
): Promise<AnimeEpisodeRef | null> {
  const index = await reverseIndex();

  if (target.mediaType === "movie") {
    const malId = index.get(`movie:${target.tmdbId}`)?.[0]?.malId;
    return malId ? { malId, episode: 1 } : null;
  }

  const season = target.season ?? 1;
  const episode = target.episode ?? 1;
  const entries = index.get(`tv:${target.tmdbId}:${season}`);

  if (entries?.length === 1) {
    const malId = entries[0].malId;
    return malId ? { malId, episode } : null;
  }
  if (entries && entries.length > 1) {
    return locateInParts(await seasonParts(entries.map((e) => e.anilistId)), episode);
  }

  const whole = index.get(`tv:${target.tmdbId}:all`)?.[0]?.malId;
  return whole ? { malId: whole, episode: absoluteEpisode(seasons, season, episode) } : null;
}

/**
 * "Black Clover Season 2" → { query: "Black Clover", season: 2 }.
 * Also handles "2nd Season" and a trailing ": Part 2" (dropped; TMDB folds
 * parts into the season).
 */
export function splitSeason(title: string): { query: string; season?: number } {
  const cleaned = title.replace(/[\s:]+part\s*\d+$/i, "").trim();
  const match = cleaned.match(/^(.*?)[\s:]+(?:season\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season)$/i);
  if (!match) return { query: cleaned };
  return { query: match[1].trim(), season: Number(match[2] ?? match[3]) };
}

async function anilistMedia(anilistId: number) {
  const { Media } = await anilistQuery<{
    Media: { format: string | null; title: { english: string | null; romaji: string | null } } | null;
  }>(
    "query ($id: Int) { Media(id: $id, type: ANIME) { format title { english romaji } } }",
    { id: anilistId },
    86_400,
  );
  return Media;
}

/** An AniList title's display name (English, else romaji), for slugs. */
export async function anilistTitle(anilistId: number): Promise<string | null> {
  const media = await anilistMedia(anilistId);
  return media?.title.english ?? media?.title.romaji ?? null;
}

async function searchFallback(anilistId: number): Promise<PlayTarget | null> {
  const Media = await anilistMedia(anilistId);
  const title = Media?.title.english ?? Media?.title.romaji;
  if (!Media || !title) return null;

  const type = Media.format === "MOVIE" ? "movie" : "tv";
  const { query, season } = splitSeason(title);
  // The search runs the content filter, so a blocked title never matches.
  const { items } = await fetchSearch({ type, q: query, page: 1 });
  const hit = items[0];
  return hit ? { type, tmdbId: hit.id, season: type === "tv" ? season : undefined } : null;
}

/** The next episode's exact air time, or null when nothing is scheduled. */
export async function fetchNextAiring(anilistId: number): Promise<NextAiring | null> {
  const { Media } = await anilistQuery<{ Media: { nextAiringEpisode: NextAiring | null } | null }>(
    "query ($id: Int) { Media(id: $id, type: ANIME) { nextAiringEpisode { episode airingAt } } }",
    { id: anilistId },
    1800,
  );
  return Media?.nextAiringEpisode ?? null;
}

export async function resolveAnilist(anilistId: number): Promise<PlayTarget | null> {
  const known = await loadMap()
    .then((map) => map.get(anilistId))
    .catch(() => undefined);
  return known ?? searchFallback(anilistId);
}
