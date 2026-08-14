"use client";

import { Bell, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TABS } from "@/components/explore/tabs";
import { ThemeToggle } from "./theme-toggle";

interface AppTopbarProps {
  onMenuClick?: () => void;
}

export function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const pathname = usePathname();
  // The explore page has its own prominent search input. Hide the topbar
  // one there so we don't end up with two search fields.
  const onExplore = pathname?.startsWith("/explore") ?? false;
  const activeTab = onExplore
    ? (new URLSearchParams(pathname?.split("?")[1] ?? "").get("tab") ??
      "movies")
    : null;

  const [query, setQuery] = useState("");
  const [_scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* Primary explore tabs (only when on /explore). */}
      {onExplore ? (
        <nav
          aria-label="Explore tabs"
          className="hidden items-center gap-1 md:flex"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/explore?tab=${tab.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/65 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {!onExplore ? (
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="relative min-w-0 flex-1 max-w-2xl"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for films, directors, or actors…"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-10 text-sm text-foreground backdrop-blur-md placeholder:text-muted-foreground/70 outline-none transition focus:border-brand-from/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-brand-from/30"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </form>
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