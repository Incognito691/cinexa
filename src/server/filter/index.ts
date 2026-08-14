/**
 * Public API of the content-filter module.
 *
 *   `classify(input)`                — single item, full decision
 *   `applyContentFilterListLevel(items)`  — fast path used by list endpoints
 *   `applyContentFilterFull(items)`       — full path used by detail pages
 *
 * See `apply.ts` for the difference between list-level and full pipelines.
 */
import type { FilterDecision, FilterInput } from "./types";
import { runPipeline } from "./pipeline";
import {
  applyContentFilterListLevel,
  applyContentFilterFull,
} from "./apply";

export { runPipeline, applyContentFilterListLevel, applyContentFilterFull };
export { classifyWithAI } from "./layers/layer-9-ai";

export type {
  ContentClass,
  FilterDecision,
  FilterInput,
  LayerDecision,
  LayerNumber,
  LayerResult,
  ListLevelSignals,
} from "./types";

/** Convenience one-shot: classify a single item. */
export function classify(input: FilterInput): Promise<FilterDecision> {
  return runPipeline(input);
}

