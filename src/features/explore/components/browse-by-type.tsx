import Link from "next/link";
import { Clapperboard, Sparkles, Tv, type LucideIcon } from "lucide-react";

import { buildExploreHref } from "../lib/presets";

interface TypeTile {
  tab: "movies" | "tv" | "anime";
  label: string;
  Icon: LucideIcon;
  gradient: string;
}

const TYPES: readonly TypeTile[] = [
  { tab: "movies", label: "Movies", Icon: Clapperboard, gradient: "from-rose-500/40 via-red-500/30 to-orange-500/20" },
  { tab: "tv", label: "TV Shows", Icon: Tv, gradient: "from-sky-500/40 via-blue-500/30 to-indigo-500/20" },
  { tab: "anime", label: "Anime", Icon: Sparkles, gradient: "from-fuchsia-500/40 via-purple-500/30 to-violet-500/20" },
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

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {TYPES.map(({ tab, label, Icon, gradient }) => (
          <Link
            key={tab}
            href={buildExploreHref({ tab, sort_by: "popularity.desc", page: 1 })}
            aria-label={`Browse ${label}`}
            className="group relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/[0.08] shadow-md shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-xl sm:aspect-[2/1]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" aria-hidden />
            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center opacity-30 transition-opacity duration-300 group-hover:opacity-60">
              <Icon className="h-10 w-10 text-white" strokeWidth={1.25} />
            </div>
            <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10">
              <p className="text-base font-semibold text-white">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
