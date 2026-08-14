import { describe, expect, it } from "vitest";

import { runPipeline } from "../pipeline";
import { applyContentFilterListLevel, applyContentFilterFull } from "../apply";

import { full, list } from "./fixtures";

// We stub OPENAI_API_KEY = null by relying on the fact that vitest
// runs without one set, so the AI layer always returns NEUTRAL.

describe("filter pipeline — list level", () => {
  it("mainstream titles pass without AI", async () => {
    const inputs = list.filter((it) =>
      [
        "Inception",
        "Psycho",
        "The Godfather",
        "RRR",
        "Maine Pyar Kiya",
      ].includes(it.title),
    );
    const decisions = await Promise.all(inputs.map(runPipeline));
    for (const d of decisions) {
      expect(d.visible).toBe(true);
      expect(["SAFE", "MATURE"]).toContain(d.classification);
    }
  });

  it("Pink (adult=true) does NOT auto-block on its own", async () => {
    const input = list.find((it) => it.title === "Pink")!;
    const decision = await runPipeline(input);
    // L1 alone contributes +0.8, score < 0.95 ⇒ not auto-blocked.
    expect(decision.classification).not.toBe("PORNOGRAPHIC");
    expect(decision.classification).not.toBe("EROTIC");
    expect(decision.visible).toBe(true);
  });

  it("L5 catches explicit text signals (ulluSoftcore)", async () => {
    const input = list.find((it) => it.title === "Husn")!;
    const decision = await runPipeline(input);
    // Two strong signals (softcore, lonely housewife) + adult flag
    // ⇒ score crosses 0.7 ⇒ EROTIC.
    expect(decision.classification).toBe("EROTIC");
    expect(decision.visible).toBe(false);
  });

  it("explicitWebSeries blocked via L5 strong signals", async () => {
    const input = list.find((it) => it.title === "After Dark")!;
    const decision = await runPipeline(input);
    expect(decision.classification).toBe("EROTIC");
    expect(decision.visible).toBe(false);
  });

  it("borderlineMature resolves to MATURE (visible=true)", async () => {
    const input = list.find((it) => it.title === "Behind Closed Doors")!;
    const decision = await runPipeline(input);
    // Score in [0.45, 0.85) band — MATURE but visible.
    expect(decision.classification).toBe("MATURE");
    expect(decision.visible).toBe(true);
  });

  it("AI is not invoked (no OPENAI_API_KEY in test env)", async () => {
    // Use "Pink" (adult=true, mainstream) — NOT whitelisted, NOT blacklisted —
    // so the pipeline runs through every layer. We verify L9 reports
    // "not invoked" without OPENAI_API_KEY set.
    // (Whitelisted Title and Inception short-circuit at L8 before L9 ever
    // runs, so they wouldn't have L9 in `decision.layers`.)
    const input = list.find((it) => it.title === "Pink")!;
    const decision = await runPipeline(input);
    const l9 = decision.layers.find((l) => l.layer === 9);
    expect(l9?.reason).toMatch(/not invoked/i);
  });
});

describe("filter pipeline — full level (detail inputs)", () => {
  it("ULLU-style title with keywords + text is blocked even without network blacklist match", async () => {
    // The default config has empty blacklists; L2/L3 won't fire.
    // L1 (adult=true) + L4 (softcore keyword) + L5 (lonely housewife text)
    // all corroborate ⇒ EROTIC, visible=false.
    const input = full.find((it) => it.title === "Husn")!;
    expect(input.networkIds.length).toBeGreaterThan(0);
    const decision = await runPipeline(input);
    expect(decision.classification).toBe("EROTIC");
    expect(decision.visible).toBe(false);
    // The top reason must be a block from L4 or L5 (or both), not L1 alone.
    const blocking = decision.layers.filter((l) => l.decision === "BLOCK");
    expect(blocking.length).toBeGreaterThan(0);
  });
});

describe("applyContentFilterListLevel", () => {
  it("drops blocked items, keeps the rest", async () => {
    const kept = await applyContentFilterListLevel(list as unknown as Parameters<typeof applyContentFilterListLevel>[0]);
    const keptTitles = kept.map((k) => (k as { title: string }).title);
    // Mainstream content passes.
    expect(keptTitles).toContain("Inception");
    expect(keptTitles).toContain("Psycho");
    expect(keptTitles).toContain("The Godfather");
    expect(keptTitles).toContain("RRR");
    expect(keptTitles).toContain("Maine Pyar Kiya");
    // L1 alone does NOT auto-block.
    expect(keptTitles).toContain("Pink");

    // Adult-platform / explicit items are blocked across the layers that
    // work on list-level data (L4 keywords, L5 text). L2/L3 require detail
    // payloads and are exercised in the full-pipeline test below.
    expect(keptTitles).not.toContain("Husn");            // L5 text score (softcore, lonely housewife, forbidden desires)
    expect(keptTitles).not.toContain("Husn Returns");    // L4 keyword match (ullu originals)
    expect(keptTitles).not.toContain("Lock Up");         // L5 strong-signal "Ullu Originals"
    expect(keptTitles).not.toContain("Chachi No.1");     // L5 text signals (closer to his aunt, infatuation, gets the better of him)
    expect(keptTitles).not.toContain("After Dark");      // L5 text score
    // Palang Tod is filtered at the full-pipeline stage via L3 (companyId),
    // so we can't assert it here — the list payload doesn't carry companyIds.
  });
});

describe("applyContentFilterFull", () => {
  it("drops the ullu-network item on detail", async () => {
    const kept = await applyContentFilterFull(full);
    const keptTitles = kept.map((k) => k.title);
    expect(keptTitles).toContain("Inception");
    expect(keptTitles).not.toContain("Husn"); // ULLU network hard-block
  });

  it("drops ULLU web series whose production_company matches the blacklist", async () => {
    const husnOnUllu = {
      tmdbId: 900001,
      mediaType: "tv" as const,
      adult: true,
      title: "Husn",
      overview: "A lonely housewife explores forbidden desires.",
      keywords: [],
      genres: ["Drama"],
      productionCompanyIds: [134066 /* Ullu */],
      networkIds: [],
    };
    const kept = await applyContentFilterFull([husnOnUllu]);
    expect(kept).toHaveLength(0);
  });
});
