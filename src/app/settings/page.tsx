import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";

import { auth } from "@/auth";
import {
  DataSettings,
  PlaybackSettings,
  SettingsRow,
  SettingsSection,
  SettingsValue,
} from "@/features/settings";
import { authConfigured } from "@/lib/env";
import { buildMetadata } from "@/lib/metadata";
import { getLibraryCounts } from "@/server/library";

// Personal, so it can't be indexed or shared.
export const metadata = buildMetadata({
  title: "Settings",
  description:
    "Playback source and the data stored against your account.",
  path: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  // Login is optional, so this page renders in full when signed out — the
  // playback section is device-level and works either way.
  const session = await auth().catch(() => null);
  const user = session?.user ?? null;
  const counts = await getLibraryCounts();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-20 pt-2">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-white/50">
          Playback preferences are saved in this browser. Everything under Your
          data lives with your account.
        </p>
      </header>

      <SettingsSection title="Account">
        {user ? (
          <>
            <SettingsRow
              label={user.name ?? "Signed in"}
              hint={user.email ?? undefined}
              control={
                user.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-white/[0.12] object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white/80">
                    {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                )
              }
            />
            <SettingsRow
              label="Sign out"
              hint="Ends this session everywhere it's active. Your saved titles stay."
              control={
                <Link
                  href="/api/auth/signout"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </Link>
              }
            />
          </>
        ) : (
          <SettingsRow
            label="Not signed in"
            hint={
              authConfigured()
                ? "Browsing and playback work without an account. Signing in adds watch history, favourites and collections."
                : "Sign-in isn't configured on this deployment. Everything else still works."
            }
            control={
              authConfigured() ? (
                <Link
                  href="/api/auth/signin"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden />
                  Sign in
                </Link>
              ) : (
                <SettingsValue>Unavailable</SettingsValue>
              )
            }
          />
        )}
      </SettingsSection>

      <PlaybackSettings />
      <DataSettings counts={counts} signedIn={Boolean(user)} />

      <SettingsSection title="About">
        <SettingsRow
          label="Content filtering"
          hint="Every list and detail page runs a moderation pipeline before it renders. Blocked titles 404 on their detail URL rather than being hidden from lists only."
          control={<SettingsValue>Always on</SettingsValue>}
        />
        <SettingsRow
          label="Metadata"
          hint="Titles, artwork and credits come from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB."
          control={
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              TMDB
            </a>
          }
        />
      </SettingsSection>
    </div>
  );
}
