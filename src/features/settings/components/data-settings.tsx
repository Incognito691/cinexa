"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Folder, Heart, History, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearCollection, clearFavourites } from "@/server/library";
import { clearWatchHistory } from "@/server/watch-history";

/**
 * What's stored against the account, as three tiles: a count and a way to
 * clear it.
 *
 * Clearing is irreversible, so each one is **two-step**: the button arms,
 * then has to be confirmed, and the confirm button states exactly how much is
 * about to go. A mis-click next to "Clear" would otherwise cost real data.
 */

interface DataSettingsProps {
  counts: {
    favourites: number;
    collected: number;
    folders: number;
    watched: number;
  };
  signedIn: boolean;
}

export function DataSettings({ counts, signedIn }: DataSettingsProps) {
  const router = useRouter();
  const [armed, setArmed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<unknown>) =>
    startTransition(async () => {
      await action();
      setArmed(null);
      router.refresh();
    });

  const tiles: {
    id: string;
    label: string;
    hint: string;
    count: number;
    Icon: LucideIcon;
    action: () => Promise<unknown>;
  }[] = [
    {
      id: "history",
      label: "Watch history",
      hint: "Clearing also empties Continue Watching.",
      count: counts.watched,
      Icon: History,
      action: clearWatchHistory,
    },
    {
      id: "favourites",
      label: "Favourites",
      hint: "Every title you've hearted.",
      count: counts.favourites,
      Icon: Heart,
      action: clearFavourites,
    },
    {
      id: "collection",
      label: "Collection",
      hint: "Saved titles and all your folders.",
      count: counts.collected,
      Icon: Folder,
      action: clearCollection,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Your data</h2>
        <p className="text-sm text-white/50">
          {signedIn
            ? "Saved with your account. Clearing is immediate and can't be undone."
            : "Sign in to save your history, favourites and collection."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map(({ id, label, hint, count, Icon, action }) => {
          const isArmed = armed === id;
          return (
            <div
              key={id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/70">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-3xl font-bold tabular-nums tracking-tight text-white">
                  {signedIn ? count.toLocaleString() : "–"}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs leading-relaxed text-white/50">{hint}</p>
              </div>

              <div className="mt-auto flex min-h-9 items-center gap-2">
                {!signedIn || count === 0 ? (
                  <span className="text-xs text-white/35">
                    {signedIn ? "Nothing saved yet" : "Not signed in"}
                  </span>
                ) : isArmed ? (
                  <>
                    <Button variant="destructive" size="sm" disabled={pending} onClick={() => run(action)}>
                      {pending ? "Clearing…" : `Delete all ${count.toLocaleString()}`}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => setArmed(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setArmed(id)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
