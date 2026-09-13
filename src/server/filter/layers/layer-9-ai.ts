import type { ContentClass, FilterInput, LayerResult } from "../types";
import { filterAiCache, AI_CACHE_TTL_MS, type AiCacheEntry } from "../cache";
import { aiApiKey } from "@/lib/env";
import { aiUnavailable, callGemini } from "@/server/ai/gemini";
import { loadAiVerdicts, recordAiVerdicts } from "../ai-store";

/**
 * Layer 9 — AI classifier (Google Gemini), batched and aggressively cached.
 *
 * This layer is the only thing that catches non-English softcore. Every other
 * list-level layer keys off English phrases or TMDB's `adult` flag, and this
 * content has `adult=false`, an innocuous one-line overview, and sometimes no
 * overview at all — it scores a flat 0 deterministically.
 *
 * Provider note: this used to call OpenAI, but the key this project runs on is
 * a Google AI Studio key, so the request 401'd on every call and the layer had
 * never once produced a classification. `aiApiKey()` accepts `GEMINI_API_KEY`
 * or the legacy `OPENAI_API_KEY` name it was stored under.
 *
 * Cost control is batching, not skipping: `prefetchAiClassifications` sends a
 * whole page in one request and warms the cache, so the per-item pipeline that
 * follows never touches the network. Decisions cache 30 days per
 * `${mediaType}:${tmdbId}`.
 *
 * Runs server-side only, so the key is never exposed to the browser.
 */

/**
 * Most TMDB pages are 20 items; one request covers a page with headroom.
 */
const BATCH_LIMIT = 25;

const CONTENT_CLASSES: readonly ContentClass[] = [
  "SAFE",
  "MATURE",
  "EROTIC",
  "PORNOGRAPHIC",
];

/**
 * The client, the circuit breaker and the quota handling now live in
 * `server/ai/gemini.ts`, shared with the recommendation feature — the free
 * tier's 20 requests/day is a project-wide budget, so it needs one breaker
 * rather than one per caller.
 */
const aiDisabled = aiUnavailable;

const cacheKeyOf = (i: { mediaType: string; tmdbId: number | string }) =>
  `${i.mediaType}:${i.tmdbId}`;

export type AiClassifiable = Pick<
  FilterInput,
  "tmdbId" | "mediaType" | "title" | "overview"
>;

/**
 * The rubric, shared by the single and batch calls.
 *
 * The EROTIC examples are deliberately concrete: the deterministic layers are
 * English-phrase matchers, so what reaches the model is overwhelmingly
 * non-English softcore that reads as an innocuous romance in one-line summary
 * ("college friends stuck in a love tangle"). Without naming the pattern the
 * model calls those MATURE and they stay visible.
 */
const CLASSIFIER_RULES = [
  "You are a strict content classifier for a movie/TV streaming UI.",
  "Classes:",
  "SAFE — family-friendly, no sexual content.",
  "MATURE — R-rated but story-driven: violence, crime, war, or sexuality serving a narrative. Award-circuit and mainstream cinema belongs here even when sexually explicit.",
  "EROTIC — made to titillate rather than to tell a story: softcore, sexploitation, straight-to-video erotic drama, adult web series. Regional softcore lines are the common case — Korean/Japanese/Chinese erotic romance, Indian adult web series (ULLU, Kooku and similar). Strong tells: a numbered sequel of an erotic series; a title built on a domestic or taboo sexual premise (a friend's or relative's spouse, wife-swapping, an affair with a relative, a stepfamily member, a tutor or masseuse); a plot that exists only as a pretext for sex; an obscure recent title with a romance framing, no festival or studio pedigree, and almost no votes.",
  "PORNOGRAPHIC — hardcore/explicit sex as the entire product.",
  "Judge intent, not explicitness: an acclaimed film with graphic sex is MATURE; a low-profile film whose premise is the sex is EROTIC.",
  "When a title is unknown to you and the summary reads as a domestic sexual entanglement with no other plot, prefer EROTIC.",
  "Base your judgment only on the fields provided; do not invent content.",
].join("\n");

/**
 * Classify a whole list in one request and warm `filterAiCache`.
 *
 * Call this before running the pipeline over a list: every `classifyWithAI`
 * that follows is then a cache hit, so the pipeline can consult the model on
 * every item for the cost of a single API call. Uncached titles only — a
 * second page of the same results costs nothing.
 *
 * Never throws and never blocks a render on failure: on any error the cache
 * simply stays cold and the pipeline proceeds on deterministic layers alone.
 */
