import { fail, ok } from "@/server/http/response";
import { fetchTrending } from "@/server/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeRaw = searchParams.get("type");
    const windowRaw = searchParams.get("window");
    const pageRaw = searchParams.get("page");

    const type = typeRaw === "movie" || typeRaw === "tv" ? typeRaw : "all";
    const window = windowRaw === "day" ? "day" : "week";
    const page = Number(pageRaw) > 0 ? Number(pageRaw) : 1;

    const data = await fetchTrending({ type, window, page });
    return ok(data);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to fetch trending",
      500,
    );
  }
}