import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * One day's AI suggestions per user, on disk.
 *
 * Same reasoning as `filter/ai-store.ts`: on a 20-requests-per-day budget the
 * most expensive thing this app can do is ask the model something it has
 * already answered. Suggestions are keyed by user and stamped with the day, so
 * a user who reloads the home page forty times costs one request, not forty,
 * and a server restart doesn't reset that.
 *
 * Entries for previous days are dropped on write rather than swept on a timer
 * — the file only grows to one row per active user.
 *
 * ponytail: a JSON file rewritten in full. Fine for a personal deployment;
 * move it into Postgres next to `WatchedItem` if this ever has real traffic.
 */

const STORE_PATH = join(process.cwd(), "data", "ai-recommendations.json");

interface StoredSuggestion {
  /** `YYYY-MM-DD` in UTC — the day the request was spent. */
  day: string;
  titles: string[];
}

type Store = Record<string, StoredSuggestion>;

const today = () => new Date().toISOString().slice(0, 10);

let cache: Store | null = null;

async function load(): Promise<Store> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(STORE_PATH, "utf8")) as Store;
  } catch {
    // No file yet, or unreadable. Never fatal — an empty store just means the
    // next render spends a request.
    cache = {};
  }
  return cache;
}

/** Today's stored titles for this user, or null if none were made today. */
export async function readSuggestions(
  userId: string,
): Promise<string[] | null> {
  const store = await load();
  const entry = store[userId];
  return entry && entry.day === today() && entry.titles.length > 0
    ? entry.titles
    : null;
}

export async function writeSuggestions(
  userId: string,
  titles: string[],
): Promise<void> {
  const store = await load();
  const day = today();

  // Drop other users' stale days while we're rewriting the file anyway.
  for (const [key, entry] of Object.entries(store)) {
    if (entry.day !== day) delete store[key];
  }
  store[userId] = { day, titles };

  try {
    await mkdir(dirname(STORE_PATH), { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Read-only filesystem just means no caching, not a broken rail.
  }
}

/** Test seam. */
export function __resetRecommendationStore(): void {
  cache = null;
}
