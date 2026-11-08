import { PlayCircle } from "lucide-react";

import { LibraryEmptyState } from "@/components/library-empty-state";
import { ContinueCard } from "@/features/continue-watching";
import { loadContinueCards } from "@/features/continue-watching/lib/entries";
import { buildMetadata } from "@/lib/metadata";
import { isSignedIn } from "@/server/watch-history";

// Personal, so it can't be indexed or shared.
export const metadata = buildMetadata({
  title: "Continue Watching",
  path: "/continue-watching",
  noIndex: true,
});

/** Everything still in progress — the "View All" behind the home rail. */
export default async function ContinueWatchingPage() {
  const signedIn = await isSignedIn();
  const cards = signedIn ? await loadContinueCards(40) : [];

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-8 pb-16 pt-2">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Continue Watching
        </h1>
        <p className="text-sm text-white/50">
          {signedIn
            ? "Everything you've started, newest first."
            : "Sign in to keep your place across devices."}
        </p>
      </header>

      {cards.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <ContinueCard key={card.key} card={card} />
          ))}
        </div>
      ) : (
        <LibraryEmptyState
          icon={PlayCircle}
          signedIn={signedIn}
          path="/continue-watching"
          posterOffset={3}
          title={signedIn ? "Nothing in progress" : "Pick up right where you left off"}
          body={
            signedIn
              ? "Start a movie or an episode and it shows up here with your progress."
              : "Sign in and every movie and episode you start is saved at the exact second you stopped."
          }
        />
      )}
    </div>
  );
}
