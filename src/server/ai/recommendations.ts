import { fetchRelated, fetchSearch, fetchTitleDetail } from "@/server/tmdb";
import { getContinueWatching } from "@/server/watch-history";
import { currentUserId } from "@/server/session";
import type { MediaCardItem, MediaType } from "@/types/media";

import { aiUnavailable, callGemini } from "./gemini";
import { readSuggestions, writeSuggestions } from "./recommendation-store";

/**
 * "Because you watched …" — the home rail.
 *
 * **The TMDB path is the default, not the fallback.** The Gemini free tier is
 * 20 requests per day for the entire project, shared with the content filter,
 * so the overwhelming majority of renders must not touch the model at all.
 * TMDB's own recommendations are behavioural, free, cached, and good; the AI
 * pass exists to add cross-genre picks TMDB's co-watch graph won't surface,
 * once a day per user.
 *
 * Order of preference:
 *   1. A stored AI suggestion list for today  → zero requests
 *   2. One AI call, if the budget and breaker allow → stored for the day
 *   3. TMDB related titles for the most recent watch → always works
 *
 * Every step degrades into the next. A signed-out visitor, an empty history,
 * a dead key and an exhausted quota all end in the same place: either a
 * sensible rail or no rail, never an error.
 */

/** How many watched titles the model gets as context. */
const HISTORY_CONTEXT = 8;
const RAIL_SIZE = 12;

export interface RecommendationRail {
  /** The title the rail is justified by, e.g. "Because you watched Reacher". */
  seedTitle: string;
  items: MediaCardItem[];
  /** Which path produced this. Surfaced in the UI so it isn't a black box. */
  source: "ai" | "tmdb";
}

export async function getRecommendationRail(): Promise<RecommendationRail | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const history = await getContinueWatching(HISTORY_CONTEXT);
  if (history.length === 0) return null;

  // Resolve the history into titles once — both paths need the seed's name.
  const watched = (
    await Promise.all(
      history.map(async (entry) => {
        const detail = await fetchTitleDetail(entry.mediaType, entry.tmdbId).catch(
          () => null,
        );
        return detail
          ? {
              title: detail.title,
              mediaType: entry.mediaType,
              tmdbId: entry.tmdbId,
              genres: detail.genres,
            }
          : null;
      }),
    )
  ).filter((w): w is NonNullable<typeof w> => w !== null);

  if (watched.length === 0) return null;
  const seed = watched[0];

  const aiItems = await aiSuggestions(userId, watched);
  if (aiItems.length >= 4) {
    return { seedTitle: seed.title, items: aiItems, source: "ai" };
  }

  // Deterministic path. Also covers "the model returned three usable titles",
  // which isn't enough for a rail.
  const related = await fetchRelated(seed.mediaType, seed.tmdbId).catch(
    () => null,
  );
  const items = (related?.items ?? []).slice(0, RAIL_SIZE);
  return items.length > 0
    ? { seedTitle: seed.title, items, source: "tmdb" }
    : null;
}

type WatchedContext = {
  title: string;
  mediaType: MediaType;
  tmdbId: number;
  genres: string[];
};

/**
 * At most one Gemini request per user per day.
 *
 * The model returns *title strings*, not ids — asking it for TMDB ids invites
 * confident hallucination, and a wrong id silently renders the wrong film.
 * Every suggestion is resolved through TMDB search instead, so anything the
 * model invented simply finds no match and drops out.
 */
async function aiSuggestions(
  userId: string,
  watched: WatchedContext[],
): Promise<MediaCardItem[]> {
  const stored = await readSuggestions(userId);
  if (stored) return resolveTitles(stored);

  if (aiUnavailable()) return [];

  const system =
    "You recommend films and TV shows. Given a viewing history, suggest titles " +
    "the viewer has not already watched. Favour well-known, findable titles. " +
    'Reply as JSON: {"titles":["Exact Title (Year)", ...]}. No prose.';

  const user = JSON.stringify({
    watched: watched.map((w) => ({
      title: w.title,
      type: w.mediaType,
      genres: w.genres.slice(0, 3),
    })),
    want: RAIL_SIZE,
  });

  const text = await callGemini(system, user, 900, 8_000);
  if (!text) return [];

  let titles: string[];
  try {
    const parsed = JSON.parse(text) as { titles?: unknown };
    titles = Array.isArray(parsed.titles)
      ? parsed.titles.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
  if (titles.length === 0) return [];

  // Stored even though resolution might yet fail: the request has been spent
  // either way, and re-spending it on the next page view is the worst outcome.
  await writeSuggestions(userId, titles);
  return resolveTitles(titles);
}

/**
 * Model titles → real cards, via TMDB search.
 *
 * Strips the "(Year)" the prompt asks for before searching — TMDB treats it as
 * part of the query and returns nothing. Anything that doesn't resolve to a
 * first hit is dropped, which is also how hallucinated titles get filtered
 * out. `fetchSearch` runs the content filter, so nothing blocked can enter the
 * rail through this path.
 */
async function resolveTitles(titles: string[]): Promise<MediaCardItem[]> {
  const resolved = await Promise.all(
    titles.slice(0, RAIL_SIZE).map(async (raw) => {
      const q = raw.replace(/\s*\(\d{4}\)\s*$/, "").trim();
      if (!q) return null;
      const hit = await fetchSearch({ type: "movie", q, page: 1 }).catch(
        () => null,
      );
      return hit?.items[0] ?? null;
    }),
  );

  // Dedupe: the model happily suggests the same film twice under two names.
  const seen = new Set<number>();
  const out: MediaCardItem[] = [];
  for (const item of resolved) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
