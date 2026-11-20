import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Lock, Play, Star } from "lucide-react";

import { MediaCard } from "@/components/media/media-card";
import { tmdbImage } from "@/lib/env";
import { cn } from "@/lib/utils";
import { releaseLabel } from "@/lib/release";
import type {
  CastMember,
  MediaCardItem,
  ProductionCompany,
  TitleDetail,
} from "@/types/media";

/**
 * Shared building blocks for the movie and TV detail pages.
 *
 * The two pages differ in their facts row and their middle sections (box
 * office vs. seasons); everything around that — hero frame, cast rail,
 * company logos, related grid — is identical, so it lives here rather than
 * being kept in sync by hand in two files.
 */

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/**
 * The hero frame: backdrop, scrims, poster, title block.
 * `facts` is the one-line metadata row; `actions` are the CTAs.
 */
export function TitleHero({
  detail,
  facts,
  actions,
  children,
}: {
  detail: TitleDetail;
  facts: string[];
  actions: React.ReactNode;
  children?: React.ReactNode;
}) {
  const backdrop = detail.backdropPath
    ? tmdbImage(detail.backdropPath, "original")
    : null;
  const poster = detail.posterPath ? tmdbImage(detail.posterPath, "w500") : null;
  const rating = detail.rating > 0 ? (detail.rating / 2).toFixed(1) : null;

  return (
    <header className="relative isolate mt-2 min-h-[520px] overflow-hidden rounded-t-2xl px-4 pb-10 pt-[20vh] sm:px-8 sm:pt-[24vh] lg:px-12">
      {backdrop ? (
        <Image
          src={backdrop}
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-10 object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a1a1a] to-black" />
      )}

      {/* Two scrims: vertical for text legibility, horizontal so the backdrop
          still reads as an image on wide screens. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/40 to-transparent"
      />

      <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
        <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-white/[0.12] shadow-2xl shadow-black/60 sm:w-48">
          {poster ? (
            <Image
              src={poster}
              alt={detail.title}
              fill
              sizes="208px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-white/[0.04]" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {detail.title}
            </h1>
            {detail.tagline ? (
              <p className="text-base italic text-white/55">{detail.tagline}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-white/65">
            {rating ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-white">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {rating}
                <span className="font-normal text-white/45">
                  · {detail.voteCount.toLocaleString()} votes
                </span>
              </span>
            ) : null}
            {facts.map((fact) => (
              <span key={fact} className="inline-flex items-center gap-2.5">
                <span aria-hidden className="h-1 w-1 rounded-full bg-white/25" />
                {fact}
              </span>
            ))}
          </div>

          {detail.genres.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {detail.genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-md bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-white/80"
                >
                  {genre}
                </li>
              ))}
            </ul>
          ) : null}

          {children}

          <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>
        </div>
      </div>
    </header>
  );
}

export function CastRail({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;
  return (
    <Section title="Cast">
      <ul className="scroll-slim -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {cast.map((member) => {
          const photo = member.profilePath
            ? tmdbImage(member.profilePath, "w185")
            : null;
          return (
            <li
              key={member.id}
              className="w-[116px] shrink-0 snap-start space-y-2"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="116px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="space-y-0.5">
                <p className="truncate text-xs font-medium text-white">
                  {member.name}
                </p>
                <p className="truncate text-[11px] text-white/45">
                  {member.character}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function CompanyRow({
  title,
  companies,
}: {
  title: string;
  companies: ProductionCompany[];
}) {
  if (companies.length === 0) return null;
  return (
    <Section title={title}>
      <ul className="flex flex-wrap gap-4">
        {companies.map((company) => {
          const logo = company.logoPath
            ? tmdbImage(company.logoPath, "w185")
            : null;
          return (
            <li key={company.id} className="w-36 space-y-2">
              {/* Real colours on a light tile. TMDB logos are mostly dark on
                  transparent; forcing them white made any logo with a filled
                  shape (a round badge, say) a featureless white blob. */}
              <div className="flex h-16 items-center justify-center rounded-xl bg-white/95 px-4">
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={112}
                    height={36}
                    className="max-h-9 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-center text-xs font-semibold leading-tight text-neutral-800">
                    {company.name}
                  </span>
                )}
              </div>
              {logo ? (
                <p className="truncate text-center text-[11px] text-white/55" title={company.name}>
                  {company.name}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function SimilarGrid({
  items,
  title = "More like this",
}: {
  items: MediaCardItem[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <Section title={title}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} layout="grid" />
        ))}
      </div>
    </Section>
  );
}

export function Overview({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Section title="Overview">
      <p className="max-w-3xl text-[15px] leading-relaxed text-white/70">
        {text}
      </p>
    </Section>
  );
}

export const formatRuntime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;

/**
 * The hero's primary action: a Watch link, or a locked pill when the title
 * isn't out, so an unreleased film never leads to an empty player.
 */
export function WatchAction({
  href,
  label,
  locked,
}: {
  href: string;
  label: string;
  /** Set (even with a null date) when the title is unreleased. */
  locked?: { releaseDate: string | null };
}) {
  if (locked) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-white/60"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Not released
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
    >
      <Play className="h-4 w-4 fill-current" />
      {label}
    </Link>
  );
}

/** "Not released" strip for the hero of a title that isn't out yet. */
export function ReleaseBanner({ releaseDate }: { releaseDate: string | null }) {
  const date = releaseLabel(releaseDate);
  return (
    <p className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2 text-sm text-amber-100">
      <Lock className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
      <span>
        <span className="font-semibold">Not released yet.</span>{" "}
        {date ? `Locked until it comes out on ${date}.` : "Locked until it comes out."}
      </span>
    </p>
  );
}

export interface DetailRow {
  label: string;
  /** Rows with no value are dropped, so callers can pass everything. */
  value: React.ReactNode;
  tone?: "up" | "down";
}

/**
 * The facts panel beside the overview: status, dates, money, as one quiet
 * list. Replaces a row of three large stat boxes, which gave budget and
 * revenue more weight than the film itself. Sticks while the column scrolls.
 */
export function DetailsCard({ rows, homepage }: { rows: DetailRow[]; homepage?: string | null }) {
  const shown = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
  if (shown.length === 0 && !homepage) return null;
  return (
    <aside className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold text-white">Details</h2>
      <dl className="mt-2 divide-y divide-white/[0.06]">
        {shown.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="shrink-0 text-white/50">{row.label}</dt>
            <dd
              className={cn(
                "text-right font-medium tabular-nums",
                row.tone === "up" ? "text-emerald-400" : row.tone === "down" ? "text-rose-400" : "text-white/90",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {homepage ? (
        <a
          href={homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Official site
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </aside>
  );
}

/** Two columns on wide screens: the reading column and the facts panel. */
export function DetailColumns({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-12">{main}</div>
      {aside}
    </div>
  );
}
