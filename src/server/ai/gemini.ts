import { aiApiKey } from "@/lib/env";

/**
 * The single Gemini client.
 *
 * Extracted from `filter/layers/layer-9-ai.ts` when recommendations became a
 * second consumer. The extraction is the point, not tidiness: **the free tier
 * is 20 requests per day for the whole project**, so a second feature with its
 * own client and its own circuit breaker would happily spend the filter's
 * budget and then discover the 429 separately. One module, one breaker, one
 * budget.
 *
 * Everything here fails soft. A missing key, a dead network, an exhausted
 * quota — all return `null`, and every caller is expected to have a
 * deterministic fallback. Nothing on this site may depend on the model
 * answering.
 */

const AI_MODEL = "gemini-3.6-flash";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const BREAKER_COOLDOWN_MS = 60_000;

/**
 * ponytail: module-level state, correct for a single process. Move to Redis
 * or the database if this ever runs multi-instance — until then a shared
 * timestamp is the whole implementation.
 */
let breakerOpenUntil = 0;

/** True when a call would be pointless: no key, or the breaker is open. */
export function aiUnavailable(): boolean {
  return !aiApiKey() || Date.now() < breakerOpenUntil;
}

export function tripBreakerFor(ms: number): void {
  breakerOpenUntil = Math.max(breakerOpenUntil, Date.now() + ms);
}

/**
 * Gemini returns 429 with a `RetryInfo.retryDelay` ("42s") when the project is
 * over quota. The free tier cap is *daily*, so retrying on the default
 * one-minute cooldown just burns tomorrow's budget on 429s — honour the delay
 * the API asks for instead.
 */
export function cooldownFromError(status: number, body: string): number {
  if (status !== 429) return BREAKER_COOLDOWN_MS;
  const seconds = Number(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body)?.[1]);
  return Number.isFinite(seconds)
    ? Math.max(seconds * 1000, BREAKER_COOLDOWN_MS)
    : BREAKER_COOLDOWN_MS;
}

/**
 * One Gemini call. Returns the model's raw text, or `null` on any failure
 * (tripping the breaker).
 *
 * `maxOutputTokens` has to cover *thinking* tokens as well as the JSON —
 * Gemini counts both — or the response comes back truncated and unparseable.
 */
export async function callGemini(
  systemText: string,
  userText: string,
  maxOutputTokens: number,
  timeoutMs: number,
): Promise<string | null> {
  const key = aiApiKey();
  if (!key) return null;

  try {
    const res = await fetch(GEMINI_ENDPOINT(AI_MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          maxOutputTokens,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      // We cache results ourselves; don't let the framework cache too.
      cache: "no-store",
    });

    if (!res.ok) {
      tripBreakerFor(cooldownFromError(res.status, await res.text()));
      return null;
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    // Network error or timeout — short cooldown, it may well be transient.
    tripBreakerFor(BREAKER_COOLDOWN_MS);
    return null;
  }
}

/** Test seam. */
export function __resetBreaker(): void {
  breakerOpenUntil = 0;
}
