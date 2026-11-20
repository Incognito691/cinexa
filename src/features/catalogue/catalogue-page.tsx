import Image from "next/image";
import Link from "next/link";

import { MediaCard } from "@/components/media/media-card";
import { MediaRail } from "@/features/home";
import { tmdbImage } from "@/lib/env";
import { fetchDiscover, fetchTrending, type TmdbListResult } from "@/server/tmdb";
import type { MediaCardItem, MediaType } from "@/types/media";

/*
 * The Movies and TV Shows landing pages: a title over the week's #1 backdrop,
 * a numbered Top 10, then rails. Each rail's "View All" opens the full paged
 * grid at `<base>/all`.
 *
 * Server-only (it calls TMDB), so pages import this file directly.
 */

interface RailSpec {
  title: string;
  subtitle: string;
  /** Query string for the "View All" grid; "" for the default listing. */
  all: string;
  fetch: () => Promise<TmdbListResult>;
}

const discover = (type: MediaType, params: Partial<Parameters<typeof fetchDiscover>[0]>) => () =>
  fetchDiscover({ type, category: "popular", page: 1, ...params });

const CONFIG: Record<
  MediaType,
  { base: string; heading: string; noun: string; rails: RailSpec[] }
> = {
  movie: {
    base: "/movies",
    heading: "Movies",
    noun: "movies",
    rails: [
      { title: "Now Playing", subtitle: "In cinemas and fresh on streaming.", all: "?category=now_playing", fetch: discover("movie", { category: "now_playing" }) },
      { title: "Popular", subtitle: "What everyone is watching.", all: "", fetch: discover("movie", {}) },
      { title: "Top Rated", subtitle: "The best-reviewed films of all time.", all: "?category=top_rated", fetch: discover("movie", { category: "top_rated" }) },
      { title: "Action", subtitle: "Big, loud and fast.", all: "?genre=28", fetch: discover("movie", { withGenres: "28" }) },
      { title: "Comedy", subtitle: "For a lighter night.", all: "?genre=35", fetch: discover("movie", { withGenres: "35" }) },
      { title: "Horror", subtitle: "Lights off.", all: "?genre=27", fetch: discover("movie", { withGenres: "27" }) },
    ],
  },
  tv: {
    base: "/tv-shows",
    heading: "TV Shows",
    noun: "shows",
    rails: [
      { title: "On the Air", subtitle: "New episodes out now.", all: "?category=on_the_air", fetch: discover("tv", { category: "on_the_air" }) },
      { title: "Popular", subtitle: "What everyone is watching.", all: "", fetch: discover("tv", {}) },
      { title: "Top Rated", subtitle: "The best-reviewed series of all time.", all: "?category=top_rated", fetch: discover("tv", { category: "top_rated" }) },
      { title: "Drama", subtitle: "Stories to sink into.", all: "?genre=18", fetch: discover("tv", { withGenres: "18" }) },
      { title: "Comedy", subtitle: "Easy to binge.", all: "?genre=35", fetch: discover("tv", { withGenres: "35" }) },
      { title: "Crime", subtitle: "Detectives, heists and cold cases.", all: "?genre=80", fetch: discover("tv", { withGenres: "80" }) },
    ],
  },
};

/** One failing TMDB call costs its own rail, not the page. */
const safe = (fetcher: () => Promise<TmdbListResult>): Promise<MediaCardItem[]> =>
  fetcher().then(
    (r) => r.items,
    () => [],
  );

export async function CataloguePage({ type }: { type: MediaType }) {
  const { base, heading, rails } = CONFIG[type];

  const [trending, ...lists] = await Promise.all([
    safe(() => fetchTrending({ type, window: "week", page: 1 })),
    ...rails.map((rail) => safe(rail.fetch)),
  ]);

  const top = trending.slice(0, 10);
  const lead = top[0];
  const backdrop = tmdbImage(lead?.backdropPath, "w1280");

  return (
    <div className="relative isolate mx-auto w-full max-w-[1560px] space-y-10 pb-16 pt-2">
      {/* Atmosphere, not a hero: the #1 title's backdrop, dimmed and faded
          out behind the heading and the first row. Changes every week. */}
      {backdrop ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-2 -z-10 h-[460px] overflow-hidden rounded-2xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 15%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 15%, transparent 95%)",
          }}
        >
          <Image src={backdrop} alt="" fill priority unoptimized className="object-cover object-top opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
      ) : null}

      <header className="space-y-1.5 px-1 pt-6 sm:px-2">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{heading}</h1>
        {lead ? (
          <p className="text-sm text-white/60">
            #1 this week:{" "}
            <Link
              href={`/${lead.mediaType}/${lead.id}`}
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              {lead.title}
            </Link>
          </p>
        ) : null}
      </header>

      {top.length ? (
        <section className="space-y-4">
          <h2 className="px-1 text-xl font-semibold tracking-tight text-white sm:px-2 sm:text-2xl">
            Top 10 This Week
          </h2>
          {/* `pt-3 -mt-3`: headroom for the cards' hover lift (see MediaRail). */}
          <ol className="-mt-3 flex snap-x gap-2 overflow-x-auto pb-3 pt-3 scrollbar-hide">
            {top.map((item, i) => (
              <li key={`${item.mediaType}-${item.id}`} className="flex shrink-0 snap-start items-start">
                {/* Sized to the poster (180 × 1.5) so the numeral sits on its baseline. */}
                <span aria-hidden className="rank-numeral flex h-[270px] items-end">
                  {i + 1}
                </span>
                <div className="relative z-10 -ml-5">
                  <MediaCard item={item} width={180} priority={i < 5} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {rails.map((rail, i) =>
        // An empty rail renders as skeletons forever; skip it instead.
        lists[i].length ? (
          <MediaRail
            key={rail.title}
            title={rail.title}
            subtitle={rail.subtitle}
            seeAllHref={`${base}/all${rail.all}`}
            items={lists[i]}
            className="space-y-4"
          />
        ) : null,
      )}
    </div>
  );
}
