"use server";

import { revalidatePath } from "next/cache";

import { isFinished, MIN_RESUME_SECONDS } from "@/lib/watch-progress";
import { prisma } from "@/server/db";
import { currentUserId } from "@/server/session";

/**
 * Watch history.
 *
 * Signed-out visitors are a no-op everywhere here rather than an error: login
 * is optional, so browsing and playback must keep working without a session.
 * Callers get `false`/empty and render the un-tracked state.
 *
 * A caveat worth remembering when reading this: playback happens inside a
 * cross-origin iframe, so we cannot observe progress. "Watched" therefore means
 * "opened and stayed a while" (see `WatchTracker`) or "marked by hand" — it is
 * not a completion signal. `season`/`episode` are 0 for movies to keep the
 * unique index usable, since Postgres treats NULLs as distinct.
 */

export type WatchedKeyInput = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
};

const keyOf = (userId: string, input: WatchedKeyInput) => ({
  userId,
  tmdbId: input.tmdbId,
  mediaType: input.mediaType,
  season: input.season ?? 0,
  episode: input.episode ?? 0,
});

export async function markWatched(input: WatchedKeyInput): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const key = keyOf(userId, input);

  await prisma.watchedItem.upsert({
    where: { userId_tmdbId_mediaType_season_episode: key },
    // Re-watching bumps `watchedAt` via @updatedAt, which is what will order
    // the Continue Watching rail.
    update: {},
    create: key,
  });

  revalidatePath(`/${input.mediaType}/${input.tmdbId}`);
  return true;
}

export async function toggleWatched(input: WatchedKeyInput): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const key = keyOf(userId, input);

  const existing = await prisma.watchedItem.findUnique({
    where: { userId_tmdbId_mediaType_season_episode: key },
    select: { id: true },
  });

  if (existing) {
    await prisma.watchedItem.delete({ where: { id: existing.id } });
    revalidatePath(`/${input.mediaType}/${input.tmdbId}`);
    return false;
  }

  await prisma.watchedItem.create({ data: key });
  revalidatePath(`/${input.mediaType}/${input.tmdbId}`);
  return true;
}

/**
 * Every watched episode of one show, as `s{n}e{n}` keys — the shape the
 * episode list wants for O(1) lookups. Empty when signed out.
 */
export async function getWatchedEpisodes(tmdbId: number): Promise<string[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const rows = await prisma.watchedItem.findMany({
    where: { userId, tmdbId, mediaType: "tv" },
    select: { season: true, episode: true },
  });

  return rows.map((r) => `s${r.season}e${r.episode}`);
}

export type ContinueWatchingEntry = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  season: number;
  episode: number;
  positionSeconds: number;
  runtimeSeconds: number;
  watchedAt: Date;
};

/**
 * Records where playback got to. Called by `/api/watch/progress`, which is a
 * route rather than a server action so the tracker can `sendBeacon` it as the
 * page unloads — a pending server action just dies with the page.
 */
export async function saveProgress(
  input: WatchedKeyInput & { positionSeconds: number; runtimeSeconds: number },
): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;

  const runtimeSeconds = Math.max(0, Math.floor(input.runtimeSeconds));
  const positionSeconds = Math.max(
    0,
    Math.min(Math.floor(input.positionSeconds), runtimeSeconds || Infinity),
  );

  const key = keyOf(userId, input);
  await prisma.watchedItem.upsert({
    where: { userId_tmdbId_mediaType_season_episode: key },
    update: { positionSeconds, runtimeSeconds },
    create: { ...key, positionSeconds, runtimeSeconds },
  });
  return true;
}

/**
 * Seconds to resume this exact title/episode at, or `undefined`.
 *
 * A position under {@link MIN_RESUME_SECONDS} (a bounce) or past
 * {@link FINISHED_RATIO} (finished — start it over) is not worth resuming.
 */
export async function getResumePosition(
  input: WatchedKeyInput,
): Promise<number | undefined> {
  const userId = await currentUserId();
  if (!userId) return undefined;

  const row = await prisma.watchedItem.findUnique({
    where: { userId_tmdbId_mediaType_season_episode: keyOf(userId, input) },
    select: { positionSeconds: true, runtimeSeconds: true },
  });
  if (!row || row.positionSeconds < MIN_RESUME_SECONDS) return undefined;
  if (isFinished(row.positionSeconds, row.runtimeSeconds)) return undefined;
  return row.positionSeconds;
}

/**
 * Most recent watch per title, newest first — the Continue Watching rail.
 *
 * One row per *title*, not per episode: a show you're four episodes into is one
 * card, at the episode you last opened. A finished **movie** drops off the list
 * — it isn't "continuing" — while a finished episode stays, because the caller
 * turns it into a link to the next one.
 */
export async function getContinueWatching(
  limit = 8,
): Promise<ContinueWatchingEntry[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  // ponytail: over-fetch and dedupe in JS. `DISTINCT ON` would need a raw
  // query for a rail that shows 8 cards; revisit if a history gets long
  // enough that 60 rows stop covering `limit` distinct titles.
  const rows = await prisma.watchedItem.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    take: 60,
    select: {
      tmdbId: true,
      mediaType: true,
      season: true,
      episode: true,
      positionSeconds: true,
      runtimeSeconds: true,
      watchedAt: true,
    },
  });

  const seen = new Set<string>();
  const latest: ContinueWatchingEntry[] = [];
  for (const row of rows) {
    const key = `${row.mediaType}:${row.tmdbId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (
      row.mediaType === "movie" &&
      isFinished(row.positionSeconds, row.runtimeSeconds)
    ) {
      continue;
    }

    latest.push(row);
    if (latest.length === limit) break;
  }
  return latest;
}

export async function isSignedIn(): Promise<boolean> {
  return (await currentUserId()) !== null;
}

/**
 * Wipes the signed-in user's entire watch history.
 *
 * This also empties Continue Watching and every "watched" tick, which is the
 * whole point — it's the settings-page control for "forget what I've seen".
 */
export async function clearWatchHistory(): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;

  await prisma.watchedItem.deleteMany({ where: { userId } });
  revalidatePath("/continue-watching");
  revalidatePath("/");
  return true;
}
