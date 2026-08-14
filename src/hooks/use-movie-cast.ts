"use client";

import { useQuery } from "@tanstack/react-query";
import { getMovieCast } from "@/lib/api-client";

export function useMovieCast(movieId: number | undefined) {
  return useQuery({
    queryKey: ["movie-cast", movieId],
    queryFn: () => getMovieCast(movieId!),
    enabled: typeof movieId === "number",
    staleTime: 24 * 60 * 60_000,
  });
}
