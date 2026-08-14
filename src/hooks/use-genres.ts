"use client";

import { useQuery } from "@tanstack/react-query";

import type { GenresResponse } from "@/lib/api-client";

/**
 * Fetches the TMDB genre list for a media type. Cached for 1 day upstream
 * (in /api/genres) and 5 min in React Query.
 */
export function useGenres(type: "movie" | "tv") {
  return useQuery({
    queryKey: ["genres", type],
    queryFn: async () => {
      const res = await fetch(`/api/genres?type=${type}`);
      if (!res.ok) throw new Error(`Genres fetch failed: ${res.status}`);
      const body = (await res.json()) as
        | { ok: true; data: GenresResponse }
        | { ok: false; error: string };
      if (!body.ok) throw new Error(body.error);
      return body.data;
    },
    staleTime: 5 * 60_000,
  });
}
