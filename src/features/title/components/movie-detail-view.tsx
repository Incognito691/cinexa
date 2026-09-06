import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MoviePage } from "@/types/media";

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
 * Movie detail page. Shares its frame with the TV page via `parts.tsx`; the
 * box-office block is the only thing unique to a film.
 */
export function MovieDetailView({ detail, cast, trailer, similar }: MoviePage) {
  const facts = [
    detail.releaseDate?.slice(0, 4),
    detail.runtime ? formatRuntime(detail.runtime) : null,
    detail.status,
  ].filter(Boolean) as string[];

  return (
    <article className="-mx-1 sm:-mx-3 lg:-mx-4">
      <TitleHero
        detail={detail}
        facts={facts}
        actions={
          <>
            <Link
              href={`/watch/movie/${detail.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Movie
            </Link>
            {trailer ? (
              <TrailerDialog youtubeKey={trailer.key} title={detail.title} />
            ) : null}
          </>
        }
      />

      <div className="space-y-14 px-4 pb-16 sm:px-8 lg:px-12">
        <Overview text={detail.overview} />
        <BoxOffice budget={detail.budget} revenue={detail.revenue} />
        <CastRail cast={cast} />
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

        <SimilarGrid items={similar} />
      </div>
    </article>
  );
}

/**
 * Budget / revenue / profit. Hidden entirely when TMDB has neither figure,
 * which is common for smaller films — an empty row of dashes is worse than
 * no row at all.
 */
function BoxOffice({
  budget,
  revenue,
}: {
  budget: number | null;
  revenue: number | null;
}) {
  if (budget == null && revenue == null) return null;

  const profit = budget != null && revenue != null ? revenue - budget : null;
  const profitable = profit != null && profit >= 0;

  return (
    <Section title="Box office">
      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label="Budget" value={budget != null ? money(budget) : "—"} />
        <Stat label="Revenue" value={revenue != null ? money(revenue) : "—"} />
        <Stat
          label={profitable ? "Profit" : "Loss"}
          value={profit != null ? money(Math.abs(profit)) : "—"}
          tone={profit == null ? undefined : profitable ? "up" : "down"}
          hint={
            profit != null && budget
              ? `${((revenue! / budget) * 100).toFixed(0)}% of budget recouped`
              : undefined
          }
        />
      </dl>
    </Section>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
      <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums",
          tone === "up" && "text-emerald-400",
          tone === "down" && "text-rose-400",
          !tone && "text-white",
        )}
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
