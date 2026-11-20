import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/logo";

const footerColumns = [
  {
    title: "Browse",
    links: [
      { label: "Movies", href: "/movies" },
      { label: "TV Shows", href: "/tv-shows" },
      { label: "Anime", href: "/anime" },
      { label: "Explore", href: "/explore" },
    ],
  },
  {
    title: "Library",
    links: [
      { label: "Favourites", href: "/favourites" },
      { label: "My Collections", href: "/my-collection" },
      { label: "Continue Watching", href: "/continue-watching" },
      { label: "Surprise me", href: "/surprise" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/support" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/**
 * Minimal Stitch-style footer.
 *
 * 4-column grid on desktop: brand + tagline | Browse | Library | Company.
 * Soft hairline divider + © row at the bottom.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden rounded-stitch-xl border border-white/[0.06] bg-surface-container-lowest/60 px-6 py-10 backdrop-blur-xl sm:px-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand + tagline */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <Wordmark className="text-xl" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-white/55">
            Premium movies and TV, hand-picked every week. Built for the love
            of cinema.
          </p>

        </div>

        {/* Link columns */}
        {footerColumns.map((col) => (
          <div key={col.title} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={`${col.title}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-white/45 sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Popcornly. All rights reserved.</p>
      </div>
    </footer>
  );
}