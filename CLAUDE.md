# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Cinexa

A movie/TV streaming UI built with Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui. Metadata from TMDB; playback via SuperEmbed and WebTorrent + YTS. The codebase is split into a server-rendered Next.js app and a client UI that fetches data through App-Router route handlers, with a strong content-filter pipeline sitting between TMDB and the user.

## Environment

- Node 24 LTS (`.nvmrc` pins this) and npm ≥ 10
- `src/lib/env.ts` (Zod) validates exactly two vars, both optional at parse time:
  - `TMDB_API_KEY` — the only var the app actually needs to run; every TMDB call reaches it via `requireServerEnv("TMDB_API_KEY")`, which throws at request time if unset
  - `OPENAI_API_KEY` — optional; when absent, filter layer 9 (AI) is a hard no-op
- `.env.example` also lists `NEXTAUTH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`. Nothing reads them yet — auth/db are unbuilt. Add them to `envSchema` when you wire those up.
- Server code must go through `requireServerEnv()`, never `process.env` directly.

## Commands

```bash
npm run dev         # next dev (port 3000)
npm run build       # next build
npm run start       # next start
npm run lint        # next lint (flat config in eslint.config.mjs)
npm run typecheck   # tsc --noEmit
npm test            # vitest run (single-shot)
npm run test:watch  # vitest watch
```

There is **no `prisma/` directory and no schema** — the README's `npx prisma …` commands will fail until someone adds one.

Tests live in `src/**/*.test.ts` (Vitest, node env, `globals: false` so import `describe`/`it`/`expect` from `vitest`). The only suites are `src/server/filter/__tests__/` (pipeline + layers + fixtures, 26 tests). Single file: `npx vitest run src/server/filter/__tests__/pipeline.test.ts`.

## Architecture

### High-level data flow

```
TMDB (REST) ──► server/services/*.service.ts ──► mappers/tmdb.ts ──► server/filter pipeline ──► app/api/*/route.ts (JSON envelope) ──► lib/api-client.ts ──► React Query ──► client components
```

Two fetch paths coexist, and the difference matters:

- **`/` (home)** — bypasses the API routes entirely. `app/page.tsx` calls the services directly, wrapping each rail in `safeFetch()` so one failing TMDB call renders an inline rail error instead of blanking the page, then passes results down as plain `initial` props. There is **no React Query / HydrationBoundary on the home rails** — `home-rails.tsx` deliberately avoids client fetching (it caused a "stuck on skeletons" bug when the dev server compiled the API route lazily). `page.tsx`'s own comment claiming HydrationBoundary is stale.
- **`/explore`** — fully client-driven: URL search params → `useQuery` → `lib/api-client.ts` → `/api/explore`.

Every TMDB-backed path, both of them, runs `applyContentFilterListLevel()` before returning.

### Directory map (`src/`)

- **`app/`** — App Router. `layout.tsx` wires `ThemeProvider → QueryProvider → TooltipProvider → AppShell`. Pages: `/` (home rails) and `/explore` (filterable catalog). API routes under `app/api/*` return `{ ok: true, data }` or `{ ok: false, error }` via `server/http/response.ts`.
- **`components/`**
  - `home/` — hero carousel, rails, bento grid, footer (server-prefetched).
  - `explore/` — filter toolbar, card grid, pagination, tabs (client-driven).
  - `layout/` — `AppShell` (sidebar + topbar + theme toggle).
  - `ui/` — shadcn primitives (new-york style, zinc base). Add via `npx shadcn add …`.
  - `providers/query-provider.tsx` — TanStack Query client (60s `staleTime`, 5min `gcTime`, no refocus refetch).
