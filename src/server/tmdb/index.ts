/**
 * Public API of the TMDB layer.
 *
 * Replaced `server/services/tmdb.service.ts` + `server/services/explore.service.ts`,
 * which both exported their own `fetchDiscover`, `FetchTrendingResult`, and
 * `sortByForCategory` and had already drifted apart.
 *
 * Every list fetcher here runs `applyContentFilterListLevel()` before
 * returning, so no caller can accidentally skip moderation.
 */

export { tmdbFetch, REVALIDATE_LIST, REVALIDATE_DYNAMIC } from "./client";
export { mapTmdbListItem, type MediaFilterItem, type TmdbListItemRaw } from "./mapper";
export {
  sortByForCategory,
  yearParamFor,
  type DiscoverCategory,
  type TmdbListResult,
} from "./types";

export { fetchDiscover, type FetchDiscoverParams } from "./discover";
export { fetchTrending, type FetchTrendingParams } from "./trending";
export { fetchSearch, type FetchSearchParams } from "./search";
export {
  fetchMovieVideos,
  fetchMovieCast,
  fetchMovieDetailForFilter,
  fetchTvDetailForFilter,
  fetchTitleDetail,
  fetchMoviePage,
  fetchTvPage,
  type VideoItem,
  type CastMember,
  type TitleDetail,
  type MoviePage,
  type TvPage,
} from "./details";
