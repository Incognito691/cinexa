"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  COUNTRY_CODES,
  FEATURED_COUNT,
  countryFlag,
  countryName,
} from "../lib/countries";
import { buildExploreHref } from "../lib/presets";

interface BrowseByCountryProps {
  /** Tab the country tiles filter within. Trending ignores filters. */
  tab?: string;
}

/**
 * "Browse by Country" — six featured producers, the rest behind "Show all".
 *
 * Collapsed, the grid fades out under the toggle so it reads as truncated
 * rather than as the whole list.
 */
export function BrowseByCountry({ tab = "movies" }: BrowseByCountryProps) {
  const [expanded, setExpanded] = useState(false);
  const codes = expanded ? COUNTRY_CODES : COUNTRY_CODES.slice(0, FEATURED_COUNT);
  const hiddenCount = COUNTRY_CODES.length - FEATURED_COUNT;

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">
          Browse by Country
        </h2>
      </header>

      <div className="relative">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {codes.map((code) => {
            const name = countryName(code);
            return (
              <Link
                key={code}
                href={buildExploreHref({
                  tab,
                  country: code,
                  sort_by: "popularity.desc",
                  page: 1,
                })}
                aria-label={`Browse titles from ${name}`}
                className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] px-2 text-center shadow-md shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:bg-white/[0.08] hover:shadow-xl"
              >
                <span
                  className="text-3xl leading-none transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                >
                  {countryFlag(code)}
                </span>
                <span className="line-clamp-2 text-xs font-medium text-white/90">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Fade only makes sense while there is something below the cut. */}
        {!expanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/70 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>

      {hiddenCount > 0 ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-md transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
          >
            {expanded ? "Show less" : `Show all ${COUNTRY_CODES.length} countries`}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
    </section>
  );
}
