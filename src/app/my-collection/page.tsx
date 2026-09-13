import Link from "next/link";
import { Compass, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media/media-card";
import { ManageCollection } from "@/features/library";
import { loadCollectionEntries } from "@/features/library/lib/entries";
import { buildMetadata } from "@/lib/metadata";
import { listCollection } from "@/server/library";
import { isSignedIn } from "@/server/watch-history";
import type { CollectionEntry } from "@/types/media";

// Personal, so it can't be indexed or shared.
export const metadata = buildMetadata({
  title: "My Collection",
  path: "/my-collection",
  noIndex: true,
});

/**
 * The collection: everything saved, grouped by folder.
 *
 * Unfiled comes first because that's where new saves land — burying it under
 * the named folders would hide the titles most likely to need filing.
 */
export default async function MyCollectionPage() {
  const [signedIn, { items, folders }] = await Promise.all([
    isSignedIn(),
    listCollection(),
  ]);
  const entries = await loadCollectionEntries(items);

  const unfiled = entries.filter((entry) => entry.folderId === null);

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My Collection
          </h1>
          <p className="text-sm text-white/50">
            {signedIn
              ? `${entries.length} saved${
                  folders.length ? ` across ${folders.length} folder${folders.length === 1 ? "" : "s"}` : ""
                }.`
              : "Sign in to build a collection."}
          </p>
        </div>
        {signedIn ? (
          <ManageCollection entries={entries} folders={folders} />
        ) : null}
      </header>

      {entries.length === 0 ? (
        <EmptyState signedIn={signedIn} />
      ) : (
        <div className="space-y-10">
          {unfiled.length > 0 ? (
            <FolderSection
              title="Unfiled"
              hint={
                folders.length
                  ? "Use Manage to file these."
                  : "Use Manage to create a folder."
              }
              entries={unfiled}
            />
          ) : null}

          {folders.map((folder) => {
            const inFolder = entries.filter((e) => e.folderId === folder.id);
            return (
              <FolderSection
                key={folder.id}
                title={folder.name}
                // An empty folder still renders — you just made it, and a
                // folder that vanishes until it has contents looks broken.
                hint={inFolder.length === 0 ? "Empty" : undefined}
                entries={inFolder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FolderSection({
  title,
  hint,
  entries,
}: {
  title: string;
  hint?: string;
  entries: CollectionEntry[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Folder className="h-4 w-4 text-white/40" aria-hidden />
          {title}
        </h2>
        <span className="text-xs text-white/35">
          {hint ?? `${entries.length}`}
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {entries.map((entry) => (
            <MediaCard key={entry.id} item={entry.card} layout="grid" />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function EmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-stitch-xl border border-white/[0.08] bg-white/[0.03] p-6">
      <p className="text-sm text-white/60">
        {signedIn
          ? "Nothing saved yet. Use “Add to collection” on any title, then Manage to sort it into folders."
          : "Your collection lives with your account."}
      </p>
      <Button asChild>
        <Link href="/explore">
          <Compass aria-hidden />
          Browse titles
        </Link>
      </Button>
    </div>
  );
}
