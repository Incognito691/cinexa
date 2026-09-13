import { Sparkles } from "lucide-react";

import { getRecommendationRail } from "@/server/ai/recommendations";

import { MediaRail } from "./media-rail";

/**
 * "Because you watched …".
 *
 * A server component that renders nothing at all when there's no history, no
 * session, or nothing to suggest — an empty personalised rail is worse than
 * its absence, because it implies the feature is broken rather than unused.
 *
 * `getRecommendationRail` never throws and never blocks on the model: it
 * prefers a stored suggestion list, then one AI call a day, then TMDB's own
 * related titles. The badge tells you which path produced the row, so a
 * quota-exhausted day is visible rather than silently degraded.
 */
export async function RecommendedRail() {
  const rail = await getRecommendationRail().catch(() => null);
  if (!rail || rail.items.length === 0) return null;

  return (
    <section className="space-y-3">
      {rail.source === "ai" ? (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/65">
          <Sparkles className="h-3 w-3" aria-hidden />
          AI picks
        </p>
      ) : null}
      <MediaRail
        title={`Because you watched ${rail.seedTitle}`}
        subtitle={
          rail.source === "ai"
            ? "Chosen for you from what you've been watching."
            : "More in the same vein."
        }
        items={rail.items}
      />
    </section>
  );
}
