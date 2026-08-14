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
- `NEXT_PUBLIC_SITE_URL` is the one documented exception to the rule below: it's public by definition and must be inlined at build time, so `lib/metadata.ts` reads it from `process.env` directly.
- All other server code must go through `requireServerEnv()`, never `process.env` directly.

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

There is **no `prisma/` directory and no schema** — `npx prisma …` will fail until someone adds one.

Tests live in `src/**/*.test.ts` (Vitest, node env, `globals: false` so import `describe`/`it`/`expect` from `vitest`). The only suites are `src/server/filter/__tests__/` (pipeline + layers + fixtures, 26 tests). Single file: `npx vitest run src/server/filter/__tests__/pipeline.test.ts`.

## Architecture

### High-level data flow

```
TMDB (REST) ──► server/tmdb/ (fetch + map) ──► server/filter pipeline ──► app/api/*/route.ts (JSON envelope) ──► lib/fetcher.ts ──► features/*/api.ts ──► React Query ──► feature components
```

Two fetch paths coexist, and the difference matters:

- **`/` (home)** — bypasses the API routes entirely. `app/page.tsx` calls `server/tmdb` directly, wrapping each rail in `safeFetch()` so one failing TMDB call renders an inline rail error instead of blanking the page, then passes results down as plain `initial` props. There is **no React Query on the home rails** — client fetching here caused a "stuck on skeletons" bug when the dev server compiled the API route lazily.
- **`/explore`** — fully client-driven: URL search params → `useQuery` → `features/explore/api.ts` → `/api/explore`.

Every TMDB-backed path, both of them, runs `applyContentFilterListLevel()` before returning.

### Directory map (`src/`)

The project is **feature-first**. A surface owns its components, its client-side fetchers, and its schemas; only genuinely shared things sit in the top-level folders.

- **`app/`** — routes only, kept thin. Pages delegate to a feature; API routes under `app/api/*` return `{ ok: true, data }` or `{ ok: false, error }` via `server/http/response.ts`. Also holds the metadata routes (`icon.tsx`, `opengraph-image.tsx`, `robots.ts`) and `layout.tsx`, which wires `ThemeProvider → QueryProvider → TooltipProvider → AppShell`.
- **`features/`** — one folder per surface, each with an `index.ts` public entry point.
  - `home/` — hero, rails, bento grid, footer + `api.ts`
  - `explore/` — view, card grid, search, chips, genre tiles + `api.ts`, `schemas.ts`, `tabs.ts`, `lib/presets.ts`
  - `continue-watching/` — the home-page rail (placeholder data until persistence lands)
  - `title/` — currently just `api.ts`, the client half of the `/api/movie/[id]/*` routes
- **`components/`** — shared UI only.
  - `media/media-card.tsx` — **the** poster card, `layout="rail" | "grid"`. Anything listing media renders this.
  - `layout/` — `AppShell` (sidebar + topbar + theme toggle)
  - `ui/` — shadcn primitives (new-york, zinc). Add via `npx shadcn add …`
  - `providers/query-provider.tsx` — TanStack Query client (60s `staleTime`, 5min `gcTime`, no refocus refetch)
- **`hooks/`** — only cross-feature hooks. Currently just `usePersistedFlag` (sidebar state).
- **`lib/`** — `fetcher.ts` (`request<T>()`, unwraps the envelope), `env.ts` (Zod env + `tmdbImage()`), `metadata.ts` (`buildMetadata()`), `utils.ts` (`cn`).
- **`server/`**
  - `tmdb/` — one TMDB layer: `client.ts` (the only fetch wrapper), `discover.ts`, `trending.ts`, `search.ts`, `details.ts`, `mapper.ts`, `schemas.ts`. Caching is 120s for plain lists, 60s for discover/search.
  - `filter/` — content moderation pipeline (see below)
  - `http/response.ts` — `ok()` / `fail()`
- **`types/`** — `MediaCardItem`, `VideoItem`, `CastMember`, and the `ApiResponse<T>` / `ListPayload` envelopes. Shared shapes live here precisely so a client module never has to import from `server/`.

**Where does new code go?** Follow these two rules and it answers itself:

1. **A component lives in the feature that uses it.** It only graduates to `components/` when a *second* feature needs it. `MediaRail`, `RailCardSkeleton`, and `SiteFooter` each have one consumer today and stay in `features/home/` — promote them when that changes.
2. **Cross-feature imports go through `index.ts`**, never into a feature's internals. `app/page.tsx` imports `ContinueWatchingRail` from `@/features/continue-watching`, not from its `components/` folder.

Feature folders are created when they have code, not before. `favourites/`, `collections/`, `watch/`, `ai/`, and `settings/` are all planned and all absent — create them with their first real file.

### Content-filter pipeline (`src/server/filter/`)

Two entry points in `apply.ts`:
- `applyContentFilterListLevel(items)` — the one actually in use (`/trending`, `/discover`, `/search`, `/explore`, home). `mapTmdbListItem` always returns empty `keywordNames` / `*Ids` / `genres` because TMDB list payloads don't carry them, so **at list level only L1, L5, L6, L7, L8 can fire** — L2/L3/L4 self-skip and the AI gate almost never trips.
- `applyContentFilterFull(items)` — exported but unreferenced; for future detail pages. The debug route calls `runPipeline` directly on a detail fetch.

`pipeline.ts` evaluates layers in priority order:
1. **L8 Manual whitelist** — short-circuits to SAFE with confidence 1.
2. **L7 Manual blacklist** — hard veto (PORNOGRAPHIC).
3. **L1 adult flag, L2 networks, L3 companies, L4 keywords, L5 text analysis, L6 genres** — all sync, score-based. L6 never blocks; it only nudges the score ±0.1.
4. **L9 AI** — gated by `shouldInvokeAI()` so ~90% of items stay deterministic. Calls OpenAI `gpt-4o-mini` with an 8s `AbortSignal.timeout`, returns `null` on any failure (the filter must never throw), and caches per `${mediaType}:${tmdbId}` for 30 days. No-op without `OPENAI_API_KEY`.

