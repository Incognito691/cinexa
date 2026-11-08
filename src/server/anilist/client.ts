const ANILIST_ENDPOINT = "https://graphql.anilist.co";

/**
 * The one AniList GraphQL wrapper. Free, no key.
 *
 * AniList rate-limits to 30 requests a minute (it was 90; the header says
 * 30 today), so callers batch with GraphQL aliases and lean on `revalidate`:
 * the anime page costs one request per cache window, not one per visit.
 */
export async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidate: number,
): Promise<T> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`AniList failed: ${res.status}`);

  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!body.data) throw new Error(`AniList: ${body.errors?.[0]?.message ?? "no data"}`);
  return body.data;
}
