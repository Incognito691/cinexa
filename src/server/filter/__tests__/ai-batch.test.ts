import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The layer resolves its key through `aiApiKey()`; stub it so the batch path
// runs without touching the real environment.
vi.mock("@/lib/env", () => ({
  env: { GEMINI_API_KEY: "test-key", TMDB_API_KEY: "test" },
  aiApiKey: () => "test-key",
}));

// Stub the durable store: these tests must not read or write the real
// `data/ai-verdicts.json`, which ships as the app's blocklist.
vi.mock("../ai-store", () => ({
  loadAiVerdicts: async () => {},
  recordAiVerdicts: () => {},
}));

import { filterAiCache } from "../cache";
import { prefetchAiClassifications } from "../layers/layer-9-ai";

const BATCH = [
  { tmdbId: 1, mediaType: "movie" as const, title: "Parasite", overview: "A poor family schemes." },
  { tmdbId: 2, mediaType: "movie" as const, title: "Exchange Wife 2", overview: "An art dealer." },
  { tmdbId: 3, mediaType: "movie" as const, title: "Oldboy", overview: "A man seeks revenge." },
];

/** Mimics Gemini's `candidates[].content.parts[].text` envelope. */
function mockGemini(results: unknown) {
  return vi.fn(async (_url: string, init: { body: string }) => {
    void init;
    return new Response(
      JSON.stringify({
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ results }) }] } },
        ],
      }),
      { status: 200 },
    );
  });
}

describe("prefetchAiClassifications", () => {
  beforeEach(() => filterAiCache.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("maps verdicts back to the right title even when the model reorders them", async () => {
    // Deliberately out of order: a positional zip would block Parasite.
    vi.stubGlobal(
      "fetch",
      mockGemini([
        { i: 2, class: "SAFE", confidence: 0.9 },
        { i: 1, class: "EROTIC", confidence: 0.93 },
        { i: 0, class: "MATURE", confidence: 0.8 },
      ]),
    );

    await prefetchAiClassifications(BATCH);

    expect(filterAiCache.get("movie:1")).toMatchObject({ class: "MATURE" });
    expect(filterAiCache.get("movie:2")).toMatchObject({ class: "EROTIC" });
    expect(filterAiCache.get("movie:3")).toMatchObject({ class: "SAFE" });
  });

  it("issues one request for the whole batch and skips already-cached titles", async () => {
    const fetchMock = mockGemini([{ i: 0, class: "EROTIC", confidence: 0.9 }]);
    vi.stubGlobal("fetch", fetchMock);

    filterAiCache.set("movie:1", { class: "SAFE", confidence: 1 }, 60_000);
    filterAiCache.set("movie:3", { class: "SAFE", confidence: 1 }, 60_000);
    await prefetchAiClassifications(BATCH);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const sent = JSON.parse(body.contents[0].parts[0].text);
    expect(sent).toHaveLength(1);
    expect(sent[0].title).toBe("Exchange Wife 2");
    expect(filterAiCache.get("movie:2")).toMatchObject({ class: "EROTIC" });
  });

  it("makes no request when every title is cached", async () => {
    const fetchMock = mockGemini([]);
    vi.stubGlobal("fetch", fetchMock);
    for (const id of [1, 2, 3]) {
      filterAiCache.set(`movie:${id}`, { class: "SAFE", confidence: 1 }, 60_000);
    }

    await prefetchAiClassifications(BATCH);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops malformed rows instead of caching a bogus class", async () => {
    vi.stubGlobal(
      "fetch",
      mockGemini([
        { i: 0, class: "NOT_A_CLASS", confidence: 0.9 },
        { i: 99, class: "EROTIC", confidence: 0.9 },
        { i: 1, class: "EROTIC", confidence: 5 },
      ]),
    );

    await prefetchAiClassifications(BATCH);

    expect(filterAiCache.get("movie:1")).toBeUndefined();
    // Confidence is clamped into [0,1] rather than trusted verbatim.
    expect(filterAiCache.get("movie:2")).toMatchObject({ class: "EROTIC", confidence: 1 });
  });

  it("never throws when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    await expect(prefetchAiClassifications(BATCH)).resolves.toBeUndefined();
    expect(filterAiCache.get("movie:1")).toBeUndefined();
  });
});
