"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";

import { TrailerDialog } from "@/features/title/components/trailer-dialog";
import { releaseLabel } from "@/lib/release";

/**
 * Stands in for the player while a film is only in cinemas: no source has a
 * copy yet, so every server would just show its own "not found". "Try
 * anyway" reveals the player, for when TMDB is missing the digital date.
 */
export function CinemaGate({
  title,
  digital,
  trailerKey,
  frameWidth,
  children,
}: {
  title: string;
  digital: string | null;
  trailerKey?: string;
  frameWidth: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (open) return <>{children}</>;

  const streaming = releaseLabel(digital);
  return (
    <div className={`mx-auto w-full ${frameWidth}`}>
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_40%,rgba(229,9,20,0.14),transparent_60%)] bg-black">
        <div className="max-w-md space-y-4 px-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            <Ticket className="h-6 w-6 text-white/80" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-white">In cinemas now</h2>
            <p className="text-sm leading-relaxed text-white/60">
              {title} is only showing in cinemas, so it isn&apos;t streaming anywhere yet.
              {streaming ? ` It's expected on digital from ${streaming}.` : " Check back once it's out on digital."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {trailerKey ? <TrailerDialog youtubeKey={trailerKey} title={title} /> : null}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-sm text-white/50 underline-offset-4 transition hover:text-white hover:underline"
            >
              Try the players anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
