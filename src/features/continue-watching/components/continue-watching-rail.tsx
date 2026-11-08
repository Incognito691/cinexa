import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Compass, LogIn, PlayCircle } from "lucide-react";

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { authConfigured, tmdbImage } from "@/lib/env";
import { fetchTrending } from "@/server/tmdb";
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
        <Prompt
          title="Never lose your place"
          text="Sign in and every movie and episode you start is saved at the exact second you stopped, on any device."
        >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit">
              <LogIn aria-hidden /> Sign in to start
            </Button>
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
        <Prompt
          title="Nothing in progress yet"
          text="Press play on anything and it lands here with your progress."
        >
          <Button asChild>
            <Link href="/explore">
              <Compass aria-hidden /> Browse titles
            </Link>
          </Button>
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

/** Made-up progress for the preview cards. */
const SAMPLE_PROGRESS = [68, 32, 85];

/**
 * The empty rail: a pitch on the left, and on the right three sample cards
 * (this week's trending backdrops with progress bars) previewing what the
 * rail turns into. Trending is already content-filtered and cached, and the
 * home page fetches it anyway.
 */
async function Prompt({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  const samples = await fetchTrending({ type: "movie" }).then(
    (r) => r.items.filter((i) => i.backdropPath).slice(0, SAMPLE_PROGRESS.length),
    () => [],
  );

  return (
    <div
      className="grid items-center gap-8 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0b0b0b] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgb(229 9 20 / 0.14), transparent 45%), radial-gradient(circle at 0% 100%, hsl(var(--brand-from) / 0.12), transparent 40%)",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-fuchsia-500/25">
          <PlayCircle className="h-6 w-6 text-white" aria-hidden />
        </span>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
            <p className="max-w-md text-sm leading-relaxed text-white/60">{text}</p>
          </div>
          {children}
        </div>
      </div>

      {samples.length === SAMPLE_PROGRESS.length ? (
        <div aria-hidden className="hidden gap-4 lg:flex">
          {samples.map((item, i) => (
            <div
              key={item.id}
              className="relative h-28 w-48 overflow-hidden rounded-xl border border-white/10 opacity-70 xl:w-52"
            >
              <Image
                src={tmdbImage(item.backdropPath, "w300")!}
                alt=""
                fill
                sizes="208px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <p className="absolute inset-x-3 bottom-5 truncate text-xs font-medium text-white/90">
                {item.title}
              </p>
              <div className="absolute inset-x-3 bottom-2.5 h-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${SAMPLE_PROGRESS[i]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
