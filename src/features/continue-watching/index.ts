/**
 * Public API of the continue-watching feature.
 *
 * The home-page rail and the card it renders, both backed by the signed-in
 * user's `WatchedItem` rows. `lib/entries.ts` is server-only (it reaches into
 * `server/`), so it stays out of this barrel — the `/continue-watching` page
 * imports it directly.
 */
export { ContinueWatchingRail } from "./components/continue-watching-rail";
export { ContinueCard } from "./components/continue-card";
