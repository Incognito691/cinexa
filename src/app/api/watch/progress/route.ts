import { z } from "zod";

import { fail, ok } from "@/server/http/response";
import { saveProgress } from "@/server/watch-history";

/**
 * Playback position sink for `WatchTracker`.
 *
 * A route rather than a server action because the tracker's last write happens
 * on `pagehide`, where only `navigator.sendBeacon` is guaranteed to survive the
 * navigation — a server action in flight dies with the page.
 *
 * Signed out is a 200 no-op, not a 401: login is optional, and the tracker
 * shouldn't have to know whether there's a session to decide whether to send.
 */
const bodySchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  season: z.number().int().min(0).optional(),
  episode: z.number().int().min(0).optional(),
  positionSeconds: z.number().min(0).max(24 * 60 * 60),
  runtimeSeconds: z.number().min(0).max(24 * 60 * 60),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("Invalid JSON body", 422);
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  try {
    return ok({ saved: await saveProgress(parsed.data) });
  } catch {
    return fail("Could not save progress", 500);
  }
}
