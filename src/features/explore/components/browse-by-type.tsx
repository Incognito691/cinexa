import Link from "next/link";
import { ArrowRight, Clapperboard, Tv, type LucideIcon } from "lucide-react";


interface TypeTile {
  tab: "movies" | "tv";
  label: string;
  blurb: string;
  Icon: LucideIcon;
}

const TYPES: readonly TypeTile[] = [
  { tab: "movies", label: "Movies", blurb: "Films from every genre and decade", Icon: Clapperboard },
  { tab: "tv", label: "TV Shows", blurb: "Series to binge, new and classic", Icon: Tv },
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* Short banners rather than 2:1 cards: at two per row a 2:1 card
            was ~330px tall and pushed the section off the first screen. */}
        {TYPES.map(({ tab, label, blurb, Icon }) => (
          <Link
            key={tab}
            href={tab === "movies" ? "/movies" : "/tv-shows"}
            aria-label={`Browse ${label}`}
            className="group flex h-24 items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 transition-colors duration-200 hover:border-white/[0.16] hover:bg-white/[0.07] sm:h-28 sm:px-6"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.12] sm:h-12 sm:w-12">
              <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-white sm:text-lg">{label}</span>
              <span className="block truncate text-xs text-white/60">{blurb}</span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
