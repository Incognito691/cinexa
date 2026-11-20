"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { AppSidebar, SidebarContent } from "./app-sidebar";
import { PageTransition } from "./page-transition";
import { AppTopbar } from "./app-topbar";
import { usePersistedFlag } from "@/hooks/use-persisted-flag";

const SIDEBAR_KEY = "popcornly:sidebar-expanded";
const EXPANDED_W = "248px";
const COLLAPSED_W = "68px";

interface AppShellProps {
  children: React.ReactNode;
  /** Server-rendered auth control; passed as a slot so the shell stays client-side. */
  userMenu?: React.ReactNode;
  /** Resolved on the server by the layout; hides Logout when signed out. */
  signedIn?: boolean;
}

/** True from 1024px up. Server and first paint assume a wide screen. */
const WIDE = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function AppShell({ children, userMenu, signedIn = false }: AppShellProps) {
  const [preferExpanded, setExpanded] = usePersistedFlag(SIDEBAR_KEY, true);
  // On tablets (768 to 1023px) the full sidebar would take a third of the
  // screen and squeeze every grid, so it stays an icon rail there whatever
  // the saved preference; the preference applies again on a wider screen.
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  const expanded = preferExpanded && wide;
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
      {/* Sidebar — fixed outside the flow so it never scrolls with content. */}
      <AppSidebar
        expanded={expanded}
        signedIn={signedIn}
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
            // The drawer always shows labels, even if the desktop rail is collapsed.
            expanded
            signedIn={signedIn}
            onToggle={() => setExpanded((value) => !value)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main column — left padding tracks the sidebar width so content never sits under it. */}
      <div
        className={cn(
          // No padding transition: animating it re-laid-out and repainted the
          // whole page every frame (10fps on an integrated GPU, with black
          // flashes). The content snaps once; the sidebar alone animates.
          "flex min-h-screen flex-col p-3 pt-0",
          "md:pl-[calc(var(--sidebar-w,260px)+1.5rem)]",
        )}
        style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
      >
        <AppTopbar onMenuClick={() => setMobileOpen(true)} userMenu={userMenu} signedIn={signedIn} />
        <main className="flex-1 px-1 pb-16 pt-4 sm:px-3 lg:px-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}