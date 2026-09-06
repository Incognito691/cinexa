import Link from "next/link";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaCardItem, TvEpisode } from "@/types/media";

import type { PlaybackTarget } from "../lib/sources";
import { WatchPlayer } from "./watch-player";
import { SimilarGrid } from "@/features/title/components/parts";

interface WatchViewProps {
  target: PlaybackTarget;
  title: string;
  /** e.g. "S1 · E3 · Spoonful" — the line under the title. */
  subtitle?: string;
  /** Where the "details" link goes. */
  detailHref: string;
  similar: MediaCardItem[];
  /** TV only — powers the episode strip and prev/next. */
  episodes?: TvEpisode[];
  currentEpisode?: number;
}

/**
 * The watch page: player first, everything else under it.
 *
 * Nothing here is heavier than it needs to be — the point of the page is the
 * picture, so metadata is a single line and the rest is navigation.
 */
export function WatchView({
  target,
  title,
  subtitle,
  detailHref,
  similar,
  episodes,
  currentEpisode,
}: WatchViewProps) {
  const index = episodes?.findIndex((e) => e.episodeNumber === currentEpisode);
  const prev =
    episodes && index != null && index > 0 ? episodes[index - 1] : undefined;
  const next =
    episodes && index != null && index >= 0 && index < episodes.length - 1
      ? episodes[index + 1]
      : undefined;

  const episodeHref = (episodeNumber: number) =>
    `/watch/tv/${target.tmdbId}?season=${target.season ?? 1}&episode=${episodeNumber}`;

  return (
    <div className="-mx-1 space-y-8 pb-16 sm:-mx-3 lg:-mx-4">
      <WatchPlayer target={target} title={title} />

      <div className="mx-auto max-w-[1400px] space-y-10 px-4 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-white/55">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {prev ? (
              <Link
                href={episodeHref(prev.episodeNumber)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/75 transition hover:border-white/25 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Previous
              </Link>
            ) : null}
            {next ? (
              <Link
                href={episodeHref(next.episodeNumber)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Next episode
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : null}
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/75 transition hover:border-white/25 hover:text-white"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
              Details
            </Link>
          </div>
        </header>

        {episodes && episodes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white/80">
              Season {target.season ?? 1}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {episodes.map((episode) => {
                const active = episode.episodeNumber === currentEpisode;
                return (
                  <li key={episode.id}>
                    <Link
                      href={episodeHref(episode.episodeNumber)}
                      aria-current={active ? "page" : undefined}
                      title={episode.name}
                      className={cn(
                        "block min-w-[3rem] rounded-lg border px-3 py-2 text-center text-xs font-medium transition",
                        active
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-white/[0.1] bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
                      )}
                    >
                      {episode.episodeNumber}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <SimilarGrid
          items={similar}
          title={target.mediaType === "movie" ? "More like this" : "More shows like this"}
        />
      </div>
    </div>
  );
}
