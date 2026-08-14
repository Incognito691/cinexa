"use client";

import { useQuery } from "@tanstack/react-query";
import { getMovieVideos } from "@/lib/api-client";

export function useMovieVideos(movieId: number | undefined) {
  return useQuery({
    queryKey: ["movie-videos", movieId],
    queryFn: () => getMovieVideos(movieId!),
    enabled: typeof movieId === "number",
    staleTime: 24 * 60 * 60_000, // videos rarely change
  });
}
