import Link from "next/link";

import { EXPLORE_PRESETS } from "@/lib/explore-presets";

/**
 * Row of glass-pill quick-filter chips rendered under the search bar.
 *
 * Each chip links to a curated /explore?... URL (see `explore-presets.ts`).
 * Pills use `label-caps` typography so they sit visually distinct from
 * body text — same micro-typography the design system reserves for
 * metadata chips.
 */
export function QuickFilterChips() {
  return (
    <nav aria-label="Quick filters" className="flex flex-wrap justify-center gap-2">
      {EXPLORE_PRESETS.map((preset) => (
        <Link
          key={preset.id}
          href={preset.href}
          className="inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition hover:border-white/[0.24] hover:bg-white/[0.08] hover:text-white"
        >
          {preset.label}
        </Link>
      ))}
    </nav>
  );
}
