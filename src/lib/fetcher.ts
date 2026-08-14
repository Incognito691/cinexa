import type { ApiResponse } from "@/types/api";

/**
 * The shared client-side fetcher.
 *
 * Every API route returns `{ ok: true, data } | { ok: false, error }` (see
 * `server/http/response.ts`). This unwraps that envelope and throws on
 * failure, so callers — and the React Query hooks above them — only ever deal
 * in the payload type. Feature-specific fetchers live in
 * `features/<name>/api.ts` and build on this.
 */
export async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.ok) {
    throw new Error(body.ok ? "Request failed" : body.error);
  }

  return body.data;
}
