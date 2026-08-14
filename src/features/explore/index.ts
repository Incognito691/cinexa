/**
 * Public API of the explore feature.
 *
 * `schemas` and `tabs` are exported because the route handler
 * (`app/api/explore/route.ts`) and the shared API client both need them —
 * the tab model is the contract between the URL, the route, and the UI.
 */
export { ExploreView } from "./components/explore-view";
export { CardGrid } from "./components/card-grid";
export { SearchBar } from "./components/search-bar";

export { exploreTabSchema, type ExploreTab } from "./schemas";
export { TABS, getTabMeta, type TabMeta } from "./tabs";
export {
  EXPLORE_PRESETS,
  buildExploreHref,
  getPreset,
  type ExplorePreset,
} from "./lib/presets";
