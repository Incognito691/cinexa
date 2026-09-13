import { fail, ok } from "@/server/http/response";
import { getLibraryKeys } from "@/server/library";

/**
 * Which titles the current user has hearted or collected.
 *
 * A route rather than a server prop because `MediaCard` renders on
 * client-fetched surfaces too (explore), where there's no server context to
 * drill state down from. Every button on the page reads the same React Query
 * key, so the query is deduped to one request no matter how many posters are
 * on screen.
 *
 * Signed out returns empty arrays with a 200, not a 401 — a signed-out visitor
 * asking "what have I favourited" has a legitimate answer: nothing.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getLibraryKeys());
  } catch {
    return fail("Could not load your library", 500);
  }
}
