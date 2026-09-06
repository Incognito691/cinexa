"use client";

import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SearchBar } from "@/features/explore";
import { ThemeToggle } from "./theme-toggle";

interface AppTopbarProps {
  onMenuClick?: () => void;
}

export function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const pathname = usePathname();
  // The explore page has its own prominent search input. Hide the topbar
  // one there so we don't end up with two search fields.
  const onExplore = pathname?.startsWith("/explore") ?? false;
  // The player owns the screen — search, theme, notifications and the avatar
  // all compete with the picture, so the whole bar goes on /watch.
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
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden h-10 w-10 rounded-xl border border-white/[0.08] bg-white/[0.05] text-foreground/80 backdrop-blur-md hover:bg-white/[0.1]"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
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

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-card/40 text-foreground/80 transition hover:bg-card/80 hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-from shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-md shadow-brand-from/30 transition hover:opacity-90"
        >
          S
        </button>
      </div>
    </header>
  );
}