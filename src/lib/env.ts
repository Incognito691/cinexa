import { z } from "zod";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const envSchema = z.object({
  TMDB_API_KEY: z.string().min(1).optional(),
  /**
   * Google AI Studio key for the content filter's AI layer.
   *
   * `OPENAI_API_KEY` is accepted as a fallback because that's the name this
   * project shipped with, and the key stored under it is a Gemini key. Prefer
   * `GEMINI_API_KEY` in new setups; see `filter/layers/layer-9-ai.ts`.
   */
  GEMINI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
});

/** The key the AI filter layer runs on. */
export const aiApiKey = (): string | undefined =>
  env.GEMINI_API_KEY ?? env.OPENAI_API_KEY;

export const tmdbImage = (
  path: string | null | undefined,
  size: string = "original",
): string | undefined =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : undefined;

export function requireServerEnv<K extends keyof typeof env>(
  key: K,
): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${String(key)}`,
    );
  }
  return value;
}