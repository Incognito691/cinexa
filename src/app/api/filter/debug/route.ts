import { runPipeline } from "@/server/filter/pipeline";
import { fetchMovieDetailForFilter, fetchTvDetailForFilter } from "@/server/tmdb";
import { fail, ok } from "@/server/http/response";

/**
 * Debug endpoint: returns the full per-layer breakdown for one title so
 * operators can answer "why is movie X missing?" in seconds.
 *
 * GET /api/filter/debug?type=movie&tmdbId=27205
 * GET /api/filter/debug?type=tv&tmdbId=1399
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const tmdbIdRaw = searchParams.get("tmdbId");

    if (type !== "movie" && type !== "tv") {
      return fail("type must be 'movie' or 'tv'", 422);
    }
    if (!tmdbIdRaw) {
      return fail("tmdbId is required", 422);
    }
    const tmdbIdNum = Number(tmdbIdRaw);
    if (!Number.isFinite(tmdbIdNum)) {
      return fail("tmdbId must be a number", 422);
    }

    // Fetch full detail so the pipeline has every signal available.
    const detail =
      type === "movie"
        ? await fetchMovieDetailForFilter(tmdbIdNum)
        : await fetchTvDetailForFilter(tmdbIdNum);

    if (!detail) {
      return fail(`No TMDB detail found for ${type}/${tmdbIdNum}`, 404);
    }

    const decision = await runPipeline(detail.input);

    return ok({
      visible: decision.visible,
      classification: decision.classification,
      confidence: decision.confidence,
      reason: decision.reason,
      blockedBy: decision.layers
        .filter((l) => l.decision === "BLOCK")
        .map((l) => `L${l.layer}: ${l.reason}`),
      layers: decision.layers,
      meta: { tmdbId: detail.input.tmdbId, type, title: detail.input.title },
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Filter debug failed",
      500,
    );
  }
}
