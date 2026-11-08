import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { animeHref } from "@/lib/anime-slug";
import type { AnimeItem } from "@/types/anime";

/** "TV_SHORT" → "TV Short", "OVA" stays "OVA". */
export const formatLabel = (format: string | null) =>
  !format
    ? null
    : format.length <= 3
      ? format
      : format
          .split("_")
          .map((w) => (w.length <= 2 ? w : w[0] + w.slice(1).toLowerCase()))
          .join(" ");

/** AniList scores are out of 100; the rest of the site shows stars out of 5. */
export const stars = (score: number | null) => (score ? (score / 20).toFixed(1) : null);

/**
 * Poster card for an AniList title. Links to `/anime/:id/:slug`, which renders
 * the matching TMDB page in place. `prefetch={false}` because that resolution
 * isn't free, and a rail of twenty in view would run twenty of them.
 */
export function AnimeCard({ item }: { item: AnimeItem }) {
  const rating = stars(item.score);
  const format = formatLabel(item.format);

  return (
    <Link
      href={animeHref(item.id, item.title)}
      prefetch={false}
      className="group block w-[150px] shrink-0 snap-start sm:w-[180px]"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:-translate-y-1"
        style={{ boxShadow: item.color ? `0 12px 30px -14px ${item.color}` : undefined }}
      >
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.title}
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        {format ? (
          <span className="absolute left-2 top-2 rounded-md border border-white/15 bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {format}
          </span>
        ) : null}
        {rating ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300">
            <Star className="h-2.5 w-2.5 fill-yellow-300" aria-hidden />
            {rating}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90 group-hover:text-white">
        {item.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-white/45">
        {[item.seasonYear, item.studio].filter(Boolean).join(" · ") || " "}
      </p>
    </Link>
  );
}
