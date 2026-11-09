import Link from "next/link";
import { ArrowRight, Clapperboard, Tv, type LucideIcon } from "lucide-react";

import { buildExploreHref } from "../lib/presets";

interface TypeTile {
  tab: "movies" | "tv";
  label: string;
  blurb: string;
  Icon: LucideIcon;
  gradient: string;
}

const TYPES: readonly TypeTile[] = [
  { tab: "movies", label: "Movies", blurb: "Films from every genre and decade", Icon: Clapperboard, gradient: "from-rose-500/40 via-red-500/30 to-orange-500/20" },
  { tab: "tv", label: "TV Shows", blurb: "Series to binge, new and classic", Icon: Tv, gradient: "from-sky-500/40 via-blue-500/30 to-indigo-500/20" },
] as const;

/**
 * "Browse by Type" — replaces the topbar tab strip, which never worked
 * (a bare `?tab=` renders the landing page, so the tabs were a no-op).
 *
 * Each tile carries `sort_by`, which is what actually flips `ExploreView`
 * into the results grid.
 */
export function BrowseByType() {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">Browse by Type</h2>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Short banners rather than 2:1 cards: at two per row a 2:1 card
            was ~330px tall and pushed the section off the first screen. */}
        {TYPES.map(({ tab, label, blurb, Icon, gradient }) => (
          <Link
            key={tab}
            href={buildExploreHref({ tab, sort_by: "popularity.desc", page: 1 })}
            aria-label={`Browse ${label}`}
            className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.08] px-4 shadow-md shadow-black/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.18] hover:shadow-xl sm:h-28 sm:px-6"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" aria-hidden />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-12 sm:w-12">
              <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={1.5} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-base font-semibold text-white sm:text-lg">{label}</span>
              <span className="hidden truncate text-xs text-white/60 sm:block">{blurb}</span>
            </span>
            <ArrowRight
              className="relative h-5 w-5 shrink-0 text-white/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
