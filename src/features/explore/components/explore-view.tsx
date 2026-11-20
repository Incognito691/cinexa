"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { tmdbImage } from "@/lib/env";

import { getExploreFilters, getGenres } from "../api";
import type { ExploreTab } from "../schemas";
import { buildExploreHref } from "../lib/presets";
import { getTabMeta } from "../tabs";
import { countryName } from "../lib/countries";
import { BrowseByCountry } from "./browse-by-country";
import { BrowseByGenre } from "./browse-by-genre";
import { BrowseByType } from "./browse-by-type";
import { CardGrid } from "./card-grid";
import { Pagination } from "./pagination";
import { QuickFilterChips } from "./quick-filter-chips";
import { SearchBar } from "./search-bar";

const PAGE_SIZE = 20;

interface ExploreViewProps {
  initialTab: ExploreTab;
  /** Poster paths for the landing hero's background wall. */
  posters?: string[];
  /**
   * Pins the view to one catalogue and always shows results: this is what
   * `/movies/all` and `/tv-shows/all` render. Paging and "clear filter" then stay on
   * that page instead of going to `/explore`.
   */
  fixedTab?: "movies" | "tv";
}

const FIXED_PATHS = { movies: "/movies/all", tv: "/tv-shows/all" } as const;

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
export function ExploreView({ posters = [], fixedTab }: ExploreViewProps) {
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    return {
      tab: fixedTab ?? ((searchParams.get("tab") ?? "movies") as ExploreTab),
      genre: searchParams.get("genre")
        ? Number(searchParams.get("genre"))
        : undefined,
      sortBy: searchParams.get("sort_by") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
    };
  }, [searchParams, fixedTab]);

  if (fixedTab) {
    return <ExploreResults filters={filters} basePath={FIXED_PATHS[fixedTab]} />;
  }

  // `category` and `language` count as filters. They didn't, which is why
  // every "View All" on the home page — all of which link with `?tab=…&
  // category=…` — landed on this landing view instead of on results.
  const hasActiveFilters = Boolean(
    filters.genre != null ||
      filters.sortBy ||
      filters.q ||
      filters.country ||
      filters.category ||
      filters.language,
  );

  if (!hasActiveFilters) {
    return <ExploreLanding tab={filters.tab} posters={posters} />;
  }

  return <ExploreResults filters={filters} />;
}

// ────────────────────────────── Landing ──────────────────────────────

