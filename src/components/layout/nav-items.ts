import {
  Clapperboard,
  Compass,
  Download,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Shuffle,
  Swords,
  Tv,
  Library,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /**
   * Extra path prefixes that belong to this section, so the sidebar stays
   * lit on pages reached from it: a film's detail and player pages are still
   * "Movies".
   */
  match?: string[];
  external?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Movies", href: "/movies", icon: Clapperboard, match: ["/movie/", "/watch/movie/"] },
  { label: "TV Shows", href: "/tv-shows", icon: Tv, match: ["/tv/", "/watch/tv/"] },
  { label: "Anime", href: "/anime", icon: Swords },
  { label: "Surprise", href: "/surprise", icon: Shuffle },
];

export const libraryNav: NavItem[] = [
  { label: "Favourites", href: "/favourites", icon: Heart },
  { label: "Continue Watching", href: "/continue-watching", icon: PlayCircle },
  { label: "My Collections", href: "/my-collection", icon: Folder },
  { label: "Downloads", icon: Download, comingSoon: true },
];

export const settingsNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

// No href: the sidebar renders this one as a button that opens the sign-out
// confirmation (features/auth/components/sign-out-confirm.tsx).
export const logoutNav: NavItem[] = [{ label: "Logout", icon: LogOut }];

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