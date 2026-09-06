import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { filterAiCache, type AiCacheEntry } from "./cache";

/**
 * Durable store for AI verdicts — and, by consequence, the hard blocklist.
 *
 * The Gemini free tier allows 20 requests/day, so re-classifying a title the
 * model has already judged is the most expensive thing this filter can do.
 * Every verdict is written here and reloaded on boot, so each title costs one
 * classification *ever* rather than one per server restart.
 *
 * This doubles as the "AI is exhausted" fallback with no extra machinery:
 * `classifyWithAI` reads `filterAiCache` **before** it checks the circuit
 * breaker, so a persisted EROTIC verdict keeps blocking a title when the quota
 * is gone, the key is missing, or the network is down. The file accumulates
 * into a permanent, reviewable blocklist — commit it and it ships with the app.
 *
 * ponytail: a JSON file rewritten in full on each flush. Fine at this size
 * (a few thousand entries); move it into Postgres alongside the Prisma work
 * if it ever outgrows that.
 */

const STORE_PATH = join(process.cwd(), "data", "ai-verdicts.json");

/** Persisted entries never expire — re-deriving them costs real quota. */
const PERSISTED_TTL_MS = Number.MAX_SAFE_INTEGER - Date.now();

type VerdictMap = Record<string, AiCacheEntry>;

/** Mirrors what's on disk, so a flush doesn't have to re-read the file. */
let verdicts: VerdictMap = {};
let loaded: Promise<void> | null = null;
let dirty = false;
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Load the store into `filterAiCache`. Idempotent and safe to await on every
 * request — the read happens once per process.
 */
export function loadAiVerdicts(): Promise<void> {
  loaded ??= (async () => {
    try {
      const raw = await readFile(STORE_PATH, "utf8");
      verdicts = JSON.parse(raw) as VerdictMap;
    } catch {
      // No file yet (or unreadable) — start empty. Never fatal.
      verdicts = {};
      return;
    }
    for (const [key, entry] of Object.entries(verdicts)) {
      if (!entry?.class) continue;
      filterAiCache.set(key, entry, PERSISTED_TTL_MS);
    }
  })();
  return loaded;
}

/** Record fresh verdicts and schedule a write. */
export function recordAiVerdicts(entries: Iterable<[string, AiCacheEntry]>): void {
  let changed = false;
  for (const [key, entry] of entries) {
    if (verdicts[key]?.class === entry.class) continue;
    verdicts[key] = entry;
    changed = true;
  }
  if (!changed) return;

  dirty = true;
  // Coalesce the bursts that come from classifying a page at a time.
  flushTimer ??= setTimeout(() => {
    flushTimer = null;
    void flushAiVerdicts();
  }, 1_000);
  // Don't hold the process open for a cache write.
  flushTimer.unref?.();
}

/** Write the store to disk. Never throws — a read-only FS just means no cache. */
export async function flushAiVerdicts(): Promise<void> {
  if (!dirty) return;
  dirty = false;
  try {
    await mkdir(dirname(STORE_PATH), { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(verdicts, null, 2), "utf8");
  } catch {
    // Ignore: persistence is an optimisation, not a correctness requirement.
  }
}

/** Everything the AI has ruled unwatchable. Exported for the debug endpoint. */
export function blockedVerdicts(): VerdictMap {
  return Object.fromEntries(
    Object.entries(verdicts).filter(
      ([, v]) => v.class === "EROTIC" || v.class === "PORNOGRAPHIC",
    ),
  );
}

/** Test seam. */
export function __resetAiStore(): void {
  verdicts = {};
  loaded = null;
  dirty = false;
}
