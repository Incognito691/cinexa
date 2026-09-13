/**
 * Watch-progress rules, shared by the server, the tracker and the UI.
 *
 * Deliberately *not* in `server/watch-history.ts`: that's a `"use server"`
 * module, where every export has to be an async function, and client code
 * isn't allowed to import from `server/**` anyway.
 */

/** Past this fraction the title counts as finished rather than in progress. */
export const FINISHED_RATIO = 0.95;

/** Below this many seconds in, there's nothing worth resuming. */
export const MIN_RESUME_SECONDS = 30;

export const isFinished = (position: number, runtime: number): boolean =>
  runtime > 0 && position / runtime >= FINISHED_RATIO;

/** 0..1, or `null` when the runtime is unknown (nothing to draw a bar from). */
export const progressRatio = (
  position: number,
  runtime: number,
): number | null =>
  runtime > 0 ? Math.min(1, Math.max(0, position / runtime)) : null;

/** "32m left" / "1h 12m left", or `null` when there's no runtime to subtract from. */
export function timeLeftLabel(
  position: number,
  runtime: number,
): string | null {
  if (runtime <= 0) return null;
  const minutes = Math.round((runtime - position) / 60);
  if (minutes <= 0) return "Finished";
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h left` : `${hours}h ${rest}m left`;
}
