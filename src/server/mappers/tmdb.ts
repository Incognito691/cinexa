import type { MediaCardItem, MediaType } from "@/types/media";

interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  media_type?: MediaType;
  adult?: boolean;
}

/**
 * Internal item the filter pipeline consumes. Adds the keyword/company/network
 * signals the filter needs even though `MediaCardItem` (client-facing) doesn't
 * include them. Lives in `mappers/` so the mapping and the filtering share
 * the same source shape.
 */
export interface MediaFilterItem extends MediaCardItem {
  adult: boolean;
  genres: string[];
  productionCompanyIds: number[];
  networkIds: number[];
  keywordNames: string[];
}

export function mapTmdbListItem(item: TmdbListItem): MediaFilterItem {
  const mediaType: MediaType = item.media_type ?? (item.name ? "tv" : "movie");
  return {
    id: item.id,
    mediaType,
    title: item.title || item.name || item.original_title || item.original_name || "Untitled",
    overview: item.overview ?? "",
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    releaseDate: item.release_date || item.first_air_date || null,
    rating: item.vote_average ?? 0,
    popularity: item.popularity ?? 0,
    adult: item.adult ?? false,
    // TMDB list endpoints don't return these — they require detail fetches.
    // They get filled in on detail pages; list-level filter layers that
    // depend on them (L2, L3, L4) skip themselves when arrays are empty.
    productionCompanyIds: [],
    networkIds: [],
    keywordNames: [],
    genres: [],
  };
}
