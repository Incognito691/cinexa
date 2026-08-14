import Link from "next/link";
import {
  Atom,
  Drama,
  Ghost,
  Sword,
  Smile,
  Crosshair,
  type LucideIcon,
} from "lucide-react";

import { buildExploreHref } from "@/lib/explore-presets";

interface GenreTile {
  id: number;
  slug: string;
  label: string;
  tab: "movies" | "tv";
  Icon: LucideIcon;
  /** Tailwind gradient stops for the tile background. */
  gradient: string;
}

const GENRES: readonly GenreTile[] = [
  { id: 28, slug: "action", label: "Action", tab: "movies", Icon: Sword, gradient: "from-red-500/40 via-orange-500/30 to-amber-500/20" },
  { id: 18, slug: "drama", label: "Drama", tab: "movies", Icon: Drama, gradient: "from-violet-500/40 via-fuchsia-500/30 to-pink-500/20" },
  { id: 35, slug: "comedy", label: "Comedy", tab: "movies", Icon: Smile, gradient: "from-yellow-400/40 via-amber-400/30 to-orange-300/20" },
  { id: 27, slug: "horror", label: "Horror", tab: "movies", Icon: Ghost, gradient: "from-slate-700/60 via-zinc-800/50 to-black/40" },
  { id: 878, slug: "scifi", label: "Sci-Fi", tab: "movies", Icon: Atom, gradient: "from-cyan-500/40 via-blue-500/30 to-indigo-500/20" },
  { id: 53, slug: "thriller", label: "Thriller", tab: "movies", Icon: Crosshair, gradient: "from-emerald-500/40 via-teal-500/30 to-cyan-500/20" },
] as const;

/**
 * "Browse by Genre" — six cinematic tiles in the Stitch layout.
 *
 * Each tile is a tall 2:3 card with a gradient + iconography backdrop and
 * a label at the bottom. The image is a gradient placeholder today — swap
 * in real TMDB/Unsplash backdrops by editing this file.
 */
export function BrowseByGenre() {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">Browse by Genre</h2>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {GENRES.map(({ id, label, tab, Icon, gradient }) => {
          const href = buildExploreHref({ tab, genre: id, page: 1 });
          return (
            <Link
              key={id}
              href={href}
              aria-label={`Browse ${label}`}
              className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.08] shadow-md shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-xl"
            >
              {/* Gradient backdrop */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
                aria-hidden
              />
              {/* Dark overlay so label is always legible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" aria-hidden />
              {/* Decorative icon */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-30 transition-opacity duration-300 group-hover:opacity-60">
                <Icon className="h-12 w-12 text-white" strokeWidth={1.25} />
              </div>
              {/* Label */}
              <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-12">
                <p className="text-base font-semibold text-white">{label}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
