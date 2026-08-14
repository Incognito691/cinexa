/**
 * In-memory LRU-ish caches for the content filter.
 *
 * No external dependency — a Map keyed on `${mediaType}:${tmdbId}` with a TTL.
 * Eviction: when the Map exceeds `maxEntries`, the oldest entry is dropped.
 *
 * All caches are in-process; cold-start empties them. That's fine for this build —
 * each Node instance rebuilds the hot set as users browse, and the content set
 * is small (max ~10k distinct titles in active pagination).
 */

type NamespacedKey = string;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  insertedAt: number;
}

const DEFAULT_MAX_ENTRIES = 5_000;

function makeCache<T>(maxEntries = DEFAULT_MAX_ENTRIES) {
  const map = new Map<NamespacedKey, CacheEntry<T>>();

  function get(key: NamespacedKey): T | undefined {
    const entry = map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key: NamespacedKey, value: T, ttlMs: number): void {
    const now = Date.now();
    if (map.size >= maxEntries) {
      // Drop the oldest entry by insertion time.
      const oldestKey = map.keys().next().value;
      if (oldestKey !== undefined) map.delete(oldestKey);
    }
    map.set(key, {
      value,
      expiresAt: now + ttlMs,
      insertedAt: now,
    });
  }

  function clear(): void {
    map.clear();
  }

  function size(): number {
    return map.size;
  }

  return { get, set, clear, size };
}

export const filterDecisionCache = makeCache<unknown>(5_000);
export const filterAiCache = makeCache<unknown>(5_000);
export const filterDetailCache = makeCache<unknown>(10_000);

export type AiCacheEntry = {
  class: "SAFE" | "MATURE" | "EROTIC" | "PORNOGRAPHIC";
  confidence: number;
};

/** 30 days — content classifications rarely change. */
export const AI_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 7 days — TMDB detail payloads change occasionally with cast/keyword edits. */
export const DETAIL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