export async function prefetchAiClassifications(
  inputs: AiClassifiable[],
): Promise<void> {
  // Verdicts persisted from earlier runs count as cache hits, so this must
  // happen even when the AI itself is unavailable — that's what keeps titles
  // blocked once the daily quota is gone.
  await loadAiVerdicts();
  if (aiDisabled()) return;

  // Dedupe by cache key — the same title can appear twice in a merged list.
  const pending = new Map<string, AiClassifiable>();
  for (const input of inputs) {
    const key = cacheKeyOf(input);
    if (filterAiCache.get(key)) continue;
    if (!pending.has(key)) pending.set(key, input);
  }
  if (pending.size === 0) return;

  const batch = [...pending.values()].slice(0, BATCH_LIMIT);
  const results = await callOpenAIBatchClassifier(batch);
  if (!results) return;

  const fresh: [string, AiCacheEntry][] = [];
  for (const [index, entry] of results) {
    const input = batch[index];
    if (!input) continue;
    const key = cacheKeyOf(input);
    filterAiCache.set(key, entry, AI_CACHE_TTL_MS);
    fresh.push([key, entry]);
  }
  recordAiVerdicts(fresh);
}

export function layer9Ai(
  input: FilterInput,
  ai: AiCacheEntry | null,
): LayerResult {
  if (!ai) {
    // Reached when the gate opened but no classification came back: no
    // `OPENAI_API_KEY`, a rejected key, a timeout, or the breaker being open.
    // Distinguishing these matters on the debug endpoint — "unavailable" is an
    // operator problem, and it used to be reported as a clean skip.
    return {
      layer: 9,
      decision: "NEUTRAL",
      confidence: 0,
      reason: aiApiKey()
        ? "AI unavailable (call failed, timed out, or breaker open)"
        : "AI disabled (no GEMINI_API_KEY)",
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

  // 0. Persisted verdicts are cache hits — load before anything else so a
  //    previously-classified title stays blocked with no quota spend.
  await loadAiVerdicts();

  // 1. Fast path — cache hit.
  const cached = filterAiCache.get(cacheKey) as AiCacheEntry | undefined;
  if (cached) return cached;

  // 2. AI disabled (no key, or breaker open) — never hit the network.
  if (aiDisabled()) return null;

  // 3. Cache miss — call OpenAI.
  const result = await callSingleClassifier(input, context);
  if (result) {
    filterAiCache.set(cacheKey, result, AI_CACHE_TTL_MS);
    recordAiVerdicts([[cacheKey, result]]);
  }
  return result;
}

/**
 * Single-title classification. Used by the detail path and the debug endpoint;
 * list pages go through `prefetchAiClassifications` instead.
 */
async function callSingleClassifier(
  input: Pick<FilterInput, "title" | "overview">,
  context: { keywords: string[]; genres: string[] },
): Promise<AiCacheEntry | null> {
  const system = `${CLASSIFIER_RULES}\nReturn JSON with two keys: \`class\` \u2208 {SAFE, MATURE, EROTIC, PORNOGRAPHIC} and \`confidence\` \u2208 [0,1].`;

  const user = JSON.stringify({
    title: input.title,
    overview: input.overview,
    keywords: context.keywords,
    genres: context.genres,
  });

  const text = await callGemini(system, user, 1024, 8_000);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as {
      class?: ContentClass;
      confidence?: number;
    };
    if (!CONTENT_CLASSES.includes(parsed.class ?? ("" as ContentClass))) {
      return null;
    }
    return {
      class: parsed.class!,
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
    };
  } catch {
    return null;
  }
}

/**
 * One request, many titles. Returns `index → entry` for the items the model
 * actually classified — a short or reordered response just means fewer cache
 * entries get written, never a wrong one, because every result carries back
 * the index it belongs to.
 */
async function callOpenAIBatchClassifier(
  batch: AiClassifiable[],
): Promise<Map<number, AiCacheEntry> | null> {
  if (!aiApiKey()) return null;

  const system = [
    CLASSIFIER_RULES,
    "You will receive a JSON array of titles, each with an `i` index.",
    'Return JSON: {"results":[{"i":<index>,"class":"SAFE|MATURE|EROTIC|PORNOGRAPHIC","confidence":<0..1>}]}.',
    "Return one entry for every input index. Do not omit any.",
  ].join("\n");

  const user = JSON.stringify(
    batch.map((item, i) => ({
      i,
      title: item.title,
      overview: item.overview,
    })),
  );

  // Budget covers thinking tokens too — a 20-item page reasons for ~400 of
  // them before emitting ~100 of JSON, and a truncated response parses to
  // nothing at all.
  const text = await callGemini(system, user, 160 * batch.length + 1024, 20_000);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as {
      results?: { i?: number; class?: ContentClass; confidence?: number }[];
    };

    const out = new Map<number, AiCacheEntry>();
    for (const row of parsed.results ?? []) {
      if (typeof row.i !== "number" || !batch[row.i]) continue;
      if (!CONTENT_CLASSES.includes(row.class ?? ("" as ContentClass))) continue;
      out.set(row.i, {
        class: row.class!,
        confidence: Math.min(1, Math.max(0, row.confidence ?? 0.5)),
      });
    }
    return out;
  } catch {
    return null;
  }
}
