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
/**
 * VidLink posts `MEDIA_DATA` about 2.5s after loading when it has the title,
 * then every 2s. Silence this long after load means its "couldn't find this
 * content" screen. Until it speaks we keep the spinner over it, and on
 * silence we move to the next source by ourselves.
 */
const NO_MEDIA_MS = 6_000;
interface WatchPlayerProps {
  target: PlaybackTarget;
  title: string;
  /** Seconds to resume at. Only providers that support it act on this. */
  startAt?: number;
  /** Where to go when the anime player finishes an episode with auto-next on. */
  nextHref?: string;
  /** TV only: base URL for episodes, to follow the provider's own "next". */
  watchPath?: string;
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
  watchPath,
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
  // VidLink only: it has confirmed the title, or we stopped waiting for it.
  const [confirmed, setConfirmed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  // Label of the source we automatically moved away from, for the notice.
  const [switchedFrom, setSwitchedFrom] = useState<string | null>(null);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const source = getSource(sourceId);
  const src = source.build(target, startAt, { autoplay: autoAdvanced });
  const isZoko = source.id === "zoko";

  /*
   * What the iframe actually shows. Normally that's `src`, but VidLink's
   * player has its own "next episode" button, which moves on *inside* the
   * iframe. We hear about it (its events carry season and episode), update
   * the URL so the bar, picker and progress tracking follow, and then must
   * NOT reload the iframe with the new `src`: it is already playing that
   * episode. `adopted` remembers which episode the iframe moved to by itself.
   */
  const [frameSrc, setFrameSrc] = useState(src);
  const adopted = useRef<string | null>(null);
  const episodeKey = `${source.id}:${target.season}:${target.episode}`;
  useEffect(() => {
    if (adopted.current === episodeKey) return;
    adopted.current = null;
    setFrameSrc(src);
  }, [src, episodeKey]);

  useEffect(() => {
    if (source.id !== "vidlink" || target.mediaType !== "tv" || !watchPath) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== source.progressOrigin) return;
      const msg = event.data as
        | { type?: string; data?: { mtmdbId?: number; season?: number; episode?: number } }
        | undefined;
      if (msg?.type !== "PLAYER_EVENT") return;
      const season = Number(msg.data?.season);
      const episode = Number(msg.data?.episode);
      if (!Number.isInteger(season) || !Number.isInteger(episode)) return;
      if (msg.data?.mtmdbId !== undefined && Number(msg.data.mtmdbId) !== target.tmdbId) return;
      if (season === target.season && episode === target.episode) return;

      const key = `${source.id}:${season}:${episode}`;
      if (adopted.current === key) return; // already on its way
      adopted.current = key;
      router.replace(`${watchPath}?season=${season}&episode=${episode}`, { scroll: false });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [source.id, source.progressOrigin, target.mediaType, target.tmdbId, target.season, target.episode, watchPath, router]);

  // Reset load state whenever the stream changes — a new episode or source is
  // a fresh load, and the old "ready" state would hide the spinner wrongly.
  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [frameSrc]);

  useEffect(() => {
    setConfirmed(false);
    setGaveUp(false);
    if (source.id !== "vidlink" || !loaded) return;
    const timer = setTimeout(() => {
      // Only when the source was chosen for them: someone who picked Primary
      // by hand stays on it and sees its own message.
      const fallback = sources.find((s) => s.id !== source.id && !s.animeOnly);
      if (picked === null && fallback) {
        setSwitchedFrom(source.label);
        setPicked(fallback.id);
      } else {
        setGaveUp(true);
      }
    }, NO_MEDIA_MS);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== source.progressOrigin) return;
      const type = (event.data as { type?: string } | undefined)?.type;
      if (type !== "MEDIA_DATA" && type !== "PLAYER_EVENT") return;
      clearTimeout(timer);
      setConfirmed(true);
    };
    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [frameSrc, loaded, source.id, source.progressOrigin]);

  useEffect(() => {
    if (!switchedFrom) return;
    const timer = setTimeout(() => setSwitchedFrom(null), 6_000);
    return () => clearTimeout(timer);
  }, [switchedFrom]);

  const waiting = !loaded || (source.id === "vidlink" && !confirmed && !gaveUp);

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
          src={frameSrc}
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

        {waiting ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="text-xs text-white/50">
              Loading {source.label.toLowerCase()} source…
            </p>
          </div>
        ) : null}

        {switchedFrom ? (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs text-white/80 shadow-lg">
            Not on {switchedFrom}, switched to {source.label}
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
          the picture. Same segmented style as the tabs elsewhere. */}
      <div className="mx-auto mt-3 flex max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Source"
            className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1"
          >
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSwitchedFrom(null);
                  setSourceId(s.id);
                }}
                aria-pressed={s.id === sourceId}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                  s.id === sourceId
                    ? "bg-primary text-primary-foreground"
                    : "text-white/65 hover:text-white",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="hidden min-w-0 text-[11px] text-white/40 lg:block">{source.hint}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={reload}
            title="Reload this source"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Reload
          </button>
          <button
            type="button"
            onClick={enterFullscreen}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Maximize className="h-3.5 w-3.5" aria-hidden />
            Fullscreen
          </button>
        </div>
      </div>

      {/* The hint drops under the row where there's no room beside it. */}
      <p className="mx-auto mt-2 max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))] px-1 text-[11px] text-white/40 lg:hidden">
        {source.hint}
      </p>

      {children}
    </div>
  );
}
