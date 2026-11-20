import { describe, expect, it } from "vitest";

import { isUnreleased, isUnreleasedTitle, releaseLabel } from "./release";

const NOW = new Date("2026-11-20T10:00:00Z");

describe("release checks", () => {
  it("locks future dates only", () => {
    expect(isUnreleased("2028-03-12", NOW)).toBe(true);
    expect(isUnreleased("2026-11-20", NOW)).toBe(false); // out today
    expect(isUnreleased("2020-01-01", NOW)).toBe(false);
    expect(isUnreleased(null, NOW)).toBe(false);
  });

  it("uses TMDB's status for undated films, and requires a date for shows", () => {
    expect(isUnreleasedTitle({ mediaType: "movie", releaseDate: null, status: "Post Production" }, NOW)).toBe(true);
    expect(isUnreleasedTitle({ mediaType: "movie", releaseDate: null, status: "Released" }, NOW)).toBe(false);
    expect(isUnreleasedTitle({ mediaType: "tv", releaseDate: null, status: "Planned" }, NOW)).toBe(true);
    expect(isUnreleasedTitle({ mediaType: "tv", releaseDate: "2005-09-13", status: "Ended" }, NOW)).toBe(false);
  });

  it("formats the date", () => {
    expect(releaseLabel("2028-03-12")).toBe("Mar 12, 2028");
    expect(releaseLabel(null)).toBeNull();
  });
});
