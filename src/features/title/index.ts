/**
 * Public API of the title (movie / TV detail) feature.
 */
export { MovieDetailView } from "./components/movie-detail-view";
export { TvDetailView } from "./components/tv-detail-view";
export { cutAtNextEpisode, type EpisodeCut } from "./lib/airing";
export { getMovieVideos, getMovieCast } from "./api";
export type { CastMember, VideoItem } from "./api";
