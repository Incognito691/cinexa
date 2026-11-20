import Link from "next/link";

import { cn } from "@/lib/utils";

/*
 * Shared frame for the About, Support, Privacy and Terms pages.
 *
 * Laid out like a document, not a landing page: a side index on the left,
 * a left-aligned title, then numbered sections separated by hairlines. No
 * centred hero, no icon tiles, no card grid. The only decoration is one soft
 * red light behind the title.
 */

const PAGES = [
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function InfoPage({
  current,
  title,
  intro,
  updated,
  children,
}: {
  current: (typeof PAGES)[number]["href"];
  title: string;
  intro: string;
  /** "Last updated" date, for the legal pages. */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate mx-auto grid w-full max-w-5xl gap-x-14 gap-y-8 pb-24 pt-6 lg:grid-cols-[150px_minmax(0,1fr)]">
      {/* One soft, still light behind the title. A background on a layer the
          size of the page, so it cannot add scroll area. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            // Centre 220px down with a 220px vertical radius: it fades to nothing
            // exactly at the layer's top edge, so there is no cut-off line.
            "radial-gradient(360px 220px at 380px 220px, rgb(229 9 20 / 0.16), transparent)",
        }}
      />

      <nav aria-label="Company pages" className="lg:sticky lg:top-24 lg:h-fit lg:pt-3">
        <ul className="flex gap-5 border-b border-white/[0.08] pb-3 lg:flex-col lg:gap-1 lg:border-b-0 lg:border-l lg:pb-0">
          {PAGES.map((page) => {
            const active = page.href === current;
            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block text-sm transition-colors lg:-ml-px lg:border-l lg:py-1.5 lg:pl-4",
                    active
                      ? "font-medium text-white lg:border-primary"
                      : "text-white/45 hover:text-white lg:border-transparent",
                  )}
                >
                  {page.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">
        <header className="max-w-2xl pb-10">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/60">{intro}</p>
          {updated ? <p className="mt-4 text-sm text-white/35">Last updated {updated}</p> : null}
        </header>

        {/* Sections number themselves: 01, 02, … */}
        <div className="[counter-reset:section]">{children}</div>
      </div>
    </div>
  );
}

/** One numbered section: its title in a narrow left column, the text beside it. */
export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-3 border-t border-white/[0.08] py-8 [counter-increment:section] md:grid-cols-[220px_minmax(0,1fr)]">
      <h2 className="text-base font-semibold text-white">
        <span className="mb-1 block text-xs font-medium tabular-nums text-primary before:content-[counter(section,decimal-leading-zero)]" />
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-white/65 [&_a]:text-white [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-white [&_li]:ml-4 [&_li]:list-disc [&_li]:marker:text-white/30 [&_strong]:font-medium [&_strong]:text-white/90 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
