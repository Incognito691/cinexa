
import { LibraryButton } from "@/features/library";
import { isUnreleasedTitle } from "@/lib/release";
import type { MoviePage } from "@/types/media";

import {
  CastRail,
  CompanyRow,
  DetailColumns,
  type DetailRow,
  DetailsCard,
  Overview,
  ReleaseBanner,
  SimilarGrid,
  TitleHero,
  WatchAction,
  formatDate,
  formatRuntime,
} from "./parts";
import { TrailerDialog } from "./trailer-dialog";

/**
 * Movie detail page. Shares its frame with the TV page via `parts.tsx`; the
 * box-office block is the only thing unique to a film.
 */
export function MovieDetailView({
  detail,
  cast,
  trailer,
  similar,
  watchPath,
}: MoviePage & {
  /** Where the film plays. Anime films pass `/anime/:id/:slug/watch`. */
  watchPath?: string;
}) {
  const facts = [
    detail.releaseDate?.slice(0, 4),
    detail.runtime ? formatRuntime(detail.runtime) : null,
    detail.status,
  ].filter(Boolean) as string[];

  const locked = isUnreleasedTitle(detail) ? { releaseDate: detail.releaseDate } : undefined;

  // Only figures TMDB itself reports, shown as-is; an unknown one is null
  // (normalised from TMDB's 0) and its row is dropped. There is deliberately
  // no "profit" row: revenue minus budget ignores marketing and the cinemas'
  // share, so it was a number we made up, not one anyone reported. Revenue
  // is never shown before release.
  const rows: DetailRow[] = [
    { label: "Status", value: detail.status },
    { label: "Release date", value: formatDate(detail.releaseDate) },
    { label: "Runtime", value: detail.runtime ? formatRuntime(detail.runtime) : null },
    { label: "Budget", value: detail.budget != null ? money(detail.budget) : null },
    {
      label: "Worldwide gross",
      value: !locked && detail.revenue != null ? money(detail.revenue) : null,
    },
  ];

  return (
    <article className="mx-auto w-full max-w-[1560px]">
      <TitleHero
        detail={detail}
        facts={facts}
        actions={
          <>
            <WatchAction
              href={watchPath ?? `/watch/movie/${detail.id}`}
              label="Watch Movie"
              locked={locked}
            />
            {trailer ? (
              <TrailerDialog youtubeKey={trailer.key} title={detail.title} />
            ) : null}
            <LibraryButton
              kind="favourite"
              tmdbId={detail.id}
              mediaType="movie"
              title={detail.title}
              className="h-12 w-12 rounded-xl"
            />
            <LibraryButton
              kind="collected"
              tmdbId={detail.id}
              mediaType="movie"
              title={detail.title}
              className="h-12 w-12 rounded-xl"
            />
          </>
        }
      >
        {locked ? <ReleaseBanner releaseDate={locked.releaseDate} /> : null}
      </TitleHero>

      <div className="space-y-12 px-4 pb-16 sm:px-8 lg:px-12">
        <DetailColumns
          main={
            <>
              <Overview text={detail.overview} />
              <CastRail cast={cast} />
            </>
          }
          aside={<DetailsCard rows={rows} homepage={detail.homepage} />}
        />
        <CompanyRow title="Production" companies={detail.productionCompanies} />
        <SimilarGrid items={similar} />
      </div>
    </article>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
