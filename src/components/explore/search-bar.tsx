"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buildExploreHref } from "@/lib/explore-presets";

interface SearchBarProps {
  /** Initial value (e.g. when arriving from a previous search). */
  defaultValue?: string;
  /** Tab to scope the search to. Defaults to "movies". */
  tab?: string;
  /** Optional className for the wrapping form. */
  className?: string;
}

/**
 * Hero search bar with a single round red submit button on the right.
 *
 * Submits by navigating to /explore?q=<term>&tab=<tab> so the same
 * explore page handles the results. No autocomplete here — the heavy
 * lifting lives in the search-results view.
 */
export function SearchBar({ defaultValue = "", tab = "movies", className }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    const href = buildExploreHref({
      tab,
      ...(trimmed ? { q: trimmed } : {}),
    });
    router.push(href);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={className}
      aria-label="Search for movies and TV shows"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search for movies, TV shows, actors…"
          aria-label="Search for movies, TV shows, actors"
          className="h-12 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-12 pr-14 text-sm text-foreground backdrop-blur-md placeholder:text-muted-foreground/70 outline-none transition focus:border-brand-from/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-brand-from/30"
        />
        <button
          type="submit"
          aria-label="Submit search"
          className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition hover:opacity-90"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
