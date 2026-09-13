"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { clearCollection, clearFavourites } from "@/server/library";
import { clearWatchHistory } from "@/server/watch-history";

import { SettingsRow, SettingsSection } from "./settings-shell";

/**
 * The destructive section.
 *
 * Every action here is irreversible and none of it is recoverable from a
 * backup the user controls, so each one is **two-step**: the button arms, then
 * has to be confirmed. That's the whole reason this isn't just three buttons —
 * a mis-click next to "Clear watch history" costs real data.
 *
 * Counts are rendered on the button label rather than in the hint so the
 * confirm step states exactly how much is about to go.
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

  const actions = [
    {
      id: "history",
      label: "Watch history",
      hint: "Everything you've opened or ticked as watched. Clearing this also empties Continue Watching.",
      count: counts.watched,
      noun: counts.watched === 1 ? "entry" : "entries",
      action: clearWatchHistory,
    },
    {
      id: "favourites",
      label: "Favourites",
      hint: "Every title you've hearted.",
      count: counts.favourites,
      noun: counts.favourites === 1 ? "title" : "titles",
      action: clearFavourites,
    },
    {
      id: "collection",
      label: "Collection",
      hint: "Every saved title and every folder you've made. Folders go too — this one isn't the same as deleting a folder from Manage, which keeps its titles.",
      count: counts.collected,
      noun: counts.collected === 1 ? "title" : "titles",
      action: clearCollection,
    },
  ] as const;

  return (
    <SettingsSection
      title="Your data"
      description={
        signedIn
          ? "Stored against your account. Clearing is immediate and can't be undone."
          : "Sign in to see and manage what's stored against your account."
      }
    >
      {actions.map((item) => {
        const isArmed = armed === item.id;
        const empty = item.count === 0;

        return (
          <SettingsRow
            key={item.id}
            label={item.label}
            hint={item.hint}
            control={
              !signedIn || empty ? (
                <span className="text-xs text-white/30">
                  {signedIn ? "Nothing stored" : "—"}
                </span>
              ) : isArmed ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(item.action)}
                  >
                    {pending
                      ? "Clearing…"
                      : `Delete ${item.count} ${item.noun}`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => setArmed(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setArmed(item.id)}
                >
                  Clear {item.count}
                </Button>
              )
            }
          />
        );
      })}
    </SettingsSection>
  );
}
