import { z } from "zod";

import { fail, ok } from "@/server/http/response";
import { randomAnime } from "@/server/anilist/home";

const querySchema = z.object({
  genre: z.string().trim().min(1).max(40).optional(),
  exclude: z.coerce.number().int().positive().optional(),
});

/** GET /api/anime/random?genre=Action&exclude=21 — one random anime for Surprise. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      genre: searchParams.get("genre") ?? undefined,
      exclude: searchParams.get("exclude") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid query", 422);

    return ok(await randomAnime(parsed.data.genre ?? null, parsed.data.exclude));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to pick an anime", 500);
  }
}
