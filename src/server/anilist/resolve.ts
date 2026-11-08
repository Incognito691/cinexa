import { fetchSearch } from "@/server/tmdb";
import type { NextAiring } from "@/types/media";

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
}

const FRIBB_URL =
  "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-mini.json";
const MAP_TTL_MS = 24 * 60 * 60 * 1000;

interface FribbRow {
  anilist_id?: number;
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
      map.set(row.anilist_id, { type: "tv", tmdbId: tmdb.tv, season: row.season?.tmdb });
    } else if (tmdb.movie?.length) {
      map.set(row.anilist_id, { type: "movie", tmdbId: tmdb.movie[0] });
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

async function searchFallback(anilistId: number): Promise<PlayTarget | null> {
  const { Media } = await anilistQuery<{
    Media: { format: string | null; title: { english: string | null; romaji: string | null } } | null;
  }>(
    "query ($id: Int) { Media(id: $id, type: ANIME) { format title { english romaji } } }",
    { id: anilistId },
    86_400,
  );
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
