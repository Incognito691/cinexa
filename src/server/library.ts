"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/server/db";
import { currentUserId } from "@/server/session";
import type {
  CollectionFolderRow,
  LibraryKeys,
  LibraryResult,
  MediaType,
} from "@/types/media";

/**
 * Favourites and collections.
 *
 * Same contract as `watch-history.ts`: signed out is a silent no-op, never an
 * error, because login is optional everywhere on this site.
 *
 * **Every mutation scopes by `userId` inside the WHERE clause.** Folder and
 * item ids arrive from the browser, so `update({ where: { id } })` would let
 * any signed-in user rename or delete another user's folder by guessing a
 * cuid. `updateMany({ where: { id, userId } })` cannot — it matches zero rows
 * and reports "not found". That's why the folder operations below all use the
 * `-Many` variants for what look like single-row writes.
 */

export type TitleKeyInput = {
  tmdbId: number;
  mediaType: MediaType;
};

// `LibraryResult`, `CollectionFolderRow` and `CollectionEntry` live in
// `types/` rather than here: the manage dialog is a client component, and
// client code never imports from `server/` — not even type-only.

const FOLDER_NAME_MAX = 60;

const keyOf = (userId: string, input: TitleKeyInput) => ({
  userId,
  tmdbId: input.tmdbId,
  mediaType: input.mediaType,
});

/** `${mediaType}:${tmdbId}` — the shape the client's lookup sets use. */
const cardKey = (row: { mediaType: MediaType; tmdbId: number }) =>
  `${row.mediaType}:${row.tmdbId}`;

function revalidateLibrary() {
  revalidatePath("/favourites");
  revalidatePath("/my-collection");
}

/**
 * Trim and bounds-check a user-supplied folder name.
 *
 * Returns the cleaned name or an error — an all-whitespace name would
 * otherwise produce a folder that renders as an invisible heading.
 */
function cleanFolderName(
  raw: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim();
  if (!name) return { ok: false, error: "Give the folder a name." };
  if (name.length > FOLDER_NAME_MAX) {
    return { ok: false, error: `Keep it under ${FOLDER_NAME_MAX} characters.` };
  }
  return { ok: true, name };
}

// ──────────────────────────────── Reads ────────────────────────────────

/**
 * Both key sets in one round trip.
 *
 * `/api/library/keys` serves this to every heart and collect button on the
 * page at once — React Query dedupes the identical query across all of them,
 * so a grid of forty posters costs one request rather than forty.
 */
export async function getLibraryKeys(): Promise<LibraryKeys> {
  const userId = await currentUserId();
  if (!userId) return { favourites: [], collected: [], signedIn: false };

  const [favourites, collected] = await Promise.all([
    prisma.favourite.findMany({
      where: { userId },
      select: { tmdbId: true, mediaType: true },
    }),
    prisma.collectionItem.findMany({
      where: { userId },
      select: { tmdbId: true, mediaType: true },
    }),
  ]);

  return {
    favourites: favourites.map(cardKey),
    collected: collected.map(cardKey),
    signedIn: true,
  };
}

export type LibraryRow = {
  tmdbId: number;
  mediaType: MediaType;
  createdAt: Date;
};

/** Favourited titles, newest first. Empty when signed out. */
export async function listFavourites(): Promise<LibraryRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  return prisma.favourite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { tmdbId: true, mediaType: true, createdAt: true },
  });
}

export type CollectionRow = LibraryRow & {
  /** The `CollectionItem` row id — what the manage UI moves between folders. */
  id: string;
  folderId: string | null;
};

/**
 * The whole collection in one shot: every item plus every folder.
 *
 * Folders come back even when empty — a folder you just created and haven't
 * filled yet still has to be visible, or "create folder" looks broken.
 */
export async function listCollection(): Promise<{
  items: CollectionRow[];
  folders: CollectionFolderRow[];
}> {
  const userId = await currentUserId();
  if (!userId) return { items: [], folders: [] };

  const [items, folders] = await Promise.all([
    prisma.collectionItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tmdbId: true,
        mediaType: true,
        folderId: true,
        createdAt: true,
      },
    }),
    prisma.collectionFolder.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, _count: { select: { items: true } } },
    }),
  ]);

  return {
    items,
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      itemCount: f._count.items,
    })),
  };
}

// ────────────────────────────── Toggles ──────────────────────────────

/** Adds or removes a favourite. Returns the state it ended in. */
export async function toggleFavourite(input: TitleKeyInput): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const key = keyOf(userId, input);

  const existing = await prisma.favourite.findUnique({
    where: { userId_tmdbId_mediaType: key },
    select: { id: true },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    revalidateLibrary();
    return false;
  }

  await prisma.favourite.create({ data: key });
  revalidateLibrary();
  return true;
}

/**
 * Adds or removes a collection item. Returns the state it ended in.
 *
 * Removing drops the row outright, folder placement and all. Re-adding later
 * starts it unfiled, which is the honest behaviour — remembering a folder for
 * something the user explicitly removed would be a surprise.
 */
