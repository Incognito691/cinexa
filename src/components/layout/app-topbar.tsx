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
}

export function AppTopbar({ onMenuClick, userMenu }: AppTopbarProps) {
  const pathname = usePathname();
  // The explore page has its own prominent search input. Hide the topbar
  // one there so we don't end up with two search fields.
  const onExplore = pathname?.startsWith("/explore") ?? false;
  // The player owns the screen — search and the avatar both compete with the
  // picture, so the whole bar goes on /watch.
  const onWatch = pathname?.startsWith("/watch") ?? false;

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

      {!onExplore ? (
        <SearchBar
          variant="compact"
          placeholder="Search for films, directors, or actors…"
          className="min-w-0 flex-1 max-w-2xl"
        />
      ) : (
        <div className="flex-1" />
      )}

      {/* Search and the avatar only. Sign-out lives in the sidebar, and the
          theme toggle and notification bell were chrome nothing pointed at. */}
      <div className="ml-auto flex shrink-0 items-center gap-2">{userMenu}</div>
    </header>
  );
}