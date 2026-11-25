/**
 * Release-date checks, shared by cards, detail pages and the player.
 *
 * Dates are TMDB's `YYYY-MM-DD` strings and compared as strings against
 * today's UTC date, so server and browser agree (no hydration mismatch
 * outside the instant of UTC midnight).
 */

const today = (now: Date) => now.toISOString().slice(0, 10);

/** True when the date is known and still in the future. */
export function isUnreleased(date: string | null | undefined, now = new Date()): boolean {
  return Boolean(date) && date! > today(now);
}

/** TMDB movie statuses that mean "nothing to watch yet". */
const PRE_RELEASE = new Set(["Rumored", "Planned", "In Production", "Post Production"]);

/**
 * Whether a title has nothing playable yet. Movies also count when TMDB's
 * status says so, which covers films with no date announced.
 */
export function isUnreleasedTitle(
  detail: { mediaType: "movie" | "tv"; releaseDate: string | null; status?: string | null },
  now = new Date(),
): boolean {
  if (isUnreleased(detail.releaseDate, now)) return true;
  if (detail.mediaType === "movie") return PRE_RELEASE.has(detail.status ?? "");
  // A show with no first air date hasn't aired.
  return !detail.releaseDate;
}

/** How long after opening a film with no digital date counts as cinema-only. */
const CINEMA_WINDOW_DAYS = 60;

/**
 * Out in cinemas, not yet released digitally, so no player has it. Only
 * within the first 60 days: TMDB often lacks digital dates (regional films
 * especially), and an older film without one is usually streaming anyway.
 */
export function inCinemasOnly(
  release: { cinema: string | null; digital: string | null },
  now = new Date(),
): boolean {
  const { cinema, digital } = release;
  if (!cinema || cinema > today(now)) return false;
  if (digital && digital <= today(now)) return false;
  const opened = new Date(`${cinema}T00:00:00Z`).getTime();
  return now.getTime() - opened < CINEMA_WINDOW_DAYS * 86_400_000;
}

/** "Mar 12, 2028", or null without a date. */
export function releaseLabel(date: string | null | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
