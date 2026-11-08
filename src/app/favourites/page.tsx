import { Heart } from "lucide-react";

import { LibraryEmptyState } from "@/components/library-empty-state";
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
        <LibraryEmptyState
          icon={Heart}
          signedIn={signedIn}
          path="/favourites"
          title={signedIn ? "No favourites yet" : "Keep the ones you love"}
          body={
            signedIn
              ? "Tap the heart on any poster and it lands here."
              : "Sign in to heart any movie or show and find it here on every device."
          }
        />
      )}
    </div>
  );
}

