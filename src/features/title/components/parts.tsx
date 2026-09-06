import Image from "next/image";
import { Star } from "lucide-react";

import { MediaCard } from "@/components/media/media-card";
import { tmdbImage } from "@/lib/env";
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
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
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
    <header className="relative isolate min-h-[560px] overflow-hidden px-4 pb-10 pt-[22vh] sm:px-8 sm:pt-[26vh] lg:px-12">
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
        <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/60 sm:w-52">
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/65">
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
              <span key={fact} className="inline-flex items-center gap-4">
                <span aria-hidden className="text-white/20">
                  /
                </span>
                {fact}
              </span>
            ))}
          </div>

          {detail.genres.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {detail.genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md"
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
      <ul className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
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
      <ul className="flex flex-wrap items-center gap-3">
        {companies.map((company) => {
          const logo = company.logoPath
            ? tmdbImage(company.logoPath, "w185")
            : null;
          return (
            <li
              key={company.id}
              className="flex h-16 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4"
            >
              {logo ? (
                <Image
                  src={logo}
                  alt={company.name}
                  width={72}
                  height={32}
                  // TMDB logos are mostly dark-on-transparent; the invert keeps
                  // them visible on a dark card.
                  className="h-8 w-auto object-contain opacity-80 [filter:brightness(0)_invert(1)]"
                />
              ) : (
                <span className="text-sm font-medium text-white/80">
                  {company.name}
                </span>
              )}
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
