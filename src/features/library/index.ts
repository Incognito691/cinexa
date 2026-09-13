/**
 * Public API of the library feature — favourites and collections.
 *
 * `lib/entries.ts` is server-only (it reaches into `server/tmdb`), so it stays
 * out of this barrel and the pages import it directly, same as
 * continue-watching's loader.
 */
export { LibraryButton } from "./components/library-button";
export { ManageCollection } from "./components/manage-collection";
export { useLibraryKeys, useLibraryState, useLibraryToggle } from "./hooks";
export type { LibraryKind } from "./hooks";
