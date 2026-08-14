import { fail, ok } from "@/server/http/response";
import { fetchMovieVideos } from "@/server/services/tmdb.service";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await fetchMovieVideos(id);
    return ok(data);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to fetch videos",
      500,
    );
  }
}