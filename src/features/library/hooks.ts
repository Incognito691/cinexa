"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toggleCollected, toggleFavourite } from "@/server/library";
import type { LibraryKeys, MediaType } from "@/types/media";

import { fetchLibraryKeys } from "./api";

/**
 * Shared client state for every heart and collect button on the page.
 *
 * The point of routing this through React Query rather than per-button state:
 * a grid of forty posters mounts forty buttons, and they all read this one
 * query key. React Query dedupes identical in-flight queries, so that's a
 * single request. Toggling any one of them writes to the same cache entry, so
 * the same title appearing twice on a page (a rail *and* the similar grid)
 * stays in sync without either button knowing the other exists.
 */
export const LIBRARY_KEYS_QUERY = ["library", "keys"] as const;

export type LibraryKind = "favourite" | "collected";

const EMPTY: LibraryKeys = { favourites: [], collected: [], signedIn: false };

export function useLibraryKeys() {
  const { data } = useQuery({
    queryKey: LIBRARY_KEYS_QUERY,
    queryFn: fetchLibraryKeys,
    // Library membership only changes through this app, and every mutation
    // below invalidates the key — so there's nothing to poll for.
    staleTime: 5 * 60_000,
    // A signed-out visitor gets empty arrays, not an error; retrying a
    // successful empty answer would be pointless.
    retry: 1,
  });
  return data ?? EMPTY;
}

const listFor = (keys: LibraryKeys, kind: LibraryKind) =>
  kind === "favourite" ? keys.favourites : keys.collected;

/**
 * Optimistic add/remove.
 *
 * The cache flips immediately and rolls back if the write fails. Toggling a
 * heart is cosmetic enough that waiting on a round trip feels broken, and
 * cheap enough that a failed write costs the user nothing but a re-click.
 */
export function useLibraryToggle(kind: LibraryKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tmdbId: number; mediaType: MediaType }) =>
      kind === "favourite" ? toggleFavourite(input) : toggleCollected(input),

    async onMutate(input) {
      await queryClient.cancelQueries({ queryKey: LIBRARY_KEYS_QUERY });
      const previous =
        queryClient.getQueryData<LibraryKeys>(LIBRARY_KEYS_QUERY) ?? EMPTY;

      const key = `${input.mediaType}:${input.tmdbId}`;
      const current = listFor(previous, kind);
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];

      queryClient.setQueryData<LibraryKeys>(LIBRARY_KEYS_QUERY, {
        ...previous,
        [kind === "favourite" ? "favourites" : "collected"]: next,
      });

      return { previous };
    },

    onError(_error, _input, context) {
      if (context?.previous) {
        queryClient.setQueryData(LIBRARY_KEYS_QUERY, context.previous);
      }
    },

    onSettled() {
      void queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS_QUERY });
    },
  });
}

/** Is this title saved, and can the user save things at all? */
export function useLibraryState(
  kind: LibraryKind,
  tmdbId: number,
  mediaType: MediaType,
) {
  const keys = useLibraryKeys();
  const toggle = useLibraryToggle(kind);

  return {
    saved: listFor(keys, kind).includes(`${mediaType}:${tmdbId}`),
    signedIn: keys.signedIn,
    pending: toggle.isPending,
    toggle: () => toggle.mutate({ tmdbId, mediaType }),
  };
}
