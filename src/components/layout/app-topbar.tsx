"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SearchBar } from "@/features/explore";

interface AppTopbarProps {
  onMenuClick?: () => void;
  userMenu?: React.ReactNode;
  signedIn?: boolean;
}

/** Pages without the topbar search. */
const NO_SEARCH = [
  "/explore",
  // Same results view as explore, with its own search field.
  "/movies/all",
  "/tv-shows/all",
  "/settings",
  "/favourites",
  "/my-collection",
  "/continue-watching",
  "/surprise",
];

export function AppTopbar({ onMenuClick, userMenu, signedIn = false }: AppTopbarProps) {
  const pathname = usePathname();
  const path = pathname ?? "";
  // Search only where you're looking for something to watch. Explore has its
  // own big search field; the library and settings pages are about what you
  // already have, and Surprise picks for you.
  const hideSearch = NO_SEARCH.some((prefix) => path.startsWith(prefix));
  // The player owns the screen — search and the avatar both compete with the
  // picture, so the whole bar goes on /watch and the anime player.
  const onWatch = path.startsWith("/watch") || /^\/anime\/[^/]+\/[^/]+\/watch/.test(path);
  // On the anime pages the search is anime-only, from AniList.
  const onAnime = pathname?.startsWith("/anime") ?? false;

  // The search follows the section you're in: movies in Movies, shows in TV
  // Shows, anime in Anime. Detail and player pages count as their section.
  const section = onAnime
    ? "anime"
    : /^\/(tv-shows|tv\/)/.test(path)
      ? "tv"
      : /^\/(movies|movie\/)/.test(path)
        ? "movies"
        : "all";

  const [_scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (onWatch) return null;

  return (
    <header
      className={cn(
        "sticky top-3 z-30 mt-3 flex h-14 items-center gap-2 px-2 sm:gap-3 sm:px-3 lg:px-4",
      )}
    >
      <Button
        variant="secondary"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden"
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      {!hideSearch ? (
        <SearchBar
          // Remount on switch so a half-typed term doesn't carry its old results.
          key={section}
          variant="compact"
          scope={onAnime ? "anime" : "all"}
          tab={section === "tv" ? "tv" : "movies"}
          placeholder={
            section === "anime"
              ? "Search anime…"
              : section === "tv"
                ? "Search TV shows…"
                : section === "movies"
                  ? "Search movies…"
                  : "Search for films, directors, or actors…"
          }
          className="min-w-0 flex-1 max-w-2xl"
        />
      ) : (
        <div className="flex-1" />
      )}

      {/* Search and the avatar only. Sign-out lives in the sidebar, and the
          theme toggle and notification bell were chrome nothing pointed at. */}
      {/* Settings has its own Sign in button in the account card; a second
          one in the bar right above it is noise. The avatar still shows. */}
      {!signedIn && path.startsWith("/settings") ? null : (
        <div className="ml-auto flex shrink-0 items-center gap-2">{userMenu}</div>
      )}
    </header>
  );
}