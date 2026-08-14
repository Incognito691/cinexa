"use client";

import { useEffect, useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { AppSidebar, SidebarContent } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { usePersistedFlag } from "@/hooks/use-persisted-flag";

const SIDEBAR_KEY = "cinexa:sidebar-expanded";
const EXPANDED_W = "248px";
const COLLAPSED_W = "68px";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [expanded, setExpanded] = usePersistedFlag(SIDEBAR_KEY, true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bind CSS variables that the sidebar width + main-content padding both read.
  // Both sides transition together so collapse/expand stays in sync visually.
  const sidebarWidth = expanded ? EXPANDED_W : COLLAPSED_W;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-0 right-0 -z-10 h-[60vh] bg-[radial-gradient(70%_60%_at_18%_0%,rgba(168,85,247,0.45),transparent_70%),radial-gradient(60%_55%_at_82%_5%,rgba(236,72,153,0.4),transparent_70%)]"
      />

      {/* Sidebar — fixed outside the flow so it never scrolls with content. */}
      <AppSidebar
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      />

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className={cn(
            "w-[280px] max-w-[85%] border-r border-border/60 bg-sidebar p-0 text-sidebar-foreground",
          )}
        >
          <SidebarContent
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main column — left padding tracks the sidebar width so content never sits under it. */}
      <div
        className={cn(
          "flex min-h-screen flex-col p-3 pt-0 transition-[padding] duration-300 ease-out",
          "md:pl-[calc(var(--sidebar-w,260px)+1.5rem)]",
        )}
        style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
      >
        <AppTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-1 pb-16 pt-4 sm:px-3 lg:px-4">
          {children}
        </main>
      </div>
    </div>
  );
}