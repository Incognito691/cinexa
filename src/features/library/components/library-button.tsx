"use client";

import Link from "next/link";
import { FolderCheck, FolderPlus, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/media";

import { useLibraryState, type LibraryKind } from "../hooks";

/**
 * The heart and the add-to-collection control — one component, because they
 * differ only in icon and wording. Splitting them would duplicate the
 * optimistic-toggle wiring twice over.
 *
 * `icon` is the 36px circle on a poster card's hover row; `pill` is the
 * labelled button that sits beside Watch on a detail page.
 *
 * Signed out it renders a link to sign-in rather than a button that silently
 * does nothing — the server action is a no-op without a session, and a control
 * that looks clickable but never changes is worse than an honest prompt.
 */

const CONFIG = {
  favourite: {
    Icon: Heart,
    IconSaved: Heart,
    label: "Favourite",
    labelSaved: "Favourited",
    signedOutLabel: "Sign in to save favourites",
    savedClass: "border-rose-400/50 bg-rose-500/20 text-rose-300",
  },
  collected: {
    Icon: FolderPlus,
    IconSaved: FolderCheck,
    label: "Add to collection",
    labelSaved: "In collection",
    signedOutLabel: "Sign in to build a collection",
    savedClass: "border-brand-from/50 bg-brand-from/20 text-brand-from",
  },
} as const;

interface LibraryButtonProps {
  kind: LibraryKind;
  tmdbId: number;
  mediaType: MediaType;
  /** Used in the accessible label, e.g. "Favourite Reacher". */
  title: string;
  variant?: "icon" | "pill";
  className?: string;
}

export function LibraryButton({
  kind,
  tmdbId,
  mediaType,
  title,
  variant = "icon",
  className,
}: LibraryButtonProps) {
  const config = CONFIG[kind];
  const { saved, signedIn, pending, toggle } = useLibraryState(
    kind,
    tmdbId,
    mediaType,
  );

  const isIcon = variant === "icon";
  const Icon = saved ? config.IconSaved : config.Icon;

  const base = isIcon
    ? "inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition"
    : "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold backdrop-blur transition";

  const idle =
    "border-white/25 bg-white/10 text-white hover:bg-white/20";

  if (!signedIn) {
    return (
      <Link
        href="/api/auth/signin"
        aria-label={config.signedOutLabel}
        title={config.signedOutLabel}
        className={cn(base, idle, className)}
      >
        <Icon className={isIcon ? "h-4 w-4" : "h-4 w-4"} aria-hidden />
        {isIcon ? null : config.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      // aria-pressed, not a label that flips: screen readers announce the
      // state change without the button appearing to become a different
      // control each time it's clicked.
      aria-pressed={saved}
      aria-label={`${saved ? config.labelSaved : config.label}: ${title}`}
      disabled={pending}
      onClick={toggle}
      className={cn(
        base,
        saved ? config.savedClass : idle,
        pending && "opacity-60",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          saved && kind === "favourite" && "fill-current",
        )}
        aria-hidden
      />
      {isIcon ? null : saved ? config.labelSaved : config.label}
    </button>
  );
}
