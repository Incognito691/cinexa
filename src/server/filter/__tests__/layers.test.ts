import { describe, expect, it } from "vitest";

import { layer1Adult } from "../layers/layer-1-adult";
import { layer5Text } from "../layers/layer-5-text-analysis";
import { layer6Genres } from "../layers/layer-6-genres";
import { layer7ManualBlacklist } from "../layers/layer-7-manual-blacklist";
import { layer8ManualWhitelist } from "../layers/layer-8-manual-whitelist";
import { layer4Keywords } from "../layers/layer-4-keywords";
import { scoreTextSignals, normalize } from "../text-analysis";
import { decide, shouldInvokeAI, scoreOfLayers } from "../confidence";

import type { FilterInput } from "../types";

function input(over: Partial<FilterInput> = {}): FilterInput {
  return {
    tmdbId: 999,
    mediaType: "movie",
    adult: false,
    title: "X",
    overview: "...",
    keywords: [],
    genres: [],
    productionCompanyIds: [],
    networkIds: [],
    ...over,
  };
}

describe("layer 1 — TMDB adult flag", () => {
  it("returns NEUTRAL with +0.8 confidence when adult=true", () => {
    const r = layer1Adult(input({ adult: true }));
    expect(r.decision).toBe("NEUTRAL");
    expect(r.class).toBe("PORNOGRAPHIC");
    expect(r.confidence).toBe(0.8);
  });

  it("returns PASS when adult=false", () => {
    const r = layer1Adult(input({ adult: false }));
    expect(r.decision).toBe("PASS");
  });
});

describe("layer 4 — keyword blacklist", () => {
  it("blocks on softcore keyword", () => {
    const r = layer4Keywords(
      input({ keywords: ["softcore", "housewife"] }),
    );
    expect(r.decision).toBe("BLOCK");
    expect(r.class).toBe("EROTIC");
  });

  it("passes when no keywords provided", () => {
    const r = layer4Keywords(input());
    expect(r.decision).toBe("PASS");
  });

  it("passes when keywords are clean", () => {
    const r = layer4Keywords(input({ keywords: ["heist", "courtroom"] }));
    expect(r.decision).toBe("PASS");
  });
});

describe("layer 5 — text analysis", () => {
  it("strong signals tip the score above 0.8", () => {
    const r = layer5Text(
      input({
        title: "Husn",
        overview: "A lonely housewife explores forbidden desires with strangers.",
      }),
    );
    expect(r.decision).toBe("BLOCK");
    expect(r.class).toBe("EROTIC");
  });

  it("storytelling phrases reduce the score", () => {
    const r = layer5Text(
      input({
        title: "True Crime",
        overview:
          "A detective investigates a serial killer. Courtroom drama ensues.",
      }),
    );
    expect(r.decision).toBe("PASS");
    expect(r.confidence).toBe(0);
  });
});

describe("layer 6 — genre (never blocks alone)", () => {
  it("returns NEUTRAL even on adult-leaning genres", () => {
    const r = layer6Genres(input({ genres: ["Erotic", "Adult"] }));
    expect(r.decision).toBe("NEUTRAL");
  });

  it("returns NEUTRAL on mainstream genres", () => {
    const r = layer6Genres(input({ genres: ["Drama", "Crime"] }));
    expect(r.decision).toBe("NEUTRAL");
  });
});

describe("layer 7 + 8 — manual lists", () => {
  it("L7 returns BLOCK for hardcoded ID (id=0 in default config = no hit, so PASS)", () => {
    // The default config has empty arrays; L7 is correctly wired but
    // produces PASS for inputs not in the list.
    const r = layer7ManualBlacklist(input());
    expect(r.decision).toBe("PASS");
  });

  it("L8 returns PASS+SAFE for whitelisted ID 27205", () => {
    const r = layer8ManualWhitelist(input({ tmdbId: 27205 }));
    expect(r.decision).toBe("PASS");
    expect(r.class).toBe("SAFE");
    expect(r.confidence).toBe(1);
  });
});

describe("text-analysis helpers", () => {
  it("normalize lowercases and strips diacritics", () => {
    expect(normalize("Café São João")).toBe("cafe sao joao");
  });

  it("scoreTextSignals aggregates hits", () => {
    const result = scoreTextSignals({
      title: "Husn",
      overview: "A lonely housewife explores forbidden desires.",
    });
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });
});

describe("shouldInvokeAI", () => {
  it("returns false once the deterministic layers already block", () => {
    const layers = [
      { layer: 1 as const, decision: "PASS" as const, confidence: 0, reason: "x" },
      { layer: 5 as const, decision: "PASS" as const, confidence: 0, reason: "y" },
    ];
    expect(shouldInvokeAI(layers, 0.95)).toBe(false);
  });

  it("returns false on a manual blacklist or network/company match", () => {
    const l7 = [{ layer: 7 as const, decision: "BLOCK" as const, confidence: 1, reason: "blacklist" }];
    expect(shouldInvokeAI(l7, 0.2)).toBe(false);

    const l3 = [{ layer: 3 as const, decision: "BLOCK" as const, confidence: 1, reason: "company" }];
    expect(shouldInvokeAI(l3, 0.2)).toBe(false);
  });

  // The regression this whole layer exists for: non-English softcore trips
  // none of the deterministic layers, so it scores 0. Silence has to mean
  // "ask the model", not "declare it safe".
  it("returns true when no deterministic layer found anything", () => {
    const layers = [
      { layer: 1 as const, decision: "PASS" as const, confidence: 0, reason: "no adult flag" },
      { layer: 5 as const, decision: "PASS" as const, confidence: 0, reason: "text score 0.00" },
    ];
    expect(shouldInvokeAI(layers, 0)).toBe(true);
  });

  it("returns true when L1 hits and score is mid-range", () => {
    const layers = [
      { layer: 1 as const, decision: "NEUTRAL" as const, class: "PORNOGRAPHIC" as const, confidence: 0.8, reason: "adult flag" },
      { layer: 5 as const, decision: "PASS" as const, confidence: 0.2, reason: "no text" },
    ];
    expect(shouldInvokeAI(layers, 0.5)).toBe(true);
  });
});

describe("scoreOfLayers + decide integration", () => {
  it("Pink (L1 + L5 mid) → MATURE, visible", async () => {
    const layers = [
      { layer: 1 as const, decision: "NEUTRAL" as const, class: "PORNOGRAPHIC" as const, confidence: 0.8, reason: "adult flag" },
      { layer: 2 as const, decision: "PASS" as const, confidence: 0, reason: "no networks" },
      { layer: 5 as const, decision: "PASS" as const, confidence: 0.2, reason: "no text" },
    ];
    const score = scoreOfLayers(layers);
    expect(score).toBeGreaterThan(0.45);
    const decision = decide(layers);
    expect(decision.visible).toBe(true);
    expect(decision.classification).toBe("MATURE");
  });
});
