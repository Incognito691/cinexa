import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Play, Star } from "lucide-react";

import { AiringTime } from "@/components/airing-time";
import { Button } from "@/components/ui/button";
import { animeHref } from "@/lib/anime-slug";
import type { AnimeHome, AnimeItem } from "@/types/anime";

import { AnimeCard, formatLabel, stars } from "./anime-card";

/** The `/anime` page: hero, airing schedule, then the rails. */
export function AnimeView({ data }: { data: AnimeHome }) {
  // The #1 trending title often has no banner yet; take the first that does.
  const hero = data.trending.find((i) => i.banner) ?? data.trending[0];

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-12 pb-16 pt-2">
      {hero ? <Hero item={hero} /> : null}
      {data.airing.length ? <AiringNext items={data.airing.slice(0, 8)} /> : null}
      <Rail title={`This season · ${data.seasonLabel}`} items={data.season} />
      <Rail title="Trending now" items={data.trending} />
      <Rail title="Top rated of all time" items={data.top} />
      <Rail title="Popular anime movies" items={data.movies} />
    </div>
  );
}

function Hero({ item }: { item: AnimeItem }) {
  const rating = stars(item.score);
  const meta = [
    formatLabel(item.format),
    item.seasonYear,
    item.episodes ? `${item.episodes} episodes` : null,
    item.studio,
  ].filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0b0b]">
      {item.banner ? (
        <Image
          src={item.banner}
          alt=""
          fill
          priority
          unoptimized
          className="-z-10 object-cover opacity-60"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/80 to-black/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

      <div className="flex flex-col gap-8 p-6 sm:p-10 md:flex-row md:items-end lg:p-14">
        {item.cover ? (
          <div
            className="relative hidden aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl border border-white/15 md:block lg:w-56"
            style={{ boxShadow: item.color ? `0 25px 60px -20px ${item.color}` : undefined }}
          >
            <Image src={item.cover} alt={item.title} fill unoptimized className="object-cover" />
          </div>
        ) : null}

        <div className="max-w-2xl space-y-5">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            #1 trending anime
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/65">
            {rating ? (
              <span className="inline-flex items-center gap-1 font-semibold text-yellow-300">
                <Star className="h-4 w-4 fill-yellow-300" aria-hidden /> {rating}
              </span>
            ) : null}
            {meta.map((m) => (
              <span key={String(m)}>{m}</span>
            ))}
          </div>
          {item.genres.length ? (
            <div className="flex flex-wrap gap-2">
              {item.genres.slice(0, 4).map((g) => (
                <span key={g} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/75">
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          {item.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-white/60 sm:text-base">
              {item.description}
            </p>
          ) : null}
          <Button asChild size="lg">
            <Link href={animeHref(item.id, item.title)} prefetch={false}>
              <Play className="fill-current" aria-hidden /> Watch now
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function AiringNext({ items }: { items: AnimeItem[] }) {
  return (
    <section className="space-y-5">
      <SectionTitle icon={<CalendarClock className="h-5 w-5 text-primary" aria-hidden />}>
        Airing next
      </SectionTitle>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={animeHref(item.id, item.title)}
            prefetch={false}
            className="flex w-[280px] shrink-0 snap-start items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
              {item.cover ? <Image src={item.cover} alt="" fill unoptimized className="object-cover" /> : null}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
              <p className="text-xs font-semibold text-primary">Episode {item.nextEpisode!.episode}</p>
              <p className="truncate text-xs text-white/50">
                <AiringTime at={item.nextEpisode!.airingAt} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Rail({ title, items }: { title: string; items: AnimeItem[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-5">
      <SectionTitle>{title}</SectionTitle>
      <div className="-mt-2 flex snap-x gap-4 overflow-x-auto pb-2 pt-2 scrollbar-hide sm:gap-5">
        {items.map((item) => (
          <AnimeCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
      {icon}
      {children}
    </h2>
  );
}
