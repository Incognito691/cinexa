import Link from "next/link";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        <div className="flex flex-wrap items-center gap-4 rounded-stitch-xl border border-white/[0.08] bg-white/[0.03] p-6">
          <p className="text-sm text-white/60">
            {signedIn
              ? "Nothing in progress. Start something and it shows up here."
              : "Your watch history lives with your account."}
          </p>
          <Button asChild>
            <Link href="/explore">
              <Play className="fill-current" aria-hidden />
              Browse titles
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
