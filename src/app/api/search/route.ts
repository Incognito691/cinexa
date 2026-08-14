import { fetchSearch } from "@/server/tmdb";
import { searchQuerySchema } from "@/server/tmdb/schemas";
import { fail, ok } from "@/server/http/response";

/**
 * GET /api/search?q=inception&type=movie&page=1
 *
 * Thin wrapper over `fetchSearch`, which runs the list-level content filter
 * so adult content never reaches the client.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = searchQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid search query", 422);

    return ok(await fetchSearch(parsed.data));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to search",
      500,
    );
  }
}
