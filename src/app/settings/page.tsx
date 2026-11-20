import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SignOutConfirm } from "@/features/auth/components/sign-out-confirm";
import { DataSettings, PlaybackSettings } from "@/features/settings";
import { authConfigured } from "@/lib/env";
import { buildMetadata } from "@/lib/metadata";
import { getLibraryCounts } from "@/server/library";
import { getSession } from "@/server/session";

// Personal, so it can't be indexed or shared.
export const metadata = buildMetadata({
  title: "Settings",
  description: "Your account, default player and saved data.",
  path: "/settings",
  noIndex: true,
});

/**
 * Three blocks, top to bottom: who you are, how things play, what's saved.
 * Login is optional, so the page renders in full when signed out.
 */
export default async function SettingsPage() {
  const session = await getSession();
  const user = session?.user ?? null;
  const counts = await getLibraryCounts();
  const canSignIn = authConfigured();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-20 pt-2">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Settings</h1>

      {/* Account */}
      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        {user?.image ? (
          <Image
            src={user.image}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border border-white/[0.12] object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xl font-semibold text-white/80">
            {user ? (user.name ?? user.email ?? "?").charAt(0).toUpperCase() : "?"}
          </span>
        )}

        <div className="min-w-[200px] flex-1 space-y-0.5">
          <h2 className="truncate text-lg font-semibold text-white">
            {user ? (user.name ?? "Signed in") : "You're not signed in"}
          </h2>
          <p className="text-sm text-white/55">
            {user
              ? user.email
              : canSignIn
                ? "Everything plays without an account. Sign in to keep your history, favourites and collection."
                : "Sign-in isn't set up on this site. Everything else still works."}
          </p>
        </div>

        {user ? (
          <SignOutConfirm className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 text-sm font-medium text-foreground transition-colors hover:border-white/20 hover:bg-white/[0.1]">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </SignOutConfirm>
        ) : canSignIn ? (
          <Button asChild>
            <Link href="/api/auth/signin">
              <LogIn aria-hidden /> Sign in
            </Link>
          </Button>
        ) : null}
      </section>

      <PlaybackSettings />
      <DataSettings counts={counts} signedIn={Boolean(user)} />

      <footer className="border-t border-white/[0.06] pt-6 text-xs leading-relaxed text-white/40">
        <p>
          Titles, artwork and credits come from{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Adult content
          is filtered out across the site.
        </p>
      </footer>
    </div>
  );
}
