import {
  Compass,
  Download,
  Folder,
  Heart,
  Home,
  LogOut,
  PlayCircle,
  Settings,
  Sparkles,
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
  { label: "AI Chat", href: "/ai", icon: Sparkles },
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

// Auth.js's own sign-out route: a plain link to it renders the built-in
// confirm page, which owns the CSRF token. That's a link instead of a form,
// and it's now the app's only sign-out since the topbar dropped its button.
export const logoutNav: NavItem[] = [
  {
    label: "Logout",
    icon: LogOut,
    href: "/api/auth/signout",
    external: true,
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