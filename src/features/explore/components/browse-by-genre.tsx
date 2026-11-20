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

import { buildExploreHref } from "../lib/presets";

interface GenreTile {
  id: number;
  slug: string;
  label: string;
  tab: "movies" | "tv";
  Icon: LucideIcon;
}

const GENRES: readonly GenreTile[] = [
  { id: 28, slug: "action", label: "Action", tab: "movies", Icon: Sword },
  { id: 18, slug: "drama", label: "Drama", tab: "movies", Icon: Drama },
  { id: 35, slug: "comedy", label: "Comedy", tab: "movies", Icon: Smile },
  { id: 27, slug: "horror", label: "Horror", tab: "movies", Icon: Ghost },
  { id: 878, slug: "scifi", label: "Sci-Fi", tab: "movies", Icon: Atom },
  { id: 53, slug: "thriller", label: "Thriller", tab: "movies", Icon: Crosshair },
] as const;

/**
 * "Browse by Genre": six quiet tiles, icon and label.
 *
 * One neutral surface for all of them. They used to be tall cards, each with
 * its own colour gradient, which made a six-colour rainbow that had nothing
 * to do with the rest of the palette.
 */
export function BrowseByGenre() {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">Browse by Genre</h2>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {GENRES.map(({ id, label, tab, Icon }) => (
          <Link
            key={id}
            href={buildExploreHref({ tab, genre: id, page: 1 })}
            aria-label={`Browse ${label}`}
            className="group flex h-14 items-center sm:h-20 gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 transition-colors duration-200 hover:border-white/[0.16] hover:bg-white/[0.07]"
          >
            <Icon
              className="h-5 w-5 shrink-0 text-white/45 transition-colors duration-200 group-hover:text-primary"
              strokeWidth={1.5}
            />
            <span className="text-sm font-medium text-white/85 group-hover:text-white">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