function ExploreLanding({ tab, posters }: { tab: ExploreTab; posters: string[] }) {
  return (
    <div className="space-y-12 pb-12 pt-2 sm:pt-6">
      <header className="relative isolate space-y-6 overflow-hidden rounded-2xl px-4 py-12 text-center sm:py-16">
        {/* Poster wall, faded out towards the edges so it sits behind the
            hero rather than competing with it. Static and unoptimized: TMDB
            already serves w185 from its CDN. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 grid grid-cols-6 content-center gap-2 opacity-35 sm:grid-cols-8 lg:grid-cols-12"
          style={{
            maskImage: "radial-gradient(ellipse 80% 75% at 50% 45%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 75% at 50% 45%, black 20%, transparent 80%)",
          }}
        >
          {posters.map((path) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={path}
              src={tmdbImage(path, "w185")}
              alt=""
              loading="lazy"
              className="aspect-[2/3] w-full rounded-md object-cover"
            />
          ))}
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_60%,transparent_100%)]"
        />
        <h1 className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
          What are you looking for?
        </h1>
        <SearchBar tab={tab} className="mx-auto max-w-2xl" />
      </header>

      <QuickFilterChips />

      <BrowseByType />

      <BrowseByGenre />

      <BrowseByCountry tab={tab} />
    </div>
  );
}

// ────────────────────────────── Results ──────────────────────────────

interface ResultsFilters {
  tab: ExploreTab;
  genre?: number;
  sortBy?: string;
  q?: string;
  country?: string;
  category?: string;
  language?: string;
  page: number;
}

function ExploreResults({
  filters,
  basePath,
}: {
  filters: ResultsFilters;
  /** Set on `/movies/all` and `/tv-shows/all`: links stay there, with no `tab` param. */
  basePath?: string;
}) {
  const tabMeta = getTabMeta(filters.tab);

  const query = useQuery({
    queryKey: [
      "explore",
      filters.tab,
      filters.genre ?? null,
      filters.sortBy ?? null,
      filters.q ?? null,
      filters.country ?? null,
      filters.category ?? null,
      filters.language ?? null,
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
    if (!basePath) params.set("tab", filters.tab);
    if (filters.genre != null) params.set("genre", String(filters.genre));
    if (filters.sortBy) params.set("sort_by", filters.sortBy);
    if (filters.q) params.set("q", filters.q);
    if (filters.country) params.set("country", filters.country);
    // Carried through pagination — dropping them here would silently reset
    // page 2 of "Now Playing" back to popular.
    if (filters.category) params.set("category", filters.category);
    if (filters.language) params.set("language", filters.language);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    const path = basePath ?? "/explore";
    return qs ? `${path}?${qs}` : path;
  };

  const startIndex =
    items.length === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const endIndex = (filters.page - 1) * PAGE_SIZE + items.length;

  const count =
    totalResults != null ? (
      <>
        Showing{" "}
        <span className="font-medium text-white">
          {startIndex.toLocaleString()}–{endIndex.toLocaleString()}
        </span>{" "}
        of{" "}
        <span className="font-medium text-white">{totalResults.toLocaleString()}</span>{" "}
        {tabMeta.label.toLowerCase()}
        {filters.q ? (
          <>
            {" "}matching{" "}
            <span className="font-medium text-white">&ldquo;{filters.q}&rdquo;</span>
          </>
        ) : null}
      </>
    ) : null;

  // `/movies/all` and `/tv-shows/all`: a compact header with the filters as
  // tabs and chips, instead of explore's big title-and-search stack.
  if (basePath) {
    return (
      <div className="space-y-6 pb-12 pt-2">
        <CatalogueHeader filters={filters} basePath={basePath} count={count} />
        <CardGrid items={items} loading={query.isLoading} />
        <Pagination
          page={filters.page}
          totalPages={Math.min(totalPages, 500)}
          buildHref={buildHref}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 pt-2 sm:pt-6">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
          <p className="text-sm text-white/55">{count}</p>
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

// ─────────────────────── Catalogue header ───────────────────────

const CATEGORY_TABS = {
  movies: [
    { id: undefined, label: "Popular" },
    { id: "now_playing", label: "Now Playing" },
    { id: "top_rated", label: "Top Rated" },
  ],
  tv: [
    { id: undefined, label: "Popular" },
    { id: "on_the_air", label: "On the Air" },
    { id: "top_rated", label: "Top Rated" },
  ],
} as const;

/**
 * Header of the full grids: back link, a title that names what's listed
 * ("Now Playing Movies", "Horror Movies"), the search, then the listing as
 * tabs and the genres as one scrollable row of chips. Every control is a
 * link, so each combination is a shareable URL and Back works.
 */
function CatalogueHeader({
  filters,
  basePath,
  count,
}: {
  filters: ResultsFilters;
  basePath: string;
  count: React.ReactNode;
}) {
  const kind = filters.tab === "tv" ? "tv" : "movies";
  const noun = kind === "tv" ? "TV Shows" : "Movies";
  const tabs = CATEGORY_TABS[kind];

  const genres = useQuery({
    queryKey: ["genres", kind],
    queryFn: () => getGenres(kind === "tv" ? "tv" : "movie"),
    staleTime: 24 * 60 * 60_000,
  });
  const genreName = genres.data?.genres.find((g) => g.id === filters.genre)?.name;
  const category = tabs.find((t) => t.id === filters.category) ?? tabs[0];

  // Changing one filter keeps the other and goes back to page 1.
  const href = (next: { category?: string; genre?: number }) => {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.genre != null) params.set("genre", String(next.genre));
    // A language filter (the home page's Hindi rows) survives a tab change.
    if (filters.language) params.set("language", filters.language);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const language = filters.language
    ? (new Intl.DisplayNames(["en"], { type: "language" }).of(filters.language) ?? null)
    : null;
  const title = [category.id ? category.label : genreName || language ? null : "All", language, genreName, noun]
    .filter(Boolean)
    .join(" ");

  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
      active
        ? "border-white bg-white text-black"
        : "border-white/[0.08] bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
    );

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <Link
            href={basePath.replace(/\/all$/, "")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {noun}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="min-h-5 text-sm text-white/55">{count}</p>
        </div>
        <SearchBar
          variant="compact"
          defaultValue={filters.q ?? ""}
          tab={filters.tab}
          placeholder={`Search ${noun.toLowerCase()}…`}
          className="w-full sm:w-80"
        />
      </div>

      {/* Stacked on phones: side by side the chips were left a sliver. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <nav aria-label="Listing" className="flex shrink-0 self-start rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {tabs.map((t) => {
            const active = t.id === category.id;
            return (
              <Link
                key={t.label}
                href={href({ category: t.id, genre: filters.genre })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-white/65 hover:text-white",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-white/[0.08] md:block" />

        <nav
          aria-label="Genres"
          className="flex min-w-0 gap-2 md:flex-1 overflow-x-auto scrollbar-hide"
          style={{
            maskImage: "linear-gradient(to right, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, black 92%, transparent)",
          }}
        >
          <Link href={href({ category: category.id })} className={chip(filters.genre == null)}>
            All genres
          </Link>
          {(genres.data?.genres ?? []).map((g) => (
            <Link
              key={g.id}
              href={href({ category: category.id, genre: g.id })}
              className={chip(g.id === filters.genre)}
            >
              {g.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ─────────────────────── Active filter chip ───────────────────────

function ActiveFilterChip({ filters, clearHref }: { filters: ResultsFilters; clearHref?: string }) {
  const activeChip = useMemo(() => describeActiveFilter(filters), [filters]);
  if (!activeChip) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] py-1 pl-3 pr-1 text-xs font-medium text-white backdrop-blur-md">
        {activeChip.label}
        <Link
          href={clearHref ?? buildExploreHref({ tab: filters.tab })}
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
  if (filters.country) {
    return { label: `Country: ${countryName(filters.country)}` };
  }
  if (filters.genre != null) {
    return { label: `Genre #${filters.genre}` };
  }
  if (filters.sortBy) {
    return { label: `Sort: ${filters.sortBy}` };
  }
  return null;
}
