"use client";

import { AlertTriangle, Maximize, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { usePersistedString } from "@/hooks/use-persisted-string";
import { cn } from "@/lib/utils";

import {
  DEFAULT_SOURCE_ID,
  SOURCES,
  SOURCE_IDS,
  SOURCE_PREFERENCE_KEY,
  ZOKO_ORIGIN,
  getSource,
  type PlaybackTarget,
} from "../lib/sources";

/** How long the iframe gets to load before we offer the backup source. */
const LOAD_TIMEOUT_MS = 12_000;
interface WatchPlayerProps {
  target: PlaybackTarget;
  title: string;
  /** Seconds to resume at. Only providers that support it act on this. */
  startAt?: number;
  /** Where to go when the anime player finishes an episode with auto-next on. */
  nextHref?: string;
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
export function WatchPlayer({
  target,
  title,
  startAt,
  nextHref,
  children,
}: WatchPlayerProps) {
  const router = useRouter();
  // The settings page owns the default. The player follows it — including
  // across the hook's post-mount hydration — until the user picks a source
  // here, after which their pick wins for this page only. Switching provider
  // to get one broken title playing shouldn't silently rewrite the default.
  const [preferred] = usePersistedString(
    SOURCE_PREFERENCE_KEY,
    DEFAULT_SOURCE_ID,
    SOURCE_IDS,
  );
  const [picked, setPicked] = useState<string | null>(null);
  // Anime opens on the anime player; everything else on the saved default.
  // Anime-only sources aren't offered for anything else.
  const sources = SOURCES.filter((s) => !s.animeOnly || target.anime);
  const sourceId = picked ?? (target.anime ? "zoko" : preferred);
  const setSourceId = setPicked;
  // Set once the anime player has moved us on to the next episode, so the
  // next one starts by itself (a cold start would begin muted).
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const source = getSource(sourceId);
  const src = source.build(target, startAt, { autoplay: autoAdvanced });
  const isZoko = source.id === "zoko";

  // Reset load state whenever the stream changes — a new episode or source is
  // a fresh load, and the old "ready" state would hide the spinner wrongly.
  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src]);

  /*
   * The anime player's message protocol (every message has
   * `channel: "zokoanime"`):
   *  - `ready`: seek to the saved position (resume) and report fullscreen.
   *  - `ended` with `auto_next`: navigate to the next episode ourselves; the
   *    player never changes episodes on its own.
   *  - `fullscreen` requests: fullscreen *our* wrapper instead of the iframe,
   *    so fullscreen survives the iframe's src changing to the next episode.
   * Position updates are read by WatchTracker for Continue Watching.
   */
  useEffect(() => {
    if (!isZoko) return;
    const send = (msg: Record<string, unknown>) =>
      frameRef.current?.contentWindow?.postMessage({ channel: "zokoanime", ...msg }, ZOKO_ORIGIN);
    const tell = () =>
      send({ type: "fullscreen", active: document.fullscreenElement === shellRef.current });

    let resumed = false;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ZOKO_ORIGIN) return;
      const msg = event.data as { channel?: string; type?: string; request?: string; auto_next?: boolean };
      if (msg?.channel !== "zokoanime") return;

      if (msg.type === "ready") {
        tell();
        if (startAt && startAt > 0 && !resumed) {
          resumed = true;
          send({ type: "seek", time: Math.floor(startAt) });
        }
      } else if (msg.type === "fullscreen" && msg.request === "enter") {
        shellRef.current?.requestFullscreen?.().then(tell, tell);
      } else if (msg.type === "fullscreen" && msg.request === "exit") {
        document.exitFullscreen?.().then(tell, tell);
      } else if (msg.type === "ended" && msg.auto_next && nextHref) {
        setAutoAdvanced(true);
        router.push(nextHref);
      }
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("fullscreenchange", tell);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("fullscreenchange", tell);
    };
  }, [isZoko, src, startAt, nextHref, router]);

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
        // Sized so the player, the source row and the episode bar together
        // fill exactly one screen, leaving the title and description below the
        // fold. Width is derived from leftover viewport *height* so the frame
        // stays exactly 16:9 — setting a max-height instead would letterbox it.
        // `WATCH_CHROME_PX` is everything else in that stack; keep them in sync.
        className="relative mx-auto aspect-video w-full max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] overflow-hidden rounded-2xl border border-white/[0.08] bg-black"
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
      <div className="mx-auto mt-3 flex max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Source
          </span>
          {sources.map((s) => (
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

      <p className="mx-auto mt-2 max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] px-1 text-[11px] text-white/35">
        {source.hint}
      </p>

      {children}
    </div>
  );
}
