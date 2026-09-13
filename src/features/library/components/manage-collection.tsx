"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, FolderPlus, Pencil, Settings2, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createFolder,
  deleteFolder,
  moveItemToFolder,
  removeCollectionItem,
  renameFolder,
} from "@/server/library";
import type {
  CollectionEntry,
  CollectionFolderRow,
  LibraryResult,
} from "@/types/media";

/**
 * The "Manage" dialog behind /my-collection: create, rename and delete
 * folders, and file each saved title into one.
 *
 * Filing uses a `<select>` rather than drag-and-drop deliberately. It does
 * everything dragging would — move between folders, unfile — with no new
 * dependency, and it's the only version that works with a keyboard or on a
 * phone without extra code.
 *
 * There's no local mirror of the collection: every action calls a server
 * action and then `router.refresh()`, so the dialog always shows what the
 * database actually holds. That costs a round trip per edit, which is fine for
 * a modal the user opens occasionally — unlike the heart, which is optimistic
 * because it's clicked mid-browse.
 */

interface ManageCollectionProps {
  entries: CollectionEntry[];
  folders: CollectionFolderRow[];
}

export function ManageCollection({ entries, folders }: ManageCollectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  /** Runs a server action, surfaces its error, and re-reads on success. */
  const run = (action: () => Promise<LibraryResult>, onDone?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone?.();
      router.refresh();
    });

  const startRename = (folder: CollectionFolderRow) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
    setError(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 text-sm font-medium text-white/85 transition hover:bg-white/[0.1] hover:text-white"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          Manage
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(46rem,calc(100vw-2rem))]",
            "-translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
            "rounded-stitch-xl border border-white/[0.1] bg-surface-container-low shadow-2xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Manage collection
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-white/50">
                Create folders and file your saved titles into them.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          {error ? (
            <p
              role="alert"
              className="border-b border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm text-rose-300"
            >
              {error}
            </p>
          ) : null}

          <div
            className={cn(
              "flex-1 space-y-7 overflow-y-auto p-5",
              pending && "pointer-events-none opacity-60",
            )}
          >
            {/* ── Folders ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Folders
              </h3>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run(() => createFolder(newName), () => setNewName(""));
                }}
                className="flex gap-2"
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New folder name"
                  maxLength={60}
                  className="h-10 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || pending}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  Create
                </button>
              </form>

              {folders.length === 0 ? (
                <p className="text-sm text-white/40">
                  No folders yet. Everything sits in Unfiled until you make one.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {folders.map((folder) => (
                    <li
                      key={folder.id}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                    >
                      {editingId === folder.id ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            run(
                              () => renameFolder(folder.id, editingName),
                              () => setEditingId(null),
                            );
                          }}
                          className="flex flex-1 items-center gap-2"
                        >
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={60}
                            onKeyDown={(e) =>
                              e.key === "Escape" && setEditingId(null)
                            }
                            className="h-8 flex-1 rounded-lg border border-white/20 bg-white/[0.06] px-2 text-sm text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            aria-label="Save name"
                            className="rounded-lg p-1.5 text-emerald-300 transition hover:bg-emerald-500/15"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel rename"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/[0.08]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 truncate text-sm text-white/90">
                            {folder.name}
                          </span>
                          <span className="shrink-0 text-xs text-white/40">
                            {folder.itemCount}
                          </span>
                          <button
                            type="button"
                            aria-label={`Rename ${folder.name}`}
                            onClick={() => startRename(folder)}
                            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            // No confirm step: the schema un-files the folder's
                            // items rather than deleting them, so the worst
                            // case is re-creating a name.
                            aria-label={`Delete ${folder.name}`}
                            onClick={() => run(() => deleteFolder(folder.id))}
                            className="rounded-lg p-1.5 text-white/50 transition hover:bg-rose-500/15 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {folders.length > 0 ? (
                <p className="text-xs text-white/35">
                  Deleting a folder keeps its titles — they move back to Unfiled.
                </p>
              ) : null}
            </section>

            {/* ── Titles ──────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Saved titles
              </h3>

              {entries.length === 0 ? (
                <p className="text-sm text-white/40">
                  Nothing saved yet. Use “Add to collection” on any title.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white/90">
                          {entry.card.title}
                        </span>
                        <span className="text-xs text-white/40">
                          {entry.card.mediaType === "tv" ? "Series" : "Movie"}
                        </span>
                      </span>

                      <label className="sr-only" htmlFor={`folder-${entry.id}`}>
                        Folder for {entry.card.title}
                      </label>
                      <select
                        id={`folder-${entry.id}`}
                        value={entry.folderId ?? ""}
                        onChange={(e) =>
                          run(() =>
                            moveItemToFolder(entry.id, e.target.value || null),
                          )
                        }
                        className="h-9 shrink-0 rounded-lg border border-white/[0.12] bg-surface-container-low px-2 text-sm text-white/85 focus:border-white/30 focus:outline-none"
                      >
                        <option value="">Unfiled</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        aria-label={`Remove ${entry.card.title} from collection`}
                        onClick={() => run(() => removeCollectionItem(entry.id))}
                        className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:bg-rose-500/15 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
