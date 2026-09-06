import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TvPage } from "@/types/media";

import { EpisodeList } from "./episode-list";
import {
  CastRail,
  CompanyRow,
  Overview,
  Section,
  SimilarGrid,
  TitleHero,
  formatRuntime,
} from "./parts";
import { TrailerDialog } from "./trailer-dialog";

/**
 * TV detail page — the movie layout plus the two things a show needs and a
 * film doesn't: a season picker and an episode list.
 *
 * Season selection lives in the URL (`?season=N`) rather than client state, so
 * it's server-rendered, shareable, and works with the back button. The links
 * set `scroll={false}`, so switching seasons keeps you where you are instead
 * of throwing you back to the top of the page.
 */
export function TvDetailView({
  detail,
  cast,
  trailer,
  similar,
  seasons,
  selectedSeason,
  episodes,
}: TvPage) {
  const firstAired = detail.releaseDate?.slice(0, 4);
  const lastAired = detail.lastAirDate?.slice(0, 4);
  // "2019" for a single-year show, "2019 – 2023" for a finished run,
  // "2019 – " while it's still going.
  const years =
    firstAired && lastAired && firstAired !== lastAired
      ? `${firstAired} – ${lastAired}`
      : firstAired;

  const facts = [
    years,
    detail.seasons
      ? `${detail.seasons} season${detail.seasons === 1 ? "" : "s"}`
      : null,
    detail.episodes
      ? `${detail.episodes} episode${detail.episodes === 1 ? "" : "s"}`
      : null,
    detail.runtime ? `~${formatRuntime(detail.runtime)}` : null,
    detail.status,
  ].filter(Boolean) as string[];

  // Continue into the season the viewer is looking at, not always S1E1.
  const firstEpisode = episodes[0];
  const watchHref = `/watch/tv/${detail.id}?season=${selectedSeason}&episode=${
    firstEpisode?.episodeNumber ?? 1
  }`;

  return (
    <article className="-mx-1 sm:-mx-3 lg:-mx-4">
      <TitleHero
        detail={detail}
        facts={facts}
        actions={
          <>
            <Link
              href={watchHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch S{selectedSeason} E{firstEpisode?.episodeNumber ?? 1}
            </Link>
            {trailer ? (
              <TrailerDialog youtubeKey={trailer.key} title={detail.title} />
            ) : null}
          </>
        }
      >
        {detail.creators.length > 0 ? (
          <p className="text-sm text-white/55">
            Created by{" "}
            <span className="text-white/80">{detail.creators.join(", ")}</span>
          </p>
        ) : null}
      </TitleHero>

      <div className="space-y-14 px-4 pb-16 sm:px-8 lg:px-12">
        <Overview text={detail.overview} />

        {seasons.length > 0 ? (
          <Section
            title="Episodes"
            action={
              <SeasonPicker
                seasons={seasons}
                selected={selectedSeason}
                titleId={detail.id}
              />
            }
          >
            {episodes.length > 0 ? (
              <EpisodeList episodes={episodes} titleId={detail.id} />
            ) : (
              <p className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-8 text-center text-sm text-white/50">
                No episode details available for this season yet.
              </p>
            )}
          </Section>
        ) : null}

        <CastRail cast={cast} />
        <CompanyRow title="Networks" companies={detail.networks} />
        <CompanyRow title="Production" companies={detail.productionCompanies} />

        {detail.homepage ? (
          <a
            href={detail.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-from transition hover:opacity-80"
          >
            Official site
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}

        <SimilarGrid items={similar} title="More shows like this" />
      </div>
    </article>
  );
}

// ─────────────────────────── Season picker ───────────────────────────

/**
 * Horizontally scrollable pills. A `<select>` would be tidier for a 20-season
 * show, but pills make the number of seasons and where you are visible at a
 * glance without opening anything.
 */
function SeasonPicker({
  seasons,
  selected,
  titleId,
}: {
  seasons: TvPage["seasons"];
  selected: number;
  titleId: number;
}) {
  if (seasons.length <= 1) return null;

  return (
    <nav aria-label="Seasons" className="max-w-full">
      <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {seasons.map((season) => {
          const active = season.seasonNumber === selected;
          return (
            <li key={season.seasonNumber}>
              <Link
                href={`/tv/${titleId}?season=${season.seasonNumber}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-white/[0.12] bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {season.name}
                <span
                  className={cn(
                    "ml-2",
                    active ? "text-primary-foreground/70" : "text-white/40",
                  )}
                >
                  {season.episodeCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
