import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ContinueCard as CardData } from "../lib/entries";

/**
 * A wide 16:9 still with everything on it: what it is, how much is left, and
 * a progress line along the bottom edge.
 *
 * Not `MediaCard`: this is the one surface where the *position* is the point,
 * so it's landscape (a backdrop reads as "a thing you were watching" where a
 * poster reads as "a thing in a catalogue"). The text sits on the image
 * rather than in a panel under it, so the card is one piece, and the play
 * button only appears on hover instead of covering every thumbnail.
 */
export function ContinueCard({
  card,
  className,
}: {
  card: CardData;
  className?: string;
}) {
  const percent = card.ratio === null ? null : Math.round(card.ratio * 100);
  const art = card.backdropUrl ?? card.posterUrl;

  return (
    <article className={cn("group", className)}>
      <Link
        href={card.href}
        aria-label={`Resume ${card.title}`}
        className="relative block aspect-video overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-white/[0.08] transition duration-300 hover:-translate-y-1 hover:ring-white/25"
      >
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 340px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b1b] via-[#0e0e0e] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        {/* "S1 · E2" or "Movie" */}
        <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-[11px] font-semibold text-white/90">
          {card.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5 pb-4">
          <div className="min-w-0">
            <p className="line-clamp-1 text-[15px] font-semibold text-white">{card.title}</p>
            {card.timeLeft ? (
              <p className="mt-0.5 text-xs text-white/65">{card.timeLeft}</p>
            ) : null}
          </div>
          <span className="flex h-9 w-9 shrink-0 translate-y-1 items-center justify-center rounded-full bg-white text-black opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </div>

        {/* Progress along the bottom edge. No line at all when the runtime is
            unknown: an empty track would read as "0% watched". */}
        {percent !== null ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
            <div className="h-full bg-primary" style={{ width: `${Math.max(2, percent)}%` }} />
          </div>
        ) : null}
      </Link>
    </article>
  );
}
