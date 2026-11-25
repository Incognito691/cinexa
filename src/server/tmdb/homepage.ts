import { unstable_cache } from "next/cache";

/**
 * TMDB's `homepage` is community-edited and goes stale: a store page gets
 * pulled and the "Official site" link lands on a 404 (Paatal Lok's Amazon
 * page). Fetch it once a day and drop it only on a definite 404/410. Bot
 * walls, 5xx and timeouts keep the link, since they say nothing about it.
 * GET rather than HEAD: Amazon and Netflix answer HEAD with 405.
 */
const isDead = unstable_cache(
  async (url: string): Promise<boolean> => {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        },
      });
      void res.body?.cancel();
      return res.status === 404 || res.status === 410;
    } catch {
      return false;
    }
  },
  ["homepage-dead"],
  { revalidate: 86_400 },
);

export async function liveHomepage(url: string | null): Promise<string | null> {
  if (!url) return null;
  return (await isDead(url)) ? null : url;
}
