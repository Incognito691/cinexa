"use client";

import { useQuery } from "@tanstack/react-query";

export type SectionCategory =
  | "popular"
  | "top_rated"
  | "now_playing"
  | "on_the_air";

export interface UseSectionParams {
  type: "movie" | "tv";
  category: SectionCategory;
  region?: string;
  language?: string;
  page?: number;
}

interface ListPayload {
  items: import("@/types/media").MediaCardItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const body = (await res.json()) as { ok: true; data: T } | { ok: false; error: string };
  if (!body.ok) throw new Error(body.error);
  return body.data;
}

async function getDiscover(
  type: "movie" | "tv",
  category: SectionCategory,
  region?: string,
  language?: string,
  page = 1,
) {
  const params = new URLSearchParams({
    type,
    category,
    page: String(page),
  });
  if (region) params.set("region", region);
  if (language) params.set("language", language);
  return request<ListPayload>(`/api/discover?${params.toString()}`);
}

export function useSection(params: UseSectionParams) {
  return useQuery({
    // Include every dimension in the key so React Query refetches when any of them change.
    queryKey: [
      "discover",
      params.type,
      params.category,
      params.region ?? null,
      params.language ?? null,
      params.page ?? 1,
    ],
    queryFn: () =>
      getDiscover(
        params.type,
        params.category,
        params.region,
        params.language,
        params.page ?? 1,
      ),
    staleTime: 5 * 60_000,
  });
}