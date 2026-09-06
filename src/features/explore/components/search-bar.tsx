"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { MediaCardItem } from "@/types/media";

import { getExploreFilters } from "../api";
import type { ExploreTab } from "../schemas";
import { buildExploreHref } from "../lib/presets";

const MAX_SUGGESTIONS = 6;
const MIN_CHARS = 1;

const startsWith = (title: string, term: string) =>
  title.toLowerCase().startsWith(term.toLowerCase());

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
}: SearchBarProps) {
  const isHero = variant === "hero";
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [debounced, setDebounced] = useState(defaultValue.trim());
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 250);
    return () => clearTimeout(id);
  }, [value]);

  // `tab=trending` short-circuits to /trending server-side and ignores `q`,
  // which would make the dropdown show unrelated titles. Suggest movies there.
  const suggestTab = (tab === "trending" ? "movies" : tab) as ExploreTab;

  const hasTerm = debounced.length >= MIN_CHARS;

  const { data, isFetching } = useQuery({
    queryKey: ["explore-suggest", suggestTab, debounced],
    queryFn: () => getExploreFilters({ tab: suggestTab, q: debounced, page: 1 }),
    enabled: open && hasTerm,
    staleTime: 60_000,
  });

  // TMDB ranks by popularity, so "a" returns titles that merely *contain* the
  // term. Float the ones that actually start with it; sort is stable, so
  // popularity order survives inside each group.
  const suggestions = [...(data?.items ?? [])]
    .sort(
      (a, b) =>
        Number(startsWith(b.title, debounced)) -
        Number(startsWith(a.title, debounced)),
    )
    .slice(0, MAX_SUGGESTIONS);

  const isEmpty = data != null && suggestions.length === 0 && !isFetching;
  const showList = open && hasTerm && (suggestions.length > 0 || isEmpty);

  const goToTitle = (item: MediaCardItem) => {
    setOpen(false);
    router.push(
      item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`,
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      aria-label="Search for movies and TV shows"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
            isHero ? "left-5" : "left-4",
          )}
        />
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
              ? "h-12 rounded-full pl-12 pr-14"
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
                No titles match &ldquo;{debounced}&rdquo;
              </li>
            ) : null}
            {suggestions.map((item, index) => {
              const poster = item.posterPath
                ? tmdbImage(item.posterPath, "w92")
                : null;
              const year = item.releaseDate?.slice(0, 4);
              return (
                <li key={`${item.mediaType}-${item.id}`} role="none">
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
                      {poster ? (
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {item.title}
                      </span>
                      <span className="block text-xs text-white/50">
                        {item.mediaType === "movie" ? "Movie" : "TV Show"}
                        {year ? ` · ${year}` : ""}
                        {item.rating > 0
                          ? ` · ★ ${(item.rating / 2).toFixed(1)}`
                          : ""}
                      </span>
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
