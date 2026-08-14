import type { ExploreTab } from "../schemas";

/**
 * Quick-filter presets surfaced as glass pills on the explore landing page.
 *
 * Each preset is a self-contained URL the chip links to — the /explore route
 * parses the same params the chip encodes, so the chip is essentially a
 * bookmark into the explorer.
 *
 * Server-side, `tab=anime` resolves to TMDB `tv` + `with_genres=16,language=ja`,
 * and `tab=trending` resolves to TMDB `/trending/all/week`. Everything else
 * goes through `/discover`.
 */

export interface ExplorePreset {
  id: string;
  label: string;
  href: string;
}

interface PresetSeed {
  id: string;
  label: string;
  params: Partial<Record<string, string | number | undefined>>;
}

/**
 * Source-of-truth preset table. Converted into URLs at module load.
 * Order matters — the chips render in this order.
 */
const PRESET_SEEDS: PresetSeed[] = [
  // Highest-rated, vote-count-gated.
  {
    id: "award-winners",
    label: "Award Winners",
    params: {
      tab: "movies",
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
    },
  },
  // Anime tab already implies TV + genre 16 + ja on the server.
  {
    id: "anime-hits",
    label: "Anime Hits",
    params: { tab: "anime" },
  },
  // Bollywood / Hindi-language recent movies.
  {
    id: "latest-hindi",
    label: "Latest Hindi",
    params: {
      tab: "movies",
      language: "hi",
      sort_by: "primary_release_date.desc",
    },
  },
  // True-crime isn't a TMDB genre; lean on keyword search instead.
  {
    id: "true-crime",
    label: "True Crime",
    params: { tab: "tv", q: "true crime" },
  },
  // Same endpoint as the "Trending" tab.
  {
    id: "trending-now",
    label: "Trending Now",
    params: { tab: "trending" },
  },
];

function paramsToSearch(
  params: PresetSeed["params"],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = String(v);
  }
  return out;
}

function presetHref(seed: PresetSeed): string {
  const sp = new URLSearchParams(paramsToSearch(seed.params));
  const qs = sp.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export const EXPLORE_PRESETS: readonly ExplorePreset[] = PRESET_SEEDS.map(
  (s) => ({ id: s.id, label: s.label, href: presetHref(s) }),
);

export function getPreset(id: string): ExplorePreset | undefined {
  return EXPLORE_PRESETS.find((p) => p.id === id);
}

/**
 * Build a chip href from arbitrary filter params. Used by the genre tiles
 * and the search bar so the same URL conventions are reused.
 */
export function buildExploreHref(
  params: Partial<Record<string, string | number | undefined>>,
): string {
  const sp = new URLSearchParams(paramsToSearch(params));
  const qs = sp.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export type { ExploreTab };
