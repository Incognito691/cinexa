import { fail, ok } from "@/server/http/response";
import { fetchMovieCast } from "@/server/tmdb";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await fetchMovieCast(id);
    return ok(data);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to fetch credits",
      500,
    );
  }
}
