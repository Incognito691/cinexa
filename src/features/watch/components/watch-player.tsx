"use client";

import { AlertTriangle, Maximize, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  DEFAULT_SOURCE_ID,
  SOURCES,
  getSource,
  type PlaybackTarget,
} from "../lib/sources";

/** How long the iframe gets to load before we offer the backup source. */
const LOAD_TIMEOUT_MS = 12_000;

interface WatchPlayerProps {
  target: PlaybackTarget;
  title: string;
  children?: React.ReactNode;
}

/**
 * The player shell: iframe, server switcher, fullscreen.
 *
 * On detection — a cross-origin iframe reports essentially nothing, so we
 * cannot see that a stream errored, stalled, or hit an ad wall. The one
 * observable failure is "never loaded at all", which the timeout below covers.
 * Everything else has to be user-driven, which is why the source switcher is
 * a visible control rather than a hidden retry.
 *
 * Each provider has its own in-player server menu, but that iframe is
 * cross-origin — we can neither read nor drive it. Switching provider is the
 * only server control this app has.
 */
export function WatchPlayer({ target, title, children }: WatchPlayerProps) {
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE_ID);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const source = getSource(sourceId);
  const src = source.build(target);

  // Reset load state whenever the stream changes — a new episode or source is
  // a fresh load, and the old "ready" state would hide the spinner wrongly.
  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src]);

  const enterFullscreen = () => {
    // Fullscreen the wrapper, not the iframe: the iframe keeps playing and the
    // browser scales the whole frame, which also works when a provider blocks
    // fullscreen on its own player.
    void shellRef.current?.requestFullscreen?.();
  };

  const reload = () => {
    setLoaded(false);
    setTimedOut(false);
    // Reassigning src is the only way to retry a cross-origin frame.
    if (frameRef.current) frameRef.current.src = src;
  };

  return (
    <div>
      <div
        ref={shellRef}
        className="relative mx-auto aspect-video w-full max-w-[1400px] overflow-hidden rounded-2xl border border-white/[0.08] bg-black"
      >
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          onLoad={() => setLoaded(true)}
          // The `*` allowlist matters: these providers nest another iframe
          // (the actual video host) inside their own page, and a bare
          // `fullscreen` only grants the permission to multiembed's origin —
          // the nested player then can't go fullscreen, which is why its own
          // expand button did nothing. `*` grants it down the whole frame tree.
          allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *"
          allowFullScreen
          referrerPolicy="origin"
          className="absolute inset-0 h-full w-full border-0"
        />

        {!loaded ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="text-xs text-white/50">
              Loading {source.label.toLowerCase()} source…
            </p>
          </div>
        ) : null}

        {!loaded && timedOut ? (
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-3 bg-black/90 p-4 text-center">
            <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden />
            <p className="text-xs text-white/70">
              This source is taking a while. Try a different one.
            </p>
          </div>
        ) : null}
      </div>

      {/* Controls sit outside the fullscreen wrapper so they never overlay
          the picture. */}
      <div className="mx-auto mt-3 flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Source
          </span>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSourceId(s.id)}
              aria-pressed={s.id === sourceId}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                s.id === sourceId
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-white/[0.12] bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Reload
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={enterFullscreen}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <Maximize className="h-3.5 w-3.5" aria-hidden />
            Fullscreen
          </button>
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-[1400px] px-1 text-[11px] text-white/35">
        {source.hint}
      </p>

      {children}
    </div>
  );
}
