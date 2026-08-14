/**
 * Public API of the home feature.
 *
 * Anything outside `features/home/` imports from here, never from a file
 * inside `components/`. That keeps the feature's internals free to move.
 */
export { Hero } from "./components/hero";
export { BentoGrid } from "./components/bento-grid";
export { MediaRail } from "./components/media-rail";
export { SiteFooter } from "./components/site-footer";
export {
  NowPlayingRail,
  TopMoviesRail,
  TopTvRail,
  TopHindiMoviesRail,
  TopHindiTvRail,
  type RailFeed,
} from "./components/home-rails";
