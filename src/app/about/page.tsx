import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InfoCard, InfoPage } from "@/features/company/info-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "About",
  description: "What Popcornly is and where its information comes from.",
  path: "/about",
});

const SECTIONS = [
  { title: "Movies", text: "Trending, now playing, top rated and every genre.", href: "/movies" },
  { title: "TV shows", text: "Seasons and episodes, with your place kept.", href: "/tv-shows" },
  { title: "Anime", text: "This season, what airs next and when.", href: "/anime" },
  { title: "Surprise", text: "Can't decide? Spin and let it choose.", href: "/surprise" },
  { title: "Your library", text: "Favourites, collections and watch history.", href: "/favourites" },
];

export default function AboutPage() {
  return (
    <InfoPage
      current="/about"
      title="About Popcornly"
      intro="One place to find something to watch: movies, TV shows and anime, organised so the next thing is never far away."
    >
      {/* What's inside, as a plain index: one row per section. */}
      <ul className="border-t border-white/[0.08]">
        {SECTIONS.map(({ title, text, href }) => (
          <li key={title} className="border-b border-white/[0.08]">
            <Link href={href} className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-5">
              <span className="w-full shrink-0 text-xl sm:w-36 font-semibold tracking-tight text-white transition-colors group-hover:text-primary">
                {title}
              </span>
              <span className="min-w-0 flex-1 text-[15px] text-white/55">{text}</span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 self-center text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      {/* The list above ends on a line; the first section must not add its own. */}
      <div className="pt-2 [&>section:first-child]:border-t-0">
      <InfoCard title="Where the information comes from">
        <p>
          Titles, artwork, cast and episode details come from{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
            TMDB
          </a>
          . Anime listings and airing times come from{" "}
          <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer">
            AniList
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p>
          Popcornly does not host any video. Players are embedded from third-party providers; see
          the <Link href="/terms">Terms</Link> for what that means.
        </p>
      </InfoCard>

      <InfoCard title="No account needed">
        <p>
          Browsing and watching work without signing in. An account only adds the personal parts:
          your history, favourites and collections. The <Link href="/privacy">Privacy</Link> page
          lists exactly what is stored.
        </p>
      </InfoCard>

      </div>

      <div className="border-t border-white/[0.08] pt-8">
        <Button asChild>
          <Link href="/">Start watching</Link>
        </Button>
      </div>
    </InfoPage>
  );
}
