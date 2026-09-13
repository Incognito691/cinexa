/**
 * Playback sources.
 *
 * Each source resolves to a URL the player drops into an iframe, so adding a
 * provider is a table entry rather than a new component. Order is priority
 * order: `SOURCES[0]` is what a page opens with.
 *
 * SuperEmbed exposes its *own* server menu inside its player — that's where
 * per-server switching happens once it loads. This list only chooses the
 * provider, and exists so there's a way out when SuperEmbed itself won't start.
 *
 * Why the fallback is a second embed and not WebTorrent: browser WebTorrent can
 * only peer over WebRTC, and YTS swarms are overwhelmingly plain BitTorrent
 * clients a browser can't reach — with no WebSocket-tracker peers or web seeds
 * it gets zero peers and never starts. Another embed fails over instantly.
 */

export interface PlaybackTarget {
  tmdbId: number;
  mediaType: "movie" | "tv";
  /** TV only. */
  season?: number;
  episode?: number;
}

export interface PlaybackSource {
  id: string;
  label: string;
  /** Shown under the picker so the choice isn't opaque. */
  hint: string;
  /**
   * Origin this provider posts player events from, when it posts any. Only
   * messages from one of these are trusted — see `watch-tracker.tsx`.
   */
  progressOrigin?: string;
  /** `startAt` seconds, when the provider supports resuming mid-stream. */
  build: (target: PlaybackTarget, startAt?: number) => string;
}

export const SOURCES: readonly PlaybackSource[] = [
  {
    id: "vidlink",
    label: "Primary",
    hint: "VidLink — reports playback position, so this one resumes where you left off.",
    progressOrigin: "https://vidlink.pro",
    build: ({ tmdbId, mediaType, season, episode }, startAt) => {
      const path =
        mediaType === "movie"
          ? `movie/${tmdbId}`
          : `tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;

      const params = new URLSearchParams({ nextbutton: "true" });
      // Only send a real mid-stream position: `startAt=0` is meaningless and
      // the provider's own saved progress does a better job from the start.
      if (startAt && startAt > 0) params.set("startAt", String(Math.floor(startAt)));

      return `https://vidlink.pro/${path}?${params}`;
    },
  },
  {
    id: "superembed",
    label: "SuperEmbed",
    hint: "SuperEmbed — pick a server from its own menu once the player loads. Reports nothing, so progress isn't tracked here.",
    build: ({ tmdbId, mediaType, season, episode }) => {
      // The player lives at the bare path. `directstream.php` is NOT an
      // endpoint — it returns 404 "File not found." for every id.
      const params = new URLSearchParams({
        video_id: String(tmdbId),
        tmdb: "1",
      });
      if (mediaType === "tv") {
        params.set("s", String(season ?? 1));
        params.set("e", String(episode ?? 1));
      }
      return `https://multiembed.mov/?${params}`;
    },
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    hint: "A third provider — use this when the others won't start. No progress tracking.",
    build: ({ tmdbId, mediaType, season, episode }) =>
      mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`,
  },
] as const;

export const DEFAULT_SOURCE_ID = SOURCES[0].id;

export function getSource(id: string): PlaybackSource {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}

/**
 * Where the user's preferred default provider is stored.
 *
 * Shared between the settings page (which writes it) and the player (which
 * starts on it), so the two can't drift onto different keys.
 */
export const SOURCE_PREFERENCE_KEY = "cinexa:default-source";

export const SOURCE_IDS: readonly string[] = SOURCES.map((s) => s.id);
