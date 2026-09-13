import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Library server-layer tests.
 *
 * These mock Prisma rather than talking to Postgres, because the property
 * worth pinning here isn't "does the database work" — it's **what goes in the
 * WHERE clause**. Folder and item ids arrive from the browser, so a mutation
 * that forgets `userId` lets any signed-in user edit another user's
 * collection by guessing a cuid. That's invisible in manual testing (you only
 * ever have one account open) and a mocked client catches it exactly.
 */

const prismaMock = vi.hoisted(() => ({
  favourite: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  collectionItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  collectionFolder: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

const sessionMock = vi.hoisted(() => ({ currentUserId: vi.fn() }));

vi.mock("@/server/db", () => ({ prisma: prismaMock }));
vi.mock("@/server/session", () => sessionMock);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const {
  createFolder,
  deleteFolder,
  getLibraryKeys,
  moveItemToFolder,
  removeCollectionItem,
  renameFolder,
  toggleCollected,
  toggleFavourite,
} = await import("./library");

const USER = "user_me";
const OTHER_FOLDER = "folder_theirs";

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.currentUserId.mockResolvedValue(USER);
});

describe("ownership scoping", () => {
  it("scopes a folder rename to the signed-in user", async () => {
    prismaMock.collectionFolder.updateMany.mockResolvedValue({ count: 1 });

    await renameFolder("folder_1", "Rewatch");

    const { where } = prismaMock.collectionFolder.updateMany.mock.calls[0][0];
    expect(where).toEqual({ id: "folder_1", userId: USER });
  });

  it("scopes a folder delete to the signed-in user", async () => {
    prismaMock.collectionFolder.deleteMany.mockResolvedValue({ count: 1 });

    await deleteFolder("folder_1");

    const { where } = prismaMock.collectionFolder.deleteMany.mock.calls[0][0];
    expect(where).toEqual({ id: "folder_1", userId: USER });
  });

  it("scopes an item removal to the signed-in user", async () => {
    prismaMock.collectionItem.deleteMany.mockResolvedValue({ count: 1 });

    await removeCollectionItem("item_1");

    const { where } = prismaMock.collectionItem.deleteMany.mock.calls[0][0];
    expect(where).toEqual({ id: "item_1", userId: USER });
  });

  it("refuses to file an item into a folder the user does not own", async () => {
    // findFirst is the ownership check; null means "not yours (or gone)".
    prismaMock.collectionFolder.findFirst.mockResolvedValue(null);

    const result = await moveItemToFolder("item_1", OTHER_FOLDER);

    expect(result).toEqual({ ok: false, error: "That folder is gone." });
    expect(prismaMock.collectionItem.updateMany).not.toHaveBeenCalled();
  });

  it("checks both ids when filing into an owned folder", async () => {
    prismaMock.collectionFolder.findFirst.mockResolvedValue({ id: "folder_1" });
    prismaMock.collectionItem.updateMany.mockResolvedValue({ count: 1 });

    const result = await moveItemToFolder("item_1", "folder_1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.collectionFolder.findFirst.mock.calls[0][0].where).toEqual(
      { id: "folder_1", userId: USER },
    );
    expect(prismaMock.collectionItem.updateMany.mock.calls[0][0].where).toEqual(
      { id: "item_1", userId: USER },
    );
  });

  it("skips the folder lookup when unfiling", async () => {
    prismaMock.collectionItem.updateMany.mockResolvedValue({ count: 1 });

    await moveItemToFolder("item_1", null);

    expect(prismaMock.collectionFolder.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.collectionItem.updateMany.mock.calls[0][0].data).toEqual({
      folderId: null,
    });
  });

  it("reports not-found when a scoped write matches nothing", async () => {
    prismaMock.collectionFolder.updateMany.mockResolvedValue({ count: 0 });

    expect(await renameFolder("folder_theirs", "Mine now")).toEqual({
      ok: false,
      error: "That folder is gone.",
    });
  });
});

describe("signed out", () => {
  beforeEach(() => sessionMock.currentUserId.mockResolvedValue(null));

  it("returns empty keys and says so, without querying", async () => {
    expect(await getLibraryKeys()).toEqual({
      favourites: [],
      collected: [],
      signedIn: false,
    });
    expect(prismaMock.favourite.findMany).not.toHaveBeenCalled();
  });

  it("no-ops a favourite toggle rather than throwing", async () => {
    expect(await toggleFavourite({ tmdbId: 1, mediaType: "movie" })).toBe(false);
    expect(prismaMock.favourite.create).not.toHaveBeenCalled();
  });

  it("refuses folder writes with a message, not a crash", async () => {
    expect(await createFolder("Anything")).toEqual({
      ok: false,
      error: "Sign in to manage collections.",
    });
    expect(prismaMock.collectionFolder.create).not.toHaveBeenCalled();
  });
});

describe("folder names", () => {
  it("rejects a whitespace-only name", async () => {
    expect(await createFolder("   ")).toEqual({
      ok: false,
      error: "Give the folder a name.",
    });
    expect(prismaMock.collectionFolder.create).not.toHaveBeenCalled();
  });

  it("rejects a name past the length cap", async () => {
    const result = await createFolder("x".repeat(61));
    expect(result.ok).toBe(false);
    expect(prismaMock.collectionFolder.create).not.toHaveBeenCalled();
  });

  it("trims before storing", async () => {
    prismaMock.collectionFolder.create.mockResolvedValue({ id: "f" });

    await createFolder("  Weekend  ");

    expect(prismaMock.collectionFolder.create.mock.calls[0][0].data).toEqual({
      userId: USER,
      name: "Weekend",
    });
  });

  it("turns a duplicate-name constraint violation into a readable error", async () => {
    prismaMock.collectionFolder.create.mockRejectedValue(
      new Error("Unique constraint failed"),
    );

    expect(await createFolder("Weekend")).toEqual({
      ok: false,
      error: '"Weekend" already exists.',
    });
  });
});

describe("toggles", () => {
  it("adds a favourite that is not saved yet", async () => {
    prismaMock.favourite.findUnique.mockResolvedValue(null);
    prismaMock.favourite.create.mockResolvedValue({ id: "f" });

    expect(await toggleFavourite({ tmdbId: 42, mediaType: "tv" })).toBe(true);
    expect(prismaMock.favourite.create.mock.calls[0][0].data).toEqual({
      userId: USER,
      tmdbId: 42,
      mediaType: "tv",
    });
  });

  it("removes a favourite that is already saved", async () => {
    prismaMock.favourite.findUnique.mockResolvedValue({ id: "fav_1" });
    prismaMock.favourite.delete.mockResolvedValue({ id: "fav_1" });

    expect(await toggleFavourite({ tmdbId: 42, mediaType: "tv" })).toBe(false);
    expect(prismaMock.favourite.delete).toHaveBeenCalledWith({
      where: { id: "fav_1" },
    });
  });

  it("keeps favourites and collections independent", async () => {
    prismaMock.collectionItem.findUnique.mockResolvedValue(null);
    prismaMock.collectionItem.create.mockResolvedValue({ id: "c" });

    await toggleCollected({ tmdbId: 42, mediaType: "tv" });

    expect(prismaMock.collectionItem.create).toHaveBeenCalled();
    expect(prismaMock.favourite.create).not.toHaveBeenCalled();
  });
});

describe("key shape", () => {
  it("emits mediaType:tmdbId keys the client can look up", async () => {
    prismaMock.favourite.findMany.mockResolvedValue([
      { tmdbId: 1, mediaType: "movie" },
    ]);
    prismaMock.collectionItem.findMany.mockResolvedValue([
      { tmdbId: 2, mediaType: "tv" },
    ]);

    expect(await getLibraryKeys()).toEqual({
      favourites: ["movie:1"],
      collected: ["tv:2"],
      signedIn: true,
    });
  });
});
