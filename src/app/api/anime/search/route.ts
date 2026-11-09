import { z } from "zod";

import { fail, ok } from "@/server/http/response";
import { searchAnime } from "@/server/anilist/home";

const querySchema = z.object({ q: z.string().trim().min(1).max(100) });

/** GET /api/anime/search?q=frieren — anime-only suggestions from AniList. */
export async function GET(request: Request) {
  try {
    const parsed = querySchema.safeParse({
      q: new URL(request.url).searchParams.get("q") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid search query", 422);

    return ok(await searchAnime(parsed.data.q));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to search anime", 500);
  }
}
