"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A thin progress bar across the top that starts the instant a link is
 * clicked.
 *
 * Without it a slow navigation gives no feedback at all until the next
 * page's `loading.tsx` arrives: the click looks ignored. That gap is longest
 * on a route's first visit (in dev the route compiles on demand; in
 * production it's the server round trip), which is exactly when the app
 * felt "stuck" for a couple of seconds.
 *
 * It listens for clicks on same-origin links to a different path and ends
 * when the pathname changes. Query-only changes (another episode, another
 * page of a grid) keep the same path and are left alone.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  // Bumped per navigation so the CSS animation restarts from zero.
  const [run, setRun] = useState(0);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      let url: URL;
      try {
        url = new URL(link.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      setRun((n) => n + 1);
      setState("loading");
    };
    // Capture, so it runs before a component's own handler can stop the event.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The new page (or its loading skeleton) is on screen: finish, then hide.
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
  }, [pathname]);

  useEffect(() => {
    if (state === "idle") return;
    // "done" fades out; "loading" gives up after a while (a cancelled
    // navigation never changes the pathname).
    const timer = setTimeout(() => setState("idle"), state === "done" ? 350 : 12_000);
    return () => clearTimeout(timer);
  }, [state, run]);

  if (state === "idle") return null;
  return (
    <div
      key={run}
      aria-hidden
      className={`nav-progress ${state === "done" ? "nav-progress-done" : ""}`}
    />
  );
}
