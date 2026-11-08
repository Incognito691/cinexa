import Image from "next/image";
import Link from "next/link";
import { Compass, LogIn, Shuffle, type LucideIcon } from "lucide-react";

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { authConfigured, tmdbImage } from "@/lib/env";
import { fetchTrending } from "@/server/tmdb";

interface LibraryEmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  signedIn: boolean;
  /** Where sign-in returns to. */
  path: string;
  /** Which trending posters to fan out, so the three pages don't look identical. */
  posterOffset?: number;
}

/** The fan of posters: left, centre (on top), right. */
const FAN = [
  "-translate-x-[70%] -rotate-12 scale-90",
  "z-10",
  "translate-x-[70%] rotate-12 scale-90",
];

/**
 * Empty state shared by Favourites, Continue Watching and My Collection.
 *
 * Signed out it leads with sign-in; signed in it points back at browsing.
 * The posters are this week's trending titles, so they've already been
 * through the content filter and the request is the same cached one the
 * home page makes.
 */
export async function LibraryEmptyState({
  icon: Icon,
  title,
  body,
  signedIn,
  path,
  posterOffset = 0,
}: LibraryEmptyStateProps) {
  const posters = await fetchTrending({ type: "movie" }).then(
    (r) => r.items.filter((i) => i.posterPath).slice(posterOffset, posterOffset + 3),
    () => [],
  );
  const canSignIn = !signedIn && authConfigured();

  return (
    <section
      className="relative grid min-h-[440px] items-center gap-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0b0b] p-8 sm:p-12 md:grid-cols-[1.1fr_1fr]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 85% 30%, rgb(229 9 20 / 0.16), transparent 50%), radial-gradient(circle at 0% 100%, hsl(var(--brand-from) / 0.14), transparent 45%)",
      }}
    >
      <div className="relative z-10 space-y-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-fuchsia-500/25">
          <Icon className="h-7 w-7 text-white" aria-hidden />
        </span>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="max-w-md text-base leading-relaxed text-white/60">{body}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canSignIn ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: path });
              }}
            >
              <Button type="submit" size="lg">
                <LogIn aria-hidden /> Sign in
              </Button>
            </form>
          ) : (
            <Button asChild size="lg">
              <Link href="/explore">
                <Compass aria-hidden /> Browse titles
              </Link>
            </Button>
          )}
          <Button asChild size="lg" variant="secondary">
            {canSignIn ? (
              <Link href="/explore">
                <Compass aria-hidden /> Browse titles
              </Link>
            ) : (
              <Link href="/surprise">
                <Shuffle aria-hidden /> Surprise me
              </Link>
            )}
          </Button>
        </div>
      </div>

      {posters.length === 3 ? (
        <div aria-hidden className="relative hidden h-80 items-center justify-center md:flex">
          {posters.map((p, i) => (
            <div
              key={p.id}
              className={`absolute aspect-[2/3] w-44 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/70 lg:w-48 ${FAN[i]}`}
            >
              <Image
                src={tmdbImage(p.posterPath, "w342")!}
                alt=""
                fill
                sizes="192px"
                className="object-cover"
              />
              {i !== 1 ? <div className="absolute inset-0 bg-black/40" /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
