"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { animeHref } from "@/lib/anime-slug";
import { tmdbImage } from "@/lib/env";
import { request } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { AnimeItem } from "@/types/anime";
import type { MediaCardItem } from "@/types/media";

import { getExploreFilters } from "../api";
import type { ExploreTab } from "../schemas";
import { buildExploreHref } from "../lib/presets";

const MAX_SUGGESTIONS = 6;
const MIN_CHARS = 1;

const startsWith = (title: string, term: string) =>
  title.toLowerCase().startsWith(term.toLowerCase());

/** One dropdown row, whichever catalogue it came from. */
interface Suggestion {
  key: string;
  title: string;
  image: string | null;
  meta: string;
  href: string;
}

const fromTmdb = (item: MediaCardItem): Suggestion => {
  const year = item.releaseDate?.slice(0, 4);
  return {
    key: `${item.mediaType}-${item.id}`,
    title: item.title,
    image: item.posterPath ? (tmdbImage(item.posterPath, "w92") ?? null) : null,
    meta: [
      item.mediaType === "movie" ? "Movie" : "TV Show",
      year,
      item.rating > 0 ? `★ ${(item.rating / 2).toFixed(1)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`,
  };
};

const fromAnime = (item: AnimeItem): Suggestion => ({
  key: `anime-${item.id}`,
  title: item.title,
  image: item.cover,
  meta: [
    item.format === "MOVIE" ? "Anime movie" : "Anime",
    item.seasonYear,
    item.score ? `★ ${(item.score / 20).toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · "),
  href: animeHref(item.id, item.title),
});

interface SearchBarProps {
  /** Initial value (e.g. when arriving from a previous search). */
  defaultValue?: string;
  /** Tab to scope the search to. Defaults to "movies". */
  tab?: string;
  /** Optional className for the wrapping form. */
  className?: string;
  /**
   * `hero` — tall pill with the round submit button (explore landing).
   * `compact` — short rounded-xl field, no button (app topbar).
   */
  variant?: "hero" | "compact";
  placeholder?: string;
  /**
   * `anime` searches AniList instead of TMDB (anime only, linking to
   * `/anime/...`); the topbar switches to it on the anime pages.
   */
  scope?: "all" | "anime";
}

/**
 * The search field, shared by the explore hero and the app topbar.
 *
 * Submits by navigating to /explore?q=<term>&tab=<tab> so the explore page
 * handles the results. While typing, a debounced dropdown previews the top
 * matches through the same `/api/explore` fetcher the results grid uses —
 * picking one jumps straight to that title.
 */
export function SearchBar({
  defaultValue = "",
  tab = "movies",
  className,
  variant = "hero",
  placeholder = "Search for movies, TV shows, actors…",
  scope = "all",
}: SearchBarProps) {
  const isHero = variant === "hero";
  const isAnime = scope === "anime";
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [debounced, setDebounced] = useState(defaultValue.trim());
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    // Longer pause for anime: AniList's rate limit is shared by every visitor.
    const id = setTimeout(() => setDebounced(value.trim()), isAnime ? 400 : 250);
    return () => clearTimeout(id);
  }, [value, isAnime]);

  // `tab=trending` short-circuits to /trending server-side and ignores `q`,
  // which would make the dropdown show unrelated titles. Suggest movies there.
  const suggestTab = (tab === "trending" ? "movies" : tab) as ExploreTab;

  const hasTerm = debounced.length >= MIN_CHARS;

  const tmdb = useQuery({
    queryKey: ["explore-suggest", suggestTab, debounced],
    queryFn: () => getExploreFilters({ tab: suggestTab, q: debounced, page: 1 }),
    enabled: open && hasTerm && !isAnime,
    staleTime: 60_000,
  });

  const anime = useQuery({
    queryKey: ["anime-suggest", debounced],
    queryFn: () => request<AnimeItem[]>(`/api/anime/search?q=${encodeURIComponent(debounced)}`),
    enabled: open && hasTerm && isAnime,
    staleTime: 5 * 60_000,
  });

  // TMDB ranks by popularity, so "a" returns titles that merely *contain* the
  // term. Float the ones that actually start with it; sort is stable, so
  // popularity order survives inside each group. AniList already ranks by
  // match.
  const suggestions: Suggestion[] = isAnime
    ? (anime.data ?? []).slice(0, MAX_SUGGESTIONS).map(fromAnime)
    : [...(tmdb.data?.items ?? [])]
        .sort(
          (a, b) =>
            Number(startsWith(b.title, debounced)) -
            Number(startsWith(a.title, debounced)),
        )
        .slice(0, MAX_SUGGESTIONS)
        .map(fromTmdb);

  const { data, isFetching } = isAnime ? anime : tmdb;
  const isEmpty = data != null && suggestions.length === 0 && !isFetching;
  const showList = open && hasTerm && (suggestions.length > 0 || isEmpty);

  const goToTitle = (item: Suggestion) => {
    setOpen(false);
    router.push(item.href);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // There's no anime results page; Enter opens the best match.
    if (isAnime) {
      if (suggestions[0]) goToTitle(suggestions[0]);
      return;
    }
    setOpen(false);
    const trimmed = value.trim();
    const href = buildExploreHref({
      tab,
      ...(trimmed ? { q: trimmed } : {}),
    });
    router.push(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      goToTitle(suggestions[active]);
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={className}
      aria-label={isAnime ? "Search anime" : "Search for movies and TV shows"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        {/* The hero has a search button on the right; one icon is enough. */}
        {isHero ? null : (
          // z-10: the input is later in the DOM and has a backdrop blur, so
          // without it the icon is painted under the blur as a smudge.
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `search-suggestion-${active}` : undefined
          }
          className={cn(
            "w-full border border-white/[0.08] bg-white/[0.04] text-sm text-foreground backdrop-blur-md placeholder:text-muted-foreground/70 outline-none transition focus:border-brand-from/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-brand-from/30",
            isHero
              ? "h-12 rounded-full pl-6 pr-14"
              : "h-10 rounded-xl pl-11 pr-4",
          )}
        />
        {isHero ? (
          <button
            type="submit"
            aria-label="Submit search"
            className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition hover:opacity-90"
          >
            <Search className="h-4 w-4" />
          </button>
        ) : null}

        {showList ? (
          <ul
            id="search-suggestions"
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0f]/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {isEmpty ? (
              <li
                role="option"
                aria-selected={false}
                className="px-3 py-6 text-center text-sm text-white/50"
              >
                No {isAnime ? "anime" : "titles"} match &ldquo;{debounced}&rdquo;
              </li>
            ) : null}
            {suggestions.map((item, index) => {
              return (
                <li key={item.key} role="none">
                  <button
                    type="button"
                    id={`search-suggestion-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => goToTitle(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      index === active ? "bg-white/[0.08]" : ""
                    }`}
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {item.title}
                      </span>
                      <span className="block text-xs text-white/50">{item.meta}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </form>
  );
}
