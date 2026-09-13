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

  /**
   * Postgres (Neon). Optional at parse time like everything else so the app
   * still boots without it — the pages that need a session reach it through
   * `requireServerEnv`, which throws at request time instead.
   *
   * Note: strip `channel_binding=require` from Neon's default URL. Prisma's
   * engine doesn't implement SCRAM channel binding and fails with a misleading
   * "Can't reach database server". `sslmode=require` still applies.
   */
  DATABASE_URL: z.string().min(1).optional(),

  /** Auth.js v5 reads AUTH_SECRET, but accepts NEXTAUTH_SECRET as a fallback. */
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});

/** True when Google OAuth is configured; the UI hides sign-in without it. */
export const authConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.DATABASE_URL);

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