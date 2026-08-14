import Link from "next/link";
import { Facebook, Film, Instagram, Twitter, Youtube } from "lucide-react";

const footerColumns = [
  {
    title: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Movies", href: "/explore?tab=movies" },
      { label: "TV Shows", href: "/explore?tab=tv" },
      { label: "Continue Watching", href: "/continue-watching" },
    ],
  },
  {
    title: "Library",
    links: [
      { label: "Favourites", href: "/favourites" },
      { label: "My Collections", href: "/my-collection" },
      { label: "Genres", href: "/explore" },
      { label: "Trending", href: "/explore?tab=movies&category=popular" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/support" },
      { label: "Support", href: "/support" },
      { label: "Privacy", href: "/support" },
      { label: "Terms", href: "/support" },
    ],
  },
];

const socials = [
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
];

/**
 * Minimal Stitch-style footer.
 *
 * 4-column grid on desktop: brand + tagline | Browse | Library | Company.
 * Soft hairline divider + © row at the bottom. The brand mark keeps the
 *   purple/pink gradient because the user explicitly asked to keep the
 *   sidebar's identity — the rest of the page follows the Stitch red theme.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden rounded-stitch-xl border border-white/[0.06] bg-surface-container-lowest/60 px-6 py-10 backdrop-blur-xl sm:px-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand + tagline */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-brand-from/30 ring-1 ring-white/10">
              <Film className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Cinexa
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-white/55">
            Premium movies and TV, hand-picked every week. Built for the love
            of cinema.
          </p>

          <div className="flex items-center gap-2">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 backdrop-blur transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
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
        <p>© {new Date().getFullYear()} Cinexa. All rights reserved.</p>
        <p className="text-white/40">
          Powered by{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            TMDB
          </span>
        </p>
      </div>
    </footer>
  );
}