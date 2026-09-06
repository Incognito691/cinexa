"use client";

import { usePathname } from "next/navigation";

/**
 * Cross-fades page content on navigation.
 *
 * Keyed on the pathname, so React remounts the subtree per route and the
 * entry animation replays. Uses `tailwindcss-animate` (already a dependency)
 * rather than pulling in an animation library for one fade.
 *
 * The fade is deliberately short — a slow transition reads as lag, which is
 * the opposite of the goal. Real perceived speed comes from the `loading.tsx`
 * skeletons streaming in; this only removes the hard cut between them and the
 * loaded page.
 *
 * `motion-reduce:animate-none` honours `prefers-reduced-motion`.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
