import { fetchTitleDetail } from "@/server/tmdb";
import type { CollectionRow, LibraryRow } from "@/server/library";
import type { CollectionEntry, MediaCardItem } from "@/types/media";

/**
 * Saved rows → poster cards.
 *
 * The database stores TMDB ids and nothing else, so each saved title costs one
 * (cached) TMDB detail request for its artwork. Server-only — it reaches into
 * `server/`, so it stays out of the feature barrel and the pages import it
 * directly, same as continue-watching's loader.
 *
 * A row whose title 404s or has since been caught by the content filter is
 * dropped rather than rendered as a hole in the grid. That also means a title
 * blocked *after* you saved it disappears from your library, which is the
 * behaviour moderation needs — otherwise favouriting would be a way to keep
 * access to something the filter later rejected.
 */
export async function loadSavedCards(
  rows: LibraryRow[],
): Promise<MediaCardItem[]> {
  const cards = await Promise.all(rows.map(toCard));
  return cards.filter((card): card is MediaCardItem => card !== null);
}

export async function loadCollectionEntries(
  rows: CollectionRow[],
): Promise<CollectionEntry[]> {
  const entries = await Promise.all(
    rows.map(async (row) => {
      const card = await toCard(row);
      return card ? { id: row.id, folderId: row.folderId, card } : null;
    }),
  );
  return entries.filter((e): e is CollectionEntry => e !== null);
}

async function toCard(row: LibraryRow): Promise<MediaCardItem | null> {
  const detail = await fetchTitleDetail(row.mediaType, row.tmdbId).catch(
    () => null,
  );
  if (!detail) return null;

  return {
    id: detail.id,
    mediaType: row.mediaType,
    title: detail.title,
    overview: detail.overview,
    posterPath: detail.posterPath,
    backdropPath: detail.backdropPath,
    releaseDate: detail.releaseDate,
    rating: detail.rating,
    // Not a ranked list — the grid orders by when you saved it, so TMDB's
    // popularity score has nothing to sort here.
    popularity: 0,
  };
}
