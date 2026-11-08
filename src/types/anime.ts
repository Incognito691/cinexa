/**
 * Anime as the `/anime` page sees it, mapped from AniList.
 *
 * `id` is the **AniList** id, not a TMDB one. Cards link to `/anime/:id`,
 * which resolves it to the TMDB title that actually plays.
 */
export interface AnimeItem {
  id: number;
  title: string;
  /** TV, MOVIE, OVA, ONA, SPECIAL, TV_SHORT, MUSIC. */
  format: string | null;
  cover: string | null;
  /** Dominant cover colour, e.g. "#e4a15d". */
  color: string | null;
  banner: string | null;
  /** 0–100. */
  score: number | null;
  episodes: number | null;
  seasonYear: number | null;
  genres: string[];
  studio: string | null;
  /** Plain text; AniList's HTML is stripped server-side. */
  description: string | null;
  nextEpisode: { episode: number; airingAt: number } | null;
}

export interface AnimeHome {
  /** e.g. "Fall 2026". */
  seasonLabel: string;
  trending: AnimeItem[];
  season: AnimeItem[];
  /** This season's shows with an episode still to come, soonest first. */
  airing: AnimeItem[];
  top: AnimeItem[];
  movies: AnimeItem[];
}
