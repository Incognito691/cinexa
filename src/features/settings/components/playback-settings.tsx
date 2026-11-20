"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { usePersistedString } from "@/hooks/use-persisted-string";
import {
  DEFAULT_SOURCE_ID,
  SOURCES,
  SOURCE_IDS,
  SOURCE_PREFERENCE_KEY,
} from "@/features/watch/lib/sources";
import { cn } from "@/lib/utils";

// Anime-only sources can't be the site-wide default; anime picks its own.
const OPTIONS = SOURCES.filter((s) => !s.animeOnly);

/** One plain line per source; the player's own hint is longer and more technical. */
const BLURB: Record<string, { text: string; resume: boolean }> = {
  vidlink: { text: "Remembers where you stopped and shows your progress.", resume: true },
  superembed: { text: "Has its own menu of servers inside the player.", resume: false },
  vidsrc: { text: "A backup for when the other two won't start.", resume: false },
};

/**
 * Which source a player opens on, as three selectable cards.
 *
 * Stored in localStorage rather than the database on purpose: it's a
 * device-level preference (the source that isn't blocked on *this* network)
 * and login is optional, so tying it to an account would make it unavailable
 * to most visitors.
 *
 * Radio inputs rather than buttons: arrow keys move between the cards and
 * the group announces itself as one choice. Nothing is marked selected until
 * mounted, because the saved choice isn't known on the server.
 */
export function PlaybackSettings() {
  const [preferred, setPreferred] = usePersistedString(
    SOURCE_PREFERENCE_KEY,
    DEFAULT_SOURCE_ID,
    SOURCE_IDS,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Default player</h2>
        <p className="text-sm text-white/50">
          Which source a movie or episode opens with. Saved on this device; you can still switch
          under any player.
        </p>
      </div>

      <div role="radiogroup" aria-label="Default player" className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((source) => {
          const active = mounted && source.id === preferred;
          const blurb = BLURB[source.id] ?? { text: source.hint, resume: false };
          return (
            <label
              key={source.id}
              className={cn(
                "relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors",
                "focus-within:ring-2 focus-within:ring-white/30",
                active
                  ? "border-primary bg-white/[0.03]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <input
                type="radio"
                name="default-source"
                value={source.id}
                checked={active}
                onChange={() => setPreferred(source.id)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{source.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary bg-primary text-white" : "border-white/20",
                  )}
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </span>
              </span>
              <span className="text-xs leading-relaxed text-white/55">{blurb.text}</span>
              <span
                className={cn(
                  "mt-auto w-fit rounded-md px-2 py-0.5 text-[11px] font-medium",
                  blurb.resume ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.06] text-white/45",
                )}
              >
                {blurb.resume ? "Resumes where you left off" : "No resume"}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
