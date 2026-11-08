import { describe, expect, it, vi } from "vitest";

import type { ListPayload } from "@/types/api";
import type { MediaCardItem } from "@/types/media";

import { drawRandom } from "./draw";

const item = (id: number, posterPath: string | null = "/p.jpg"): MediaCardItem => ({
  id,
  mediaType: "movie",
  title: `T${id}`,
  overview: "",
  posterPath,
  backdropPath: null,
  releaseDate: null,
  rating: 0,
  popularity: 0,
});

const payload = (items: MediaCardItem[], totalPages = 1): ListPayload => ({
  items,
  page: 1,
  totalPages,
  totalResults: items.length,
});

describe("drawRandom", () => {
  it("falls back to page 1 when the guessed page is past the end", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const fetchPage = vi.fn(async (page: number) =>
      page === 1 ? payload([item(7)], 1) : payload([], 1),
    );
    const { pick, totalPages } = await drawRandom(fetchPage, undefined);
    expect(fetchPage).toHaveBeenCalledWith(5);
    expect(fetchPage).toHaveBeenLastCalledWith(1);
    expect(pick?.id).toBe(7);
    expect(totalPages).toBe(1);
    vi.restoreAllMocks();
  });

  it("skips posterless titles and the previous pick when it can", async () => {
    const res = payload([item(1), item(2, null), item(3)]);
    for (let n = 0; n < 20; n++) {
      const { pick } = await drawRandom(async () => res, 1, 1);
      expect(pick?.id).toBe(3);
    }
    // Only the previous pick left: repeat it rather than show nothing.
    const { pick } = await drawRandom(async () => payload([item(1)]), 1, 1);
    expect(pick?.id).toBe(1);
  });
});
