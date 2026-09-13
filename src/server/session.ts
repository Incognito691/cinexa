import { auth } from "@/auth";

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
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
