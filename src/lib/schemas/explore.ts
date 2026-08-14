import { z } from "zod";

// Schemas for the /explore query. Lives outside the route file so Next.js
// can generate its inferred route handler types without Zod types
// polluting the public API surface.

/**
 * UI tabs on the explore page. Mirrors the Stitch "Explore & Discover"
 * design: Movies, TV Shows, Anime, Trending. `trending` is implemented
 * server-side as a thin wrapper around TMDB's `/trending/all/week`.
 */
export const exploreTabSchema = z.enum(["movies", "tv", "anime", "trending"]);
export type ExploreTab = z.infer<typeof exploreTabSchema>;
