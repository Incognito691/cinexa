"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Compass,
  Download,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { LogoMark, Wordmark } from "@/components/brand/logo";
import { SignOutConfirm } from "@/features/auth/components/sign-out-confirm";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  primaryNav,
  libraryNav,
  settingsNav,
  logoutNav,
  type NavItem,
} from "./nav-items";

interface SidebarContentProps {
  expanded: boolean;
  /** Logout is only offered to someone who is signed in. */
  signedIn?: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

interface NavRowProps {
  item: NavItem;
  expanded: boolean;
  onNavigate?: () => void;
}

function NavRow({ item, expanded, onNavigate }: NavRowProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasHref = !item.comingSoon && Boolean(item.href);

  const active = hasHref && pathname
    ? pathname === item.href ||
      (!!item.href && item.href !== "/" && pathname.startsWith(item.href)) ||
      (item.match?.some((prefix) => pathname.startsWith(prefix)) ?? false)
    : false;

  // Active = the icon alone, in a deep maroon-red. No pill, no bar.
  const iconClass = cn(
    "h-[18px] w-[18px] shrink-0 transition-colors",
    active
      ? "text-[#c22a3a]"
      : "text-muted-foreground group-hover:text-foreground",
  );

  const labelClass = cn(
    "flex-1 truncate text-[13.5px] font-medium transition-colors",
    active ? "text-white" : "text-foreground/80 group-hover:text-foreground",
  );

  const rowClass = cn(
    "group relative flex h-10 items-center gap-3 rounded-lg px-2.5 transition-colors",
    expanded ? "whitespace-nowrap" : "justify-center px-0",
    "hover:bg-white/[0.04]",
  );

  const content = (
    <>
      <Icon className={iconClass} />
      {expanded ? <span className={labelClass}>{item.label}</span> : null}
    </>
  );

  if (!hasHref) {
    return (
      <span
        aria-disabled
        aria-label={item.label}
        title={!expanded ? item.label : undefined}
        className={cn(rowClass, "cursor-not-allowed opacity-50")}
      >
        {content}
      </span>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        aria-label={item.label}
        title={!expanded ? item.label : undefined}
        onClick={onNavigate}
        className={cn(rowClass, "text-foreground/80")}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href!}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={!expanded ? item.label : undefined}
      onClick={onNavigate}
      className={cn(rowClass, "text-foreground/80")}
    >
      {content}
    </Link>
  );
}

function CollapsedNavRow({ item, onNavigate }: NavRowProps) {
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavRow item={item} expanded={false} onNavigate={onNavigate} />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.label}
          {item.comingSoon ? " · Coming soon" : ""}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function NavList({
  items,
  expanded,
  onNavigate,
}: {
  items: NavItem[];
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) =>
        expanded ? (
          <li key={item.label}>
            <NavRow item={item} expanded={expanded} onNavigate={onNavigate} />
          </li>
        ) : (
          <CollapsedNavRow
            key={item.label}
            item={item}
            expanded={expanded}
            onNavigate={onNavigate}
          />
        ),
      )}
    </ul>
  );
}

function Divider() {
  return <div aria-hidden className="my-3 h-px w-full bg-white/[0.06]" />;
}

export function SidebarContent({ expanded, signedIn = false, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center px-4",
          expanded ? "justify-start" : "justify-center",
        )}
      >
        <Link
          href="/"
          aria-label="Popcornly home"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg",
            expanded ? "" : "justify-center",
          )}
        >
          {/* Same mark as the favicon; see components/brand/logo.tsx. */}
          <LogoMark className="h-9 w-9" />
          {expanded ? <Wordmark className="text-[22px]" /> : null}
        </Link>
      </div>

      {/* Nav scroll area */}
      <nav className="flex flex-1 flex-col px-3 pb-6">
        <NavList
          items={primaryNav}
          expanded={expanded}
          onNavigate={onNavigate}
        />
        <Divider />
        <NavList
          items={libraryNav}
          expanded={expanded}
          onNavigate={onNavigate}
        />

        <div className="mt-auto pt-3">
          <Divider />
          <NavList
            items={settingsNav}
            expanded={expanded}
            onNavigate={onNavigate}
          />
          {signedIn ? (
            <SignOutConfirm
              label="Log out"
              title={expanded ? undefined : "Log out"}
              className={cn(
                "group flex h-10 w-full items-center gap-3 rounded-lg px-2.5 transition-colors hover:bg-white/[0.04]",
                expanded ? "whitespace-nowrap" : "justify-center px-0",
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              {expanded ? (
                <span className="flex-1 truncate text-left text-[13.5px] font-medium text-foreground/80 group-hover:text-foreground">
                  Logout
                </span>
              ) : null}
            </SignOutConfirm>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

interface AppSidebarProps {
  expanded: boolean;
  signedIn?: boolean;
  onToggle: () => void;
}

export function AppSidebar({ expanded, signedIn, onToggle }: AppSidebarProps) {
  return (
    <TooltipProvider delayDuration={150}>
      {/* Floating glass card — fixed so it never scrolls with content. */}
      <aside
        className="hidden md:block fixed left-3 top-3 bottom-3 z-30 transition-[width] duration-300 ease-out"
        style={{ width: expanded ? "248px" : "68px" }}
      >
        <div
          className={cn(
            "flex h-full flex-col rounded-2xl border border-white/[0.07] text-sidebar-foreground",
            // No backdrop blur: nothing scrolls behind the sidebar, so the blur
            // only cost a full re-sample of the page on every animation frame.
            "bg-white/[0.04]",
            "shadow-[inset_1px_0_0_0_rgba(255,255,255,0.04),0_8px_30px_-12px_rgba(0,0,0,0.5)] overflow-hidden",
          )}
        >
          <SidebarContent expanded={expanded} signedIn={signedIn} onToggle={onToggle} />
        </div>

        {/* One toggle for both states: a small handle on the sidebar's edge,
            level with the logo. It rides the edge as the width animates and
            the chevron flips, so the control never jumps between the top
            (expanded) and the bottom (collapsed) as it used to. A sibling of
            the panel because the panel clips its overflow. */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={expanded}
          // From 1024px only: below that the sidebar is always the icon rail.
          className="absolute -right-3 top-[22px] hidden h-6 w-6 items-center lg:flex justify-center rounded-full border border-white/[0.12] bg-[#161616] text-white/60 shadow-md shadow-black/50 transition-colors hover:border-white/25 hover:bg-[#1f1f1f] hover:text-white"
        >
          <ChevronLeft
            className={cn("h-3.5 w-3.5 transition-transform duration-300", !expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      </aside>
    </TooltipProvider>
  );
}

export { NavRow, type NavRowProps };
export type { SidebarContentProps };
export { primaryNav, libraryNav, settingsNav, logoutNav };

export type { LucideIcon };
export {
  Compass,
  Download,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Clock,
};