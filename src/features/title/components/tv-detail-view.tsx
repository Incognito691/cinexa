import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { LibraryButton } from "@/features/library";
import { cn } from "@/lib/utils";
import { isUnreleasedTitle } from "@/lib/release";
import type { NextAiring, TvPage } from "@/types/media";

import { cutAtNextEpisode } from "../lib/airing";
import { EpisodeList } from "./episode-list";
import {
  CastRail,
  CompanyRow,
  Overview,
  ReleaseBanner,
  Section,
  SimilarGrid,
  TitleHero,
  WatchAction,
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
  basePath,
  watchPath,
  nextAiring,
}: TvPage & {
  /** Where season links point. `/anime/:id/:slug` keeps anime on its own URL. */
  basePath?: string;
  /** Where episodes play. Anime passes `/anime/:id/:slug/watch`. */
  watchPath?: string;
  /** Exact next air time (anime, from AniList); TMDB alone only has dates. */
  nextAiring?: NextAiring | null;
}) {
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
  const playPath = watchPath ?? `/watch/tv/${detail.id}`;
  const watchHref = `${playPath}?season=${selectedSeason}&episode=${
    firstEpisode?.episodeNumber ?? 1
  }`;

  const locked = isUnreleasedTitle(detail) ? { releaseDate: detail.releaseDate } : undefined;

  const networks = detail.networks.map((n) => n.name).slice(0, 3).join(", ");

  return (
    <article className="mx-auto w-full max-w-[1560px]">
      <TitleHero
        detail={detail}
        facts={facts}
        actions={
          <>
            <WatchAction
              href={watchHref}
              label={`Watch S${selectedSeason} E${firstEpisode?.episodeNumber ?? 1}`}
              locked={locked}
            />
            {trailer ? (
              <TrailerDialog youtubeKey={trailer.key} title={detail.title} />
            ) : null}
            <LibraryButton
              kind="favourite"
              tmdbId={detail.id}
              mediaType="tv"
              title={detail.title}
              className="h-12 w-12 rounded-xl"
            />
            <LibraryButton
              kind="collected"
              tmdbId={detail.id}
              mediaType="tv"
              title={detail.title}
              className="h-12 w-12 rounded-xl"
            />
          </>
        }
      >
        {locked ? <ReleaseBanner releaseDate={locked.releaseDate} /> : null}
        {detail.creators.length > 0 ? (
          <p className="text-sm text-white/55">
            Created by{" "}
            <span className="text-white/80">{detail.creators.join(", ")}</span>
          </p>
        ) : null}
      </TitleHero>

      <div className="space-y-12 px-4 pb-16 sm:px-8 lg:px-12">
        {/* No facts panel or strip here: years, seasons, episode count,
            length and status are already in the line under the title, and
            repeating them in boxes was clutter. Only what that line lacks
            follows the overview. */}
        <div className="space-y-4">
          <Overview text={detail.overview} />
          {networks || detail.homepage ? (
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/55">
              {networks ? (
                <span>
                  Network <span className="font-medium text-white/85">{networks}</span>
                </span>
              ) : null}
              {detail.homepage ? (
                <a
                  href={detail.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Official site
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </p>
          ) : null}
        </div>

        {seasons.length > 0 ? (
          <Section title="Episodes">
            <SeasonPicker
              seasons={seasons}
              selected={selectedSeason}
              basePath={basePath ?? `/tv/${detail.id}`}
            />
            {episodes.length > 0 ? (
              <EpisodeList cut={cutAtNextEpisode(episodes, nextAiring)} watchPath={playPath} />
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
  basePath,
}: {
  seasons: TvPage["seasons"];
  selected: number;
  basePath: string;
}) {
  if (seasons.length <= 1) return null;

  // Plain text tabs on a hairline, the active one underlined in red. A boxed
  // bar of long season names ("Phantom Blood & Battle Tendency") was heavy,
  // and squeezed beside the heading it had nowhere to go.
  return (
    <nav aria-label="Seasons" className="border-b border-white/[0.08]">
      <ul className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
        {seasons.map((season) => {
          const active = season.seasonNumber === selected;
          return (
            <li key={season.seasonNumber} className="shrink-0">
              <Link
                href={`${basePath}?season=${season.seasonNumber}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-white"
                    : "border-transparent text-white/50 hover:text-white",
                )}
              >
                {season.name}
                <span className={cn("ml-1.5 text-xs", active ? "text-white/50" : "text-white/30")}>
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
