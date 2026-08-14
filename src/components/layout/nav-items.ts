import {
  Compass,
  Download,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Clock,
  Library,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  external?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
];

export const libraryNav: NavItem[] = [
  { label: "Favourites", href: "/favourites", icon: Heart },
  { label: "Continue Watching", href: "/continue-watching", icon: PlayCircle },
  { label: "Recently Added", icon: Clock, comingSoon: true },
  { label: "My Collections", href: "/my-collection", icon: Folder },
  { label: "Downloads", icon: Download, comingSoon: true },
];

export const settingsNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export const logoutNav: NavItem[] = [
  {
    label: "Logout",
    icon: LogOut,
    external: true,
    comingSoon: true,
  },
];

export const groups = [
  { label: "Menu", items: primaryNav },
  { label: "Library", items: libraryNav },
] as const;

export const secondaryItems = [
  ...settingsNav,
  ...logoutNav,
] as const;

// Convenience icon used by collapsed sidebar when no groups are shown.
export const SidebarIcon = Library;