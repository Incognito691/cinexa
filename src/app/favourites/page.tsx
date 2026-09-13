import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media/media-card";
import { loadSavedCards } from "@/features/library/lib/entries";
import { buildMetadata } from "@/lib/metadata";
import { listFavourites } from "@/server/library";
import { isSignedIn } from "@/server/watch-history";

// Personal, so it can't be indexed or shared.
export const metadata = buildMetadata({
  title: "Favourites",
  path: "/favourites",
  noIndex: true,
});

/** Everything hearted, newest first. */
export default async function FavouritesPage() {
  const [signedIn, rows] = await Promise.all([
    isSignedIn(),
    listFavourites(),
  ]);
  const cards = await loadSavedCards(rows);

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Favourites
        </h1>
        <p className="text-sm text-white/50">
          {signedIn
            ? "Everything you've hearted, newest first."
            : "Sign in to keep your favourites across devices."}
        </p>
      </header>

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => (
            <MediaCard
              key={`${card.mediaType}:${card.id}`}
              item={card}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <EmptyState signedIn={signedIn} />
      )}
    </div>
  );
}

function EmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-stitch-xl border border-white/[0.08] bg-white/[0.03] p-6">
      <p className="text-sm text-white/60">
        {signedIn
          ? "Nothing hearted yet. Tap the heart on any poster and it lands here."
          : "Your favourites live with your account."}
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
