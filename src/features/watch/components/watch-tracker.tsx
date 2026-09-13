"use client";

import { useEffect, useRef } from "react";

import { markWatched } from "@/server/watch-history";

import { SOURCES, type PlaybackTarget } from "../lib/sources";

/** How long on the page before a title counts as watched, with no position. */
export const AUTO_MARK_MS = 45_000;

/** How often a moving position is written back. */
const FLUSH_MS = 15_000;

/** Don't write for a jitter — only for a real move. */
const MIN_DELTA_SECONDS = 5;

/** Origins whose player events we accept. Everything else is ignored. */
const TRUSTED_ORIGINS = new Set(
  SOURCES.map((s) => s.progressOrigin).filter(Boolean) as string[],
);

type Position = { positionSeconds: number; runtimeSeconds: number };

/**
 * Records playback position while the watch page is open.
 *
 * The player is a cross-origin iframe, so the only progress that exists is what
 * the provider chooses to `postMessage` out. VidLink emits
 * `{ type: "PLAYER_EVENT", data: { currentTime, duration, … } }`; SuperEmbed and
 * VidSrc emit nothing at all, which is why they fall back to the dwell timer
 * below and produce a rail card with no progress bar rather than nothing.
 *
 * Writes go to `/api/watch/progress` on a timer and again on `pagehide`, where
 * `sendBeacon` is the only thing that reliably outlives the navigation. Renders
 * nothing.
 */
export function WatchTracker({
  target,
  signedIn,
  /** TV runs its own dwell timer in `EpisodeNav`, which also drives the tick. */
  dwellFallback = true,
}: {
  target: PlaybackTarget;
  signedIn: boolean;
  dwellFallback?: boolean;
}) {
  const { tmdbId, mediaType, season, episode } = target;

  // Refs, not state: these change several times a second during playback and
  // nothing here renders.
  const latest = useRef<Position | null>(null);
  const lastSent = useRef(0);
  const sawPlayerEvent = useRef(false);

  useEffect(() => {
    if (!signedIn) return;

    // A new episode is a new row — don't carry the old one's position over.
    latest.current = null;
    lastSent.current = 0;
    sawPlayerEvent.current = false;

    const body = (p: Position) =>
      JSON.stringify({ tmdbId, mediaType, season, episode, ...p });

    const flush = (beacon: boolean) => {
      const current = latest.current;
      if (!current) return;
      if (Math.abs(current.positionSeconds - lastSent.current) < MIN_DELTA_SECONDS) {
        return;
      }
      lastSent.current = current.positionSeconds;

      const payload = body(current);
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/watch/progress",
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }
      void fetch("/api/watch/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // A dropped progress write is not worth surfacing — the next tick
        // sends the same position again.
      });
    };

    const onMessage = (event: MessageEvent) => {
      if (!TRUSTED_ORIGINS.has(event.origin)) return;

      const data = event.data as
        | { type?: string; data?: { currentTime?: number; duration?: number } }
        | undefined;
      if (data?.type !== "PLAYER_EVENT") return;

      const currentTime = Number(data.data?.currentTime);
      const duration = Number(data.data?.duration);
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return;
      if (duration <= 0) return;

      sawPlayerEvent.current = true;
      latest.current = {
        positionSeconds: Math.floor(currentTime),
        runtimeSeconds: Math.floor(duration),
      };
    };

    // Only fires for providers that report nothing: without it a SuperEmbed
    // session would never appear in Continue Watching at all.
    const dwell = dwellFallback
      ? setTimeout(() => {
          if (sawPlayerEvent.current) return;
          void markWatched({ tmdbId, mediaType, season, episode });
        }, AUTO_MARK_MS)
      : undefined;

    const timer = setInterval(() => flush(false), FLUSH_MS);
    const onHide = () => flush(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };

    window.addEventListener("message", onMessage);
    // `pagehide` rather than `beforeunload`: it also covers the bfcache and
    // mobile tab-switching, where `beforeunload` never runs.
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      flush(true);
      clearInterval(timer);
      if (dwell) clearTimeout(dwell);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [signedIn, tmdbId, mediaType, season, episode, dwellFallback]);

  return null;
}
