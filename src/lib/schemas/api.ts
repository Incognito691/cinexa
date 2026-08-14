import { z } from "zod";

export const mediaTypeSchema = z.enum(["movie", "tv"]);
export type MediaTypeInput = z.infer<typeof mediaTypeSchema>;

export const discoverCategorySchema = z.enum([
  "popular",
  "top_rated",
  "now_playing",
  "on_the_air",
]);
export type DiscoverCategoryInput = z.infer<typeof discoverCategorySchema>;

export const pageSchema = z.coerce.number().int().min(1).default(1);

export const trendingQuerySchema = z.object({
  type: z.enum(["all", "movie", "tv"]).default("all"),
  window: z.enum(["day", "week"]).default("week"),
  page: pageSchema,
});

export const discoverQuerySchema = z.object({
  type: mediaTypeSchema.default("movie"),
  category: discoverCategorySchema.default("popular"),
  page: pageSchema,
  region: z
    .string()
    .trim()
    .length(2)
    .toUpperCase()
    .optional(),
  language: z
    .string()
    .trim()
    .length(2)
    .toLowerCase()
    .optional(),
  /** Optional comma-separated TMDB genre IDs. */
  withGenres: z
    .string()
    .trim()
    .regex(/^\d+(,\d+)*$/, "must be a comma-separated list of numeric genre IDs")
    .optional(),
  /** Year filter (1920..2100). */
  year: z.coerce
    .number()
    .int()
    .min(1870)
    .max(2100)
    .optional(),
  /** Override the default sort, e.g. `"vote_average.desc"` for "Top Rated". */
  sortBy: z.string().trim().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(["multi", "movie", "tv"]).default("multi"),
  page: pageSchema,
});

export const watchTypeSchema = z.enum(["movie", "tv"]);

export const tvPlaybackQuerySchema = z.object({
  season: z.coerce.number().int().min(1).default(1),
  episode: z.coerce.number().int().min(1).default(1),
});