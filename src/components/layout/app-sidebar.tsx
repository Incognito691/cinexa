"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  Clapperboard,
  Compass,
  Download,
  Film,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Clock,
  type LucideIcon,
} from "lucide-react";

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
      (!!item.href && item.href !== "/" && pathname.startsWith(item.href))
    : false;

  // Reference style: active = purple text only, no background, no left bar.
  const iconClass = cn(
    "h-[18px] w-[18px] shrink-0 transition-colors",
    active
      ? "text-brand-from"
      : "text-muted-foreground group-hover:text-foreground",
  );

  const labelClass = cn(
    "flex-1 truncate text-[13.5px] font-medium transition-colors",
    active ? "text-brand-from" : "text-foreground/80 group-hover:text-foreground",
  );

  const rowClass = cn(
    "group relative flex h-10 items-center gap-3 rounded-lg px-2.5 transition-colors",
    expanded ? "whitespace-nowrap" : "justify-center px-0",
  );

  const content = (
    <>
      <Icon className={iconClass} />
      {expanded ? <span className={labelClass}>{item.label}</span> : null}
    </>
  );

  if (!hasHref) {
    return (
      <li>
        <span
          aria-disabled
          aria-label={item.label}
          title={!expanded ? item.label : undefined}
          className={cn(rowClass, "cursor-not-allowed opacity-50")}
        >
          {content}
        </span>
      </li>
    );
  }

  if (item.external) {
    return (
      <li>
        <a
          href={item.href}
          aria-label={item.label}
          title={!expanded ? item.label : undefined}
          onClick={onNavigate}
          className={cn(rowClass, "text-foreground/80")}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href!}
        aria-label={item.label}
        title={!expanded ? item.label : undefined}
        onClick={onNavigate}
        className={cn(rowClass, "text-foreground/80")}
      >
        {content}
      </Link>
    </li>
  );
}

function CollapsedNavRow({ item, onNavigate }: NavRowProps) {
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <NavRow item={item} expanded={false} onNavigate={onNavigate} />
          </span>
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
          <NavRow
            key={item.label}
            item={item}
            expanded={expanded}
            onNavigate={onNavigate}
          />
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
  return <li aria-hidden className="my-3 h-px w-full bg-white/[0.06]" />;
}

export function SidebarContent({
  expanded,
  onToggle,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center px-4",
          expanded ? "justify-between" : "justify-center",
        )}
      >
        <Link
          href="/"
          aria-label="Cinexa home"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg",
            expanded ? "" : "justify-center",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient shadow-md shadow-brand-from/30 ring-1 ring-white/10">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          {expanded ? (
            <span className="font-display text-[17px] font-semibold uppercase tracking-[0.18em] text-foreground">
              Cinexa
            </span>
          ) : null}
        </Link>
        {expanded ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        ) : null}
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
          <NavList
            items={logoutNav}
            expanded={expanded}
            onNavigate={onNavigate}
          />
        </div>

        {!expanded ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mt-3 flex h-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        ) : null}
      </nav>
    </div>
  );
}

interface AppSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export function AppSidebar({ expanded, onToggle }: AppSidebarProps) {
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
            "bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-200",
            "shadow-[inset_1px_0_0_0_rgba(255,255,255,0.04),0_8px_30px_-12px_rgba(0,0,0,0.5)] overflow-hidden",
          )}
        >
          <SidebarContent expanded={expanded} onToggle={onToggle} />
        </div>
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
  Film,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Clock,
};