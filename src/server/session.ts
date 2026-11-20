import { cache } from "react";

import { auth } from "@/auth";

/**
 * The session, looked up **once per request**.
 *
 * Sessions live in the database, so every `auth()` is a query. A page used to
 * make one per caller (the topbar avatar, `isSignedIn`, watched ticks, resume
 * position, library keys…), all in parallel, which exhausted the 5-connection
 * pool and surfaced as AdapterError / "Timed out fetching a new connection".
 * `cache` dedupes them within a render; a failure reads as signed out.
 */
export const getSession = cache(async () => {
  try {
    return await auth();
  } catch {
    return null;
  }
});

/**
 * The signed-in user's id, or null.
 *
 * Every personal feature (watch history, favourites, collections) starts here,
 * and every one of them treats null as "no-op, render the signed-out state"
 * rather than as an error — login is optional, so browsing and playback must
 * keep working without a session.
 *
 * The catch matters as much as the happy path: `auth()` throws when the app is
 * running without a database or OAuth credentials, which is the normal state
 * of a fresh clone. Swallowing that into "signed out" keeps the whole site up
 * instead of 500ing every page that happens to render a heart icon.
 */
export async function currentUserId(): Promise<string | null> {
  return (await getSession())?.user?.id ?? null;
}
