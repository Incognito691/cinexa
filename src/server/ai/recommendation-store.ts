import { prisma } from "@/server/db";

/**
 * One day's AI suggestions per user.
 *
 * This lives in Postgres, not on disk, and that distinction is load-bearing.
 * The first version wrote a JSON file next to `data/ai-verdicts.json`, which
 * works locally and fails silently on Vercel — serverless filesystems are
 * read-only. Every read would miss and every write would be swallowed, so a
 * signed-in user reloading the home page would spend one of the twenty daily
 * Gemini requests *per render*. Twenty page views and the budget is gone.
 *
 * Postgres is already there for the session, and recommendations only run for
 * signed-in users, so the database is guaranteed available on this path.
 *
 * Everything here fails soft. A database hiccup returns "no cached
 * suggestions", which costs a request at worst — never an error page.
 */

const today = () => new Date().toISOString().slice(0, 10);

/** Today's stored titles for this user, or null if none were made today. */
export async function readSuggestions(
  userId: string,
): Promise<string[] | null> {
  try {
    const row = await prisma.aiSuggestion.findUnique({
      where: { userId },
      select: { day: true, titles: true },
    });
    return row && row.day === today() && row.titles.length > 0
      ? row.titles
      : null;
  } catch {
    return null;
  }
}

export async function writeSuggestions(
  userId: string,
  titles: string[],
): Promise<void> {
  const day = today();
  try {
    await prisma.aiSuggestion.upsert({
      where: { userId },
      update: { day, titles },
      create: { userId, day, titles },
    });
  } catch {
    // Persistence is an optimisation. Losing it costs a request tomorrow,
    // not a broken rail today.
  }
}