- **`hooks/`** — thin TanStack Query wrappers over `lib/api-client.ts`. Only `useSection` (editorial-spotlight) and `usePersistedFlag` (app-shell sidebar state) are wired up; `useTrending`, `useGenres`, `useMovieCast`, `useMovieVideos` are currently unreferenced, as are `components/home/editorial-spotlight.tsx`, `cta-section.tsx`, and `layout/page-header.tsx`. Reuse or delete rather than adding parallel versions.
- **`lib/`** — `api-client.ts` (typed fetch helpers, returns `ApiResponse<T>`), `env.ts` (Zod-validated env + `tmdbImage()` URL helper), `schemas/` (Zod for query strings — kept out of route files so route handler types stay clean), `utils.ts` (`cn`).
- **`server/`**
  - `services/tmdb.service.ts` and `explore.service.ts` — TMDB fetch wrappers with `next: { revalidate }` caching (120s for plain lists, 60s for `/discover` and search). Both export a near-identical `fetchDiscover`; `tmdb.service` also owns trending, videos, credits, and the detail→`FilterInput` fetchers used by the debug route. **Check which one you're importing** — `/api/discover` and the home page use `tmdb.service`, `/api/explore` uses `explore.service`.
  - `mappers/tmdb.ts` — `mapTmdbListItem` produces `MediaFilterItem` (adds `adult`, `genres`, `*Ids`, `keywordNames` even though `MediaCardItem` doesn't carry them).
  - `filter/` — content moderation pipeline (see below).
  - `http/response.ts` — `ok()` / `fail()` envelope helpers used by every route.
- **`types/`** — `MediaCardItem` (client-facing) and `ApiResponse<T>` / `ListPayload` envelopes. **Filter inputs use `MediaFilterItem`** so the pipeline can see moderation signals.

The README's folder tree lists `features/`, `styles/`, and `data/` — none exist. Global CSS is `src/app/globals.css`.

### Content-filter pipeline (`src/server/filter/`)

Two entry points in `apply.ts`:
- `applyContentFilterListLevel(items)` — the one actually in use (`/trending`, `/discover`, `/search`, `/explore`, home). `mapTmdbListItem` always returns empty `keywordNames` / `*Ids` / `genres` because TMDB list payloads don't carry them, so **at list level only L1, L5, L6, L7, L8 can fire** — L2/L3/L4 self-skip and the AI gate almost never trips.
- `applyContentFilterFull(items)` — exported but unreferenced; for future detail pages. The debug route calls `runPipeline` directly on a detail fetch.

`pipeline.ts` evaluates layers in priority order:
1. **L8 Manual whitelist** — short-circuits to SAFE with confidence 1.
2. **L7 Manual blacklist** — hard veto (PORNOGRAPHIC).
3. **L1 adult flag, L2 networks, L3 companies, L4 keywords, L5 text analysis, L6 genres** — all sync, score-based. L6 never blocks; it only nudges the score ±0.1.
4. **L9 AI** — gated by `shouldInvokeAI()` so ~90% of items stay deterministic. Calls OpenAI `gpt-4o-mini` with an 8s `AbortSignal.timeout`, returns `null` on any failure (the filter must never throw), and caches per `${mediaType}:${tmdbId}` for 30 days. No-op without `OPENAI_API_KEY`.

Aggregation is layer 10 in `confidence.ts`: `aggregateScore` → weighted 0..1 → `scoreToDecision` (≥0.95 PORNOGRAPHIC/hidden, ≥0.85 EROTIC/hidden, ≥0.45 MATURE/visible, else SAFE/visible). `visible` is deliberately decoupled from `classification` so a future parental-control setting can reuse the same scores. Note `scoreOfLayers` is duplicated in both `confidence.ts` and `pipeline.ts` (the pre-AI gate score) — change both or neither.

Layer configs are static lists under `filter/config/` (blacklist/whitelist/networks/companies/keywords/phrases). The `FilterConfigVersion` type exists but nothing uses it, and `cache.ts` only wires up `filterAiCache` — `filterDecisionCache` and `filterDetailCache` are dead, so editing a config list takes effect on the next request with no invalidation step.

`__tests__/fixtures.ts` holds the canonical inputs; add cases there when you touch a layer's thresholds.

`/api/filter/debug?type=movie|tv&tmdbId=…` is the operator-facing endpoint that returns the full per-layer breakdown for one title.

### Public API contract

All API responses share `ApiResponse<T> = ApiSuccess<T> | ApiError`. List endpoints return `ListPayload { items, page, totalPages, totalResults }`. The client `request<T>()` helper in `lib/api-client.ts` unwraps the envelope and throws on `!ok` — no result-shape duplication needed in hooks.

### Explore tab model

`src/lib/schemas/explore.ts` defines `ExploreTab = "movies" | "tv" | "anime" | "trending"`. `app/api/explore/route.ts` owns the `TAB_CONFIG` map (anime = `tv` + genre 16 + `with_original_language=ja`); `trending` short-circuits to `fetchTrending("/trending/all/week")` and ignores every other param. When `q` is present the route uses `/search/{type}`.

Known rough edges in this area — read before "fixing" a chip that seems broken:
- `/api/explore` parses only `tab`, `page`, `genre`, `sort_by`, `q`. The presets in `lib/explore-presets.ts` and the "See All" hrefs in `home-rails.tsx` emit `language`, `category`, and `vote_count.gte` too, and those are **silently dropped**. (`/api/discover` does honour `language`/`year`/`withGenres`.)
- `ExploreView` treats a bare `?tab=…` as "no active filters" and renders the landing view, so the Trending preset link shows the landing page, not results.
- Year param name differs by media type: `primary_release_year` for movie, `first_air_date_year` for tv (handled in both services).

### Streaming & auth (scaffolded, not yet wired)

- `package.json` lists `webtorrent`, `plyr-react`, `next-auth@5.0.0-beta.25`, `@auth/prisma-adapter`, `prisma` — all installed, none imported anywhere in `src/`. No player page, no auth route, no Prisma schema. `lib/schemas/api.ts` has unused `watchTypeSchema` / `tvPlaybackQuerySchema` left over for the player. When adding these, expect `src/app/(player)/…` and `src/app/api/auth/[...nextauth]/route.ts` per the auth.js v5 convention.
- `next.config.ts` whitelists TMDB, gstatic, Unsplash, and `via.placeholder.com` for `next/image` remote patterns.

## Conventions

- Path alias: `@/*` → `src/*` (TS + Vitest). shadcn aliases also defined in `components.json`.
- Server-only code lives under `src/server/**`; client hooks/components import from `@/lib/api-client` (never directly from `src/server/`).
- API routes: parse query with Zod (use `z.coerce.number()` for ints), return 422 on parse failure, use `ok()` / `fail()` for the envelope, and let everything else bubble to one try/catch returning 500. `/trending` still hand-parses its params — Zod schemas exist in `lib/schemas/api.ts` if you touch it.
- Client hooks go through TanStack Query; server-rendered pages fetch per-rail with `safeFetch()` so one failing endpoint doesn't blank the page.
- Route handlers with dynamic segments take `context: { params: Promise<{ id: string }> }` and must `await context.params` (Next 15).
- ESLint disables `react-hooks/exhaustive-deps` project-wide; expect manual dep array review.
- Tailwind 3 with `tailwindcss-animate`; shadcn style is `new-york`, base color `zinc`. Fonts: Geist Sans (body) + Geist Mono via `next/font/google` in `app/layout.tsx`.
