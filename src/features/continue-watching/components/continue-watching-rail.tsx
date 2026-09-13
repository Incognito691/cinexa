import Link from "next/link";
import { ChevronRight, LogIn, Play } from "lucide-react";

import { signIn } from "@/auth";
import { authConfigured } from "@/lib/env";
import { isSignedIn } from "@/server/watch-history";

import { loadContinueCards } from "../lib/entries";
import { ContinueCard } from "./continue-card";

/** Rail shows this many; the rest live behind "View All". */
const RAIL_LIMIT = 8;

/**
 * "Continue Watching" — the user's own history, newest first.
 *
 * A server component: the session and the history rows are both server-side,
 * so a client fetch would only add a round trip and a loading state. Three
 * states, all of which render *something*, because an empty rail on the home
 * page reads as a broken section rather than an unused feature:
 *
 *   signed out → a sign-in button (hidden entirely when OAuth isn't configured)
 *   no history → a nudge to go watch something
 *   otherwise  → cards with real positions
 */
export async function ContinueWatchingRail() {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    if (!authConfigured()) return null;
    return (
      <Shell>
        <Prompt text="Sign in and everything you play shows up here.">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </button>
          </form>
        </Prompt>
      </Shell>
    );
  }

  // One extra tells us whether "View All" has anything more to show.
  const cards = await loadContinueCards(RAIL_LIMIT + 1);

  if (cards.length === 0) {
    return (
      <Shell>
        <Prompt text="Nothing watched yet — press play on something and it lands here.">
          <Link
            href="/explore"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden />
            Browse titles
          </Link>
        </Prompt>
      </Shell>
    );
  }

  return (
    <Shell seeAll={cards.length > RAIL_LIMIT}>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth -mt-3 pb-3 pt-3 scrollbar-hide">
        {cards.slice(0, RAIL_LIMIT).map((card) => (
          <ContinueCard
            key={card.key}
            card={card}
            className="w-[300px] shrink-0 snap-start sm:w-[340px]"
          />
        ))}
      </div>
    </Shell>
  );
}

function Shell({
  seeAll,
  children,
}: {
  seeAll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Continue Watching
          </h2>
          <p className="text-sm text-white/50">Pick up where you left off.</p>
        </div>
        {seeAll ? (
          <Link
            href="/continue-watching"
            className="group/link inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5" />
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Prompt({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-stitch-xl border border-white/[0.08] bg-white/[0.03] p-6">
      <p className="text-sm text-white/60">{text}</p>
      {children}
    </div>
  );
}
