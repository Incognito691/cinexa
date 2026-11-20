"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/**
 * Compact pagination — prev / numbered chips / next.
 * From 640px: a window of chips around the current page, with first / last
 * shortcuts. On phones: three pages only.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);

  // Compute the window of pages to render.
  const window = computeWindow(safePage, totalPages);
  // The three-page window for phones: previous, current, next, shifted at
  // either end so there are always three (or fewer, if that's all there is).
  const first = Math.max(1, Math.min(safePage - 1, totalPages - 2));
  const mobile = Array.from({ length: Math.min(3, totalPages) }, (_, i) => first + i);

  const chip = (entry: number | "…", idx: number) => {
    if (entry === "…") {
      return (
        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-white/40">
          …
        </span>
      );
    }
    const isActive = entry === safePage;
    return (
      <Link
        key={entry}
        href={buildHref(entry)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs font-medium transition",
          isActive
            ? "bg-primary text-white"
            : "text-white/65 hover:bg-white/[0.08] hover:text-white",
        )}
      >
        {entry}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex items-center justify-center gap-1.5 sm:flex-wrap sm:gap-2",
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-2",
        "shadow-md shadow-black/30",
      )}
    >
      <PaginationEdge
        href={buildHref(Math.max(1, safePage - 1))}
        disabled={safePage <= 1}
        label="Previous"
        icon={<ChevronLeft className="h-3.5 w-3.5" />}
      />

      {/* Phones: just three pages around the current one, so Previous, the
          numbers and Next always fit on a single line. */}
      <div className="contents sm:hidden">{mobile.map(chip)}</div>
      <div className="hidden sm:contents">{window.map(chip)}</div>

      <PaginationEdge
        href={buildHref(Math.min(totalPages, safePage + 1))}
        disabled={safePage >= totalPages}
        label="Next"
        trailing
        icon={<ChevronRight className="h-3.5 w-3.5" />}
      />
    </nav>
  );
}

function PaginationEdge({
  href,
  disabled,
  label,
  icon,
  trailing,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  trailing?: boolean;
}) {
  const className = cn(
    "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium transition",
    disabled
      ? "cursor-not-allowed text-white/30"
      : "text-white/75 hover:bg-white/[0.08] hover:text-white",
  );
  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {!trailing ? icon : null}
        <span className="hidden sm:inline">{label}</span>
        {trailing ? icon : null}
      </span>
    );
  }
  return (
    <Link href={href} className={className} aria-label={label}>
      {!trailing ? icon : null}
      <span className="hidden sm:inline">{label}</span>
      {trailing ? icon : null}
    </Link>
  );
}

/**
 * Returns the page numbers to render in the chip row.
 * Always shows at most 7 chips — current page in the middle when possible.
 */
function computeWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const window: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(total - 1, page + 1);

  if (left > 2) window.push("…");
  for (let p = left; p <= right; p++) window.push(p);
  if (right < total - 1) window.push("…");
  window.push(total);

  // Dedup consecutive ellipsis, dedup adjacent identical numbers.
  const dedup: (number | "…")[] = [];
  for (const v of window) {
    const last = dedup[dedup.length - 1];
    if (v === "…" && last === "…") continue;
    if (typeof v === "number" && last === v) continue;
    dedup.push(v);
  }
  return dedup;
}
