"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrending } from "@/lib/api-client";

export function useTrending(
  type: "all" | "movie" | "tv" = "all",
  window: "day" | "week" = "week",
  page = 1,
) {
  return useQuery({
    queryKey: ["trending", type, window, page],
    queryFn: () => getTrending(page, type, window),
    staleTime: 5 * 60_000,
  });
}