Aggregation is layer 10 in `confidence.ts`: `aggregateScore` → weighted 0..1 → `scoreToDecision` (≥0.95 PORNOGRAPHIC/hidden, ≥0.85 EROTIC/hidden, ≥0.45 MATURE/visible, else SAFE/visible). `visible` is deliberately decoupled from `classification` so a future parental-control setting can reuse the same scores. `scoreOfLayers` (the pre-AI gate score) is exported from `confidence.ts` and imported by `pipeline.ts` — it used to be duplicated in both.

Layer configs are static lists under `filter/config/` (blacklist/whitelist/networks/companies/keywords/phrases). The `FilterConfigVersion` type exists but nothing uses it, and `cache.ts` only wires up `filterAiCache` — `filterDecisionCache` and `filterDetailCache` are dead, so editing a config list takes effect on the next request with no invalidation step.

`__tests__/fixtures.ts` holds the canonical inputs; add cases there when you touch a layer's thresholds.

`/api/filter/debug?type=movie|tv&tmdbId=…` is the operator-facing endpoint that returns the full per-layer breakdown for one title.

### Public API contract

All API responses share `ApiResponse<T> = ApiSuccess<T> | ApiError`. List endpoints return `ListPayload { items, page, totalPages, totalResults }`. The client `request<T>()` helper in `lib/fetcher.ts` unwraps the envelope and throws on `!ok`; feature fetchers in `features/*/api.ts` build on it, so no hook duplicates the result shape.

### Metadata / SEO

`lib/metadata.ts` is the single entry point. `layout.tsx` sets `metadataBase` and the `%s · Cinexa` title template; pages call `buildMetadata({ title, description, path, images, noIndex })` and declare only what's theirs. Detail pages should call it from `generateMetadata` and pass a TMDB backdrop as `images`.

`app/icon.tsx` and `app/opengraph-image.tsx` are **generated** with `next/og`, not committed binaries — there is no `public/` directory. `NEXT_PUBLIC_SITE_URL` must be set in production or every canonical and share URL points at localhost. `/explore` is `noIndex` and disallowed in `robots.ts`, because each filter combination is its own URL.

### Explore tab model

`features/explore/schemas.ts` defines `ExploreTab = "movies" | "tv" | "anime" | "trending"`. `app/api/explore/route.ts` owns the `TAB_CONFIG` map (anime = `tv` + genre 16 + `with_original_language=ja`); `trending` short-circuits to `fetchTrending` on `/trending/all/week` and ignores every other param. When `q` is present the route uses `/search/{type}`.

Known rough edges in this area — read before "fixing" a chip that seems broken:
- `/api/explore` parses only `tab`, `page`, `genre`, `sort_by`, `q`. The presets in `features/explore/lib/presets.ts` and the "See All" hrefs in `home-rails.tsx` emit `language`, `category`, and `vote_count.gte` too, and those are **silently dropped**. (`/api/discover` does honour `language`/`year`/`withGenres`.)
- `ExploreView` treats a bare `?tab=…` as "no active filters" and renders the landing view, so the Trending preset link shows the landing page, not results.
- Year param name differs by media type — `yearParamFor()` in `server/tmdb/types.ts` handles it.

### Not built yet

Eight routes are already linked from the UI and **all of them 404**: `/movie/:id`, `/tv/:id`, `/watch/movie/:id`, `/watch/tv/:id` (from every card and the hero), plus `/favourites`, `/continue-watching`, `/my-collection`, `/settings` (from the sidebar). Only `/` and `/explore` exist.

- `package.json` lists `webtorrent`, `plyr-react`, `next-auth@5.0.0-beta.25`, `@auth/prisma-adapter`, `prisma` — all installed, none imported anywhere in `src/`. No player page, no auth route, no Prisma schema. When adding these, expect `src/app/(player)/…` and `src/app/api/auth/[...nextauth]/route.ts` per the auth.js v5 convention.
- Planned order: persistence (Prisma + Postgres + next-auth) → title detail → AI (a "because you watched" home rail plus an `/ai` chat page, movies only, on the existing `OPENAI_API_KEY` following the fetch pattern in `filter/layers/layer-9-ai.ts`) → watch/player → settings.
- `next.config.ts` whitelists TMDB, gstatic, Unsplash, and `via.placeholder.com` for `next/image` remote patterns.

## Conventions

- Path alias: `@/*` → `src/*` (TS + Vitest). shadcn aliases also defined in `components.json`.
- Server-only code lives under `src/server/**`. Client code never imports from it — **not even type-only**; shared shapes go in `src/types/` so both sides can reach them.
- API routes: parse query with Zod (use `z.coerce.number()` for ints), return 422 on parse failure, use `ok()` / `fail()` for the envelope, and let everything else bubble to one try/catch returning 500. `/trending` still hand-parses its params — Zod schemas live in `server/tmdb/schemas.ts` if you touch it.
- Client hooks go through TanStack Query; server-rendered pages fetch per-rail with `safeFetch()` so one failing endpoint doesn't blank the page.
- Route handlers with dynamic segments take `context: { params: Promise<{ id: string }> }` and must `await context.params` (Next 15).
- ESLint disables `react-hooks/exhaustive-deps` project-wide; expect manual dep array review.
- Tailwind 3 with `tailwindcss-animate`; shadcn style is `new-york`, base color `zinc`. Fonts: Geist Sans (body) + Geist Mono via `next/font/google` in `app/layout.tsx`.
