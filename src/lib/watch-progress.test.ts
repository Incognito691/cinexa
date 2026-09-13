import { describe, expect, it } from "vitest";

import {
  isFinished,
  progressRatio,
  timeLeftLabel,
} from "./watch-progress";

/**
 * The thresholds these guard are product decisions, not arithmetic: a title at
 * 95% drops off Continue Watching, and a runtime of 0 means "unknown", which
 * must never render as 0%.
 */
describe("watch progress", () => {
  it("treats an unknown runtime as unmeasurable, not as zero", () => {
    expect(progressRatio(0, 0)).toBeNull();
    expect(progressRatio(600, 0)).toBeNull();
    expect(timeLeftLabel(600, 0)).toBeNull();
    expect(isFinished(600, 0)).toBe(false);
  });

  it("clamps the ratio to 0..1", () => {
    expect(progressRatio(-5, 100)).toBe(0);
    expect(progressRatio(150, 100)).toBe(1);
    expect(progressRatio(25, 100)).toBe(0.25);
  });

  it("finishes at 95%, not before", () => {
    expect(isFinished(94, 100)).toBe(false);
    expect(isFinished(95, 100)).toBe(true);
  });

  it("formats time left the way the card reads it", () => {
    expect(timeLeftLabel(0, 32 * 60)).toBe("32m left");
    expect(timeLeftLabel(60 * 60, 132 * 60)).toBe("1h 12m left");
    expect(timeLeftLabel(60 * 60, 120 * 60)).toBe("1h left");
    expect(timeLeftLabel(100, 100)).toBe("Finished");
  });
});
