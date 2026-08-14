import { discoverQuerySchema } from "@/lib/schemas/api";
import { fail, ok } from "@/server/http/response";
import { fetchDiscover } from "@/server/services/tmdb.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = discoverQuerySchema.safeParse({
      type: searchParams.get("type") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      region: searchParams.get("region") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      withGenres: searchParams.get("withGenres") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
    });
    if (!parsed.success) return fail("Invalid discover query", 422);

    const data = await fetchDiscover({
      ...parsed.data,
      forceDiscover: false,
    });
    return ok({
      items: data.items,
      page: data.page,
      totalPages: data.totalPages,
      totalResults: data.totalResults,
    });
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Unable to fetch discover data",
      500,
    );
  }
}