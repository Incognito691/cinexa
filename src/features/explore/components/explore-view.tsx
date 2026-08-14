"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { X } from "lucide-react";

import { getExploreFilters } from "../api";
import type { ExploreTab } from "../schemas";
import { buildExploreHref } from "../lib/presets";
import { getTabMeta } from "../tabs";
import { BrowseByGenre } from "./browse-by-genre";
import { CardGrid } from "./card-grid";
import { Pagination } from "./pagination";
import { QuickFilterChips } from "./quick-filter-chips";
import { SearchBar } from "./search-bar";

const PAGE_SIZE = 20;

interface ExploreViewProps {
  initialTab: ExploreTab;
}

/**
 * Conditional renderer for /explore.
 *
 *  - No filter params → landing view (hero + search + chips + genre tiles).
 *  - Any filter param  → results view (compact search + active-filter
 *    chip + card grid + pagination).
 *
 * State lives entirely in the URL — both views read the same query keys so
 * back/forward navigation works as expected.
 */
export function ExploreView(_: ExploreViewProps) {
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    return {
      tab: (searchParams.get("tab") ?? "movies") as ExploreTab,
      genre: searchParams.get("genre")
        ? Number(searchParams.get("genre"))
        : undefined,
      sortBy: searchParams.get("sort_by") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
    };
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    (filters.genre != null) || filters.sortBy || filters.q,
  );

  if (!hasActiveFilters) {
    return <ExploreLanding tab={filters.tab} />;
  }

  return <ExploreResults filters={filters} />;
}

// ────────────────────────────── Landing ──────────────────────────────

function ExploreLanding({ tab }: { tab: ExploreTab }) {
  return (
    <div className="space-y-12 pb-12 pt-2 sm:pt-6">
      <header className="space-y-6 text-center">
        <h1 className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
          What are you looking for?
        </h1>
        <SearchBar tab={tab} className="mx-auto max-w-2xl" />
      </header>

      <QuickFilterChips />

      <BrowseByGenre />
    </div>
  );
}

// ────────────────────────────── Results ──────────────────────────────

interface ResultsFilters {
  tab: ExploreTab;
  genre?: number;
  sortBy?: string;
  q?: string;
  page: number;
}

function ExploreResults({ filters }: { filters: ResultsFilters }) {
  const tabMeta = getTabMeta(filters.tab);

  const query = useQuery({
    queryKey: [
      "explore",
      filters.tab,
      filters.genre ?? null,
      filters.sortBy ?? null,
      filters.q ?? null,
      filters.page,
    ],
    queryFn: () => getExploreFilters(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const items = query.data?.items ?? [];
  const totalResults = query.data?.totalResults;
  const totalPages = Math.max(1, query.data?.totalPages ?? 1);

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("tab", filters.tab);
    if (filters.genre != null) params.set("genre", String(filters.genre));
    if (filters.sortBy) params.set("sort_by", filters.sortBy);
    if (filters.q) params.set("q", filters.q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/explore?${qs}` : "/explore";
  };

  const startIndex =
    items.length === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const endIndex = (filters.page - 1) * PAGE_SIZE + items.length;

  return (
    <div className="space-y-8 pb-12 pt-2 sm:pt-6">
      <header className="space-y-4">
        <h1 className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          {tabMeta.label}
        </h1>
        <SearchBar
          defaultValue={filters.q ?? ""}
          tab={filters.tab}
          className="max-w-2xl"
        />
        <ActiveFilterChip filters={filters} />
      </header>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-3">
          <p className="text-sm text-white/55">
            {totalResults != null ? (
              <>
                Showing{" "}
                <span className="font-medium text-white">
                  {startIndex.toLocaleString()}–{endIndex.toLocaleString()}
                </span>{" "}
                of{" "}
                <span className="font-medium text-white">
                  {totalResults.toLocaleString()}
                </span>{" "}
                {tabMeta.label.toLowerCase()}
                {filters.q ? (
                  <>
                    {" "}matching{" "}
                    <span className="font-medium text-white">
                      &ldquo;{filters.q}&rdquo;
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </header>
        <CardGrid items={items} loading={query.isLoading} />
      </section>

      <Pagination
        page={filters.page}
        totalPages={Math.min(totalPages, 500)}
        buildHref={buildHref}
      />
    </div>
  );
}

// ─────────────────────── Active filter chip ───────────────────────

function ActiveFilterChip({ filters }: { filters: ResultsFilters }) {
  const activeChip = useMemo(() => describeActiveFilter(filters), [filters]);
  if (!activeChip) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] py-1 pl-3 pr-1 text-xs font-medium text-white backdrop-blur-md">
        {activeChip.label}
        <Link
          href={buildExploreHref({ tab: filters.tab })}
          aria-label="Clear active filter"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.12] hover:text-white"
        >
          <X className="h-3 w-3" />
        </Link>
      </span>
    </div>
  );
}

/**
 * Human-readable description of whatever filter is currently active.
 * The chip navigates back to the same tab with no filter applied.
 */
function describeActiveFilter(filters: ResultsFilters): {
  label: string;
} | null {
  if (filters.q) {
    return { label: `Search: "${filters.q}"` };
  }
  if (filters.genre != null) {
    return { label: `Genre #${filters.genre}` };
  }
  if (filters.sortBy) {
    return { label: `Sort: ${filters.sortBy}` };
  }
  return null;
}
