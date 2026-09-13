import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ContinueCard as CardData } from "../lib/entries";

/**
 * A wide 16:9 card: artwork, progress bar, and where you got to.
 *
 * Not `MediaCard`: this is the one surface where the *position* is the point,
 * so it's landscape (a backdrop reads as "a thing you were watching" where a
 * poster reads as "a thing in a catalogue") and the meta line is time left
 * rather than a year.
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
        className="card-frame block hover:-translate-y-1.5"
      >
        <div className="card-face bg-surface-container-low">
        <div className="relative aspect-video w-full overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/40 transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </div>

          {/* No bar at all when the runtime is unknown — an empty track would
              read as "0% watched", which is a different claim. */}
          {percent !== null ? (
            <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary-container"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[10px] font-medium tabular-nums text-white/80">
                {percent}%
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-1 px-4 py-3">
          <p className="line-clamp-1 text-sm font-semibold text-white">
            {card.title}
          </p>
          <p className="text-xs text-white/55">
            {[card.label, card.timeLeft].filter(Boolean).join(" · ")}
          </p>
        </div>
        </div>
      </Link>
    </article>
  );
}