export async function toggleCollected(input: TitleKeyInput): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const key = keyOf(userId, input);

  const existing = await prisma.collectionItem.findUnique({
    where: { userId_tmdbId_mediaType: key },
    select: { id: true },
  });

  if (existing) {
    await prisma.collectionItem.delete({ where: { id: existing.id } });
    revalidateLibrary();
    return false;
  }

  await prisma.collectionItem.create({ data: key });
  revalidateLibrary();
  return true;
}

// ────────────────────────────── Folders ──────────────────────────────

export async function createFolder(rawName: string): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage collections." };

  const cleaned = cleanFolderName(rawName);
  if (!cleaned.ok) return cleaned;

  // The unique index on [userId, name] is the real guard; catching its
  // violation is cheaper and race-free compared to checking first.
  try {
    await prisma.collectionFolder.create({
      data: { userId, name: cleaned.name },
    });
  } catch {
    return { ok: false, error: `"${cleaned.name}" already exists.` };
  }

  revalidateLibrary();
  return { ok: true };
}

export async function renameFolder(
  folderId: string,
  rawName: string,
): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage collections." };

  const cleaned = cleanFolderName(rawName);
  if (!cleaned.ok) return cleaned;

  try {
    // updateMany, not update: `userId` in the where is what stops one user
    // renaming another's folder by id.
    const { count } = await prisma.collectionFolder.updateMany({
      where: { id: folderId, userId },
      data: { name: cleaned.name },
    });
    if (count === 0) return { ok: false, error: "That folder is gone." };
  } catch {
    return { ok: false, error: `"${cleaned.name}" already exists.` };
  }

  revalidateLibrary();
  return { ok: true };
}

/**
 * Deletes a folder. Its items survive as unfiled — the schema's `SetNull`
 * does that, so deleting a folder never costs the user a title.
 */
export async function deleteFolder(folderId: string): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage collections." };

  const { count } = await prisma.collectionFolder.deleteMany({
    where: { id: folderId, userId },
  });
  if (count === 0) return { ok: false, error: "That folder is gone." };

  revalidateLibrary();
  return { ok: true };
}

/**
 * Files an item into a folder, or unfiles it when `folderId` is null.
 *
 * Both ids come from the browser, so both are checked against `userId`: the
 * item via the update's where clause, the destination folder via an explicit
 * lookup. Without that second check a user could file their own item into
 * someone else's folder.
 */
export async function moveItemToFolder(
  itemId: string,
  folderId: string | null,
): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage collections." };

  if (folderId) {
    const folder = await prisma.collectionFolder.findFirst({
      where: { id: folderId, userId },
      select: { id: true },
    });
    if (!folder) return { ok: false, error: "That folder is gone." };
  }

  const { count } = await prisma.collectionItem.updateMany({
    where: { id: itemId, userId },
    data: { folderId },
  });
  if (count === 0) return { ok: false, error: "That title is no longer saved." };

  revalidateLibrary();
  return { ok: true };
}

/** Drops a title from the collection entirely, from inside the manage UI. */
export async function removeCollectionItem(
  itemId: string,
): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage collections." };

  const { count } = await prisma.collectionItem.deleteMany({
    where: { id: itemId, userId },
  });
  if (count === 0) return { ok: false, error: "That title is no longer saved." };

  revalidateLibrary();
  return { ok: true };
}

// ─────────────────────────── Bulk / settings ───────────────────────────

/** How much is saved, for the settings page. Zeroes when signed out. */
export async function getLibraryCounts(): Promise<{
  favourites: number;
  collected: number;
  folders: number;
  watched: number;
}> {
  const userId = await currentUserId();
  if (!userId)
    return { favourites: 0, collected: 0, folders: 0, watched: 0 };

  const [favourites, collected, folders, watched] = await Promise.all([
    prisma.favourite.count({ where: { userId } }),
    prisma.collectionItem.count({ where: { userId } }),
    prisma.collectionFolder.count({ where: { userId } }),
    prisma.watchedItem.count({ where: { userId } }),
  ]);

  return { favourites, collected, folders, watched };
}

/**
 * Destructive bulk deletes, one per pool, each scoped to the current user.
 *
 * Kept as three separate actions rather than one `clearEverything(kind)` so a
 * bug in the UI can't widen the blast radius — the worst a wrong call can do
 * is clear the wrong *one* of the user's own lists.
 */
export async function clearFavourites(): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in first." };

  await prisma.favourite.deleteMany({ where: { userId } });
  revalidateLibrary();
  return { ok: true };
}

/** Clears saved titles *and* the folders they were filed into. */
export async function clearCollection(): Promise<LibraryResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in first." };

  await prisma.collectionItem.deleteMany({ where: { userId } });
  await prisma.collectionFolder.deleteMany({ where: { userId } });
  revalidateLibrary();
  return { ok: true };
}
