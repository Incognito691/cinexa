/**
 * Text-analysis helpers used by Layer 5.
 */

import {
  TEXT_SOFT_SIGNALS,
  TEXT_STORYTELLING_SIGNALS,
  TEXT_STRONG_SIGNALS,
} from "./config/phrases";

const STRONG_WEIGHT = 1.0;
const SOFT_WEIGHT = 0.4;
const STORY_WEIGHT = -0.6;

export interface TextSignalScore {
  score: number;
  strongHits: string[];
  softHits: string[];
  storyHits: string[];
}

/** Lowercase + collapse whitespace + strip diacritics. Used for case-insensitive matching. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns true if `haystack` contains any of the phrases (after normalization). */
export function containsAnyPhrase(
  haystack: string,
  phrases: readonly string[],
): { hit: boolean; matched: string[] } {
  if (!haystack) return { hit: false, matched: [] };
  const hay = normalize(haystack);
  const matched: string[] = [];
  for (const phrase of phrases) {
    const needle = normalize(phrase);
    if (needle.length === 0) continue;
    if (hay.includes(needle)) matched.push(phrase);
  }
  return { hit: matched.length > 0, matched };
}

/** Compute a weighted text signal score across title + overview + tagline. */
export function scoreTextSignals(input: {
  title: string;
  overview: string;
  tagline?: string;
}): TextSignalScore {
  const blob = [input.title, input.overview, input.tagline ?? ""]
    .filter(Boolean)
    .join("\n");

  const strong = containsAnyPhrase(blob, TEXT_STRONG_SIGNALS);
  const soft = containsAnyPhrase(blob, TEXT_SOFT_SIGNALS);
  const story = containsAnyPhrase(blob, TEXT_STORYTELLING_SIGNALS);

  const score =
    strong.matched.length * STRONG_WEIGHT +
    soft.matched.length * SOFT_WEIGHT +
    story.matched.length * STORY_WEIGHT;

  return {
    score: Math.max(0, score),
    strongHits: strong.matched,
    softHits: soft.matched,
    storyHits: story.matched,
  };
}
