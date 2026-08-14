import type { ContentClass, FilterInput, LayerResult } from "../types";
import { filterAiCache, AI_CACHE_TTL_MS, type AiCacheEntry } from "../cache";
import { env } from "@/lib/env";

/**
 * Layer 9 — AI classifier (optional, lazy, aggressively cached).
 *
 * Design policy (90 / 5 split):
 *   - ~90 % of items are decided deterministically by Layers 1–6 + 7–8.
 *     They never reach this layer.
 *   - The remaining ~5–10 % (ambiguous cases) are classified by the model.
 *   - Every AI decision is cached by `${mediaType}:${tmdbId}` for 30 days,
 *     so a title is *never* classified twice.
 *
 * If `OPENAI_API_KEY` is not set the layer is a hard no-op: returns NEUTRAL and
 * contributes nothing. The pipeline still works.
 *
 * The actual OpenAI call lives in `classifyWithAI` (server-only, in this file).
 * We deliberately keep it on the server so the request goes from Next.js
 * (no API key exposed to the browser).
 *
 * The function is **only invoked** when `shouldInvokeAI` returns true based on the
 * pre-AI score and other signals — see pipeline.ts.
 */

const AI_MODEL = "gpt-4o-mini";

export function layer9Ai(
  input: FilterInput,
  ai: AiCacheEntry | null,
): LayerResult {
  if (!ai) {
    return {
      layer: 9,
      decision: "NEUTRAL",
      confidence: 0,
      reason: "AI not invoked (decisive deterministic verdict or stub mode)",
    };
  }
  return {
    layer: 9,
    decision: ai.class === "SAFE" || ai.class === "MATURE" ? "PASS" : "BLOCK",
    class: ai.class,
    confidence: ai.confidence,
    reason: `AI: ${ai.class} (${Math.round(ai.confidence * 100)}%)`,
  };
}

/**
 * Returns a cached AI result if present, otherwise calls the API (when a key is configured)
 * and caches the response. Returns null when AI is disabled (`OPENAI_API_KEY` missing)
 * or when the upstream call fails — the pipeline then proceeds without AI.
 */
export async function classifyWithAI(
  input: Pick<FilterInput, "tmdbId" | "mediaType" | "title" | "overview">,
  context: { keywords: string[]; genres: string[] },
): Promise<AiCacheEntry | null> {
  const cacheKey = `${input.mediaType}:${input.tmdbId}`;

  // 1. Fast path — cache hit.
  const cached = filterAiCache.get(cacheKey) as AiCacheEntry | undefined;
  if (cached) return cached;

  // 2. AI disabled — never hit the network.
  if (!env.OPENAI_API_KEY) return null;

  // 3. Cache miss — call OpenAI.
  const result = await callOpenAIClassifier(input, context);
  if (result) {
    filterAiCache.set(cacheKey, result, AI_CACHE_TTL_MS);
  }
  return result;
}

/**
 * The actual OpenAI API call. Kept private so the request shape is the only way
 * to reach the model. Returns null on any error — the filter must never throw
 * because of an AI failure.
 */
async function callOpenAIClassifier(
  input: Pick<FilterInput, "title" | "overview">,
  context: { keywords: string[]; genres: string[] },
): Promise<AiCacheEntry | null> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const system = [
    "You are a strict content classifier for a movie/TV streaming UI.",
    "Return JSON with two keys: `class` ∈ {SAFE, MATURE, EROTIC, PORNOGRAPHIC} and `confidence` ∈ [0,1].",
    "SAFE: G-rated, family-friendly. MATURE: R-rated but story-driven (thriller, war, crime, drama with sex/violence as part of storytelling). EROTIC: explicitly titillating, softcore, web series focused on desire. PORNOGRAPHIC: hard-core adult content.",
    "Be conservative — when uncertain between MATURE and EROTIC, prefer MATURE.",
    "Never invent content; base your judgment only on the title, overview, keywords, and genres provided.",
  ].join(" ");

  const user = JSON.stringify({
    title: input.title,
    overview: input.overview,
    keywords: context.keywords,
    genres: context.genres,
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0,
        max_tokens: 80,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      // 8s timeout via AbortSignal — don't block the page render.
      signal: AbortSignal.timeout(8_000),
      // Don't cache the API response at the framework level; we cache ourselves.
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      class?: ContentClass;
      confidence?: number;
    };

    if (
      !["SAFE", "MATURE", "EROTIC", "PORNOGRAPHIC"].includes(parsed.class ?? "")
    ) {
      return null;
    }
    const confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.5));

    return { class: parsed.class!, confidence };
  } catch {
    return null;
  }
}
