"use client";

import { useEffect, useState } from "react";

/**
 * When an episode airs, in the viewer's own timezone, with a countdown:
 *
 *   mode "time": "Sat, Nov 14, 9:30 PM · in 5d 23h"  (exact air time known)
 *   mode "date": "Sat, Nov 14 · in 6 days"           (TMDB only has the day)
 *
 * Client-side because the server doesn't know the viewer's timezone and the
 * pages are cached, so a server-rendered countdown would be wrong or stale.
 * Renders a blank until mounted to avoid a hydration mismatch.
 */
export function AiringTime({ at, mode = "time" }: { at: number; mode?: "time" | "date" }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(at * 1000);
    const mins = Math.max(0, Math.round((date.getTime() - Date.now()) / 60_000));

    if (mode === "date") {
      // A UTC calendar day: format it as that day, not shifted by timezone.
      const when = date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      const days = Math.ceil(mins / 1440);
      const left = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      setText(`${when} · ${left}`);
      return;
    }

    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    const left = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
    const when = date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setText(`${when} · in ${left}`);
  }, [at, mode]);

  return <span suppressHydrationWarning>{text ?? " "}</span>;
}
