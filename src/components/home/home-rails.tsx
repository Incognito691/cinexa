"use client";

import { MediaRail } from "./media-rail";
import type { MediaCardItem } from "@/types/media";

export interface RailFeed {
  items: MediaCardItem[];
  error?: string;
}

// Each rail's "View All" passes through to the /explore page with the matching
// tab + filter applied, so the user lands on the same content they were just
// scrolling, with proper pagination + filters.
//
// Data is pre-fetched on the server (see app/page.tsx) and handed to the rail
// as `initial`. We never use client-side React Query on these — that was the
// source of the "stuck on skeleton forever" bug because the dev server's first
// API-route compile blocks the client fetch.

export function NowPlayingRail({ initial }: { initial: RailFeed }) {
  return (
    <MediaRail
      title="Now Playing"
      subtitle="Fresh in theatres and on streaming this week."
      seeAllHref="/explore?tab=movies&category=now_playing"
      items={initial.items}
      error={initial.error ? { message: initial.error } : null}
    />
  );
}

export function TopMoviesRail({ initial }: { initial: RailFeed }) {
  return (
    <MediaRail
      title="Top Movies"
      subtitle="The films everyone's watching right now."
      seeAllHref="/explore?tab=movies&category=popular"
      items={initial.items}
      error={initial.error ? { message: initial.error } : null}
    />
  );
}

export function TopTvRail({ initial }: { initial: RailFeed }) {
  return (
    <MediaRail
      title="Top TV Shows"
      subtitle="Binge-worthy series lighting up the charts."
      seeAllHref="/explore?tab=tv&category=popular"
      items={initial.items}
      error={initial.error ? { message: initial.error } : null}
    />
  );
}

export function TopHindiMoviesRail({ initial }: { initial: RailFeed }) {
  return (
    <MediaRail
      title="Top Hindi Movies"
      subtitle="Bollywood hits and original-language Hindi favourites."
      seeAllHref="/explore?tab=movies&category=popular&language=hi"
      items={initial.items}
      error={initial.error ? { message: initial.error } : null}
      language="Hindi"
    />
  );
}

export function TopHindiTvRail({ initial }: { initial: RailFeed }) {
  return (
    <MediaRail
      title="Top Hindi TV Shows"
      subtitle="Indian original-language Hindi series."
      seeAllHref="/explore?tab=tv&category=popular&language=hi"
      items={initial.items}
      error={initial.error ? { message: initial.error } : null}
      language="Hindi"
    />
  );
}
