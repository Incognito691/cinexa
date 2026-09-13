# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Cinexa

A movie/TV streaming UI built with Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui. Metadata from TMDB; playback via SuperEmbed and WebTorrent + YTS. The codebase is split into a server-rendered Next.js app and a client UI that fetches data through App-Router route handlers, with a strong content-filter pipeline sitting between TMDB and the user.

## Environment

- Node 24 LTS (`.nvmrc` pins this) and npm ≥ 10
- `src/lib/env.ts` (Zod) validates exactly two vars, both optional at parse time:
  - `TMDB_API_KEY` — the only var the app actually needs to run; every TMDB call reaches it via `requireServerEnv("TMDB_API_KEY")`, which throws at request time if unset
  - `GEMINI_API_KEY` — optional; Google AI Studio key for filter layer 9 (AI). `OPENAI_API_KEY` is still read as a fallback name (that's where the project's Gemini key lives), resolved by `aiApiKey()` in `lib/env.ts`. When neither is set, layer 9 is a hard no-op.
  - **The Gemini free tier allows 20 requests/day.** Verdicts persist to `data/ai-verdicts.json` so each title is classified once ever; that file doubles as the blocklist when quota is gone (see the filter section)
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET` are all validated in `envSchema` and in use. `authConfigured()` gates the sign-in UI so a missing OAuth config hides the button instead of 500ing.
- **Login is optional by design.** Browsing and playback work signed out; a session only unlocks the personal features (watch history, favourites, collections). Nothing should gate a page on `auth()` — those pages render an empty state with a sign-in prompt instead.
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

`prisma/schema.prisma` holds the Auth.js models (User/Account/Session/VerificationToken) plus `WatchedItem`, `Favourite`, `CollectionItem` and `CollectionFolder`. The database is Neon Postgres and the tables are live. `npx prisma db push` after schema edits; `npx prisma generate` after a fresh install.

**Strip `channel_binding=require` from Neon's connection string.** Prisma's engine doesn't implement SCRAM channel binding and fails with a misleading `P1001 Can't reach database server` — the port is reachable, the handshake isn't. `sslmode=require` still applies.

The IDE's Prisma extension may warn that `url` in the datasource block is unsupported. That's a **Prisma 7** message; this project runs **6.19.3**, where `url = env("DATABASE_URL")` is correct. Don't move it to `prisma.config.ts` without upgrading first.

Tests live in `src/**/*.test.ts` (Vitest, node env, `globals: false` so import `describe`/`it`/`expect` from `vitest`). 55 tests across three suites: `src/server/filter/__tests__/` (pipeline + layers + AI batch + fixtures, 33), `src/server/library.test.ts` (favourites/collections, mocked Prisma, 18), `src/lib/watch-progress.test.ts` (4). Single file: `npx vitest run src/server/filter/__tests__/pipeline.test.ts`.

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

- **Navigation / loading.** Every route has a `loading.tsx`; there were none, which is why navigation felt frozen — without one App Router blocks the transition on the server fetch and leaves the *old* page on screen with no feedback. `app/error.tsx` and `app/not-found.tsx` are the route-level boundaries. `components/layout/page-transition.tsx` cross-fades content keyed on pathname via `tailwindcss-animate` (no animation library), and honours `prefers-reduced-motion`. Note `next dev` disables `<Link>` prefetching, so navigation is always snappier in a production build than in dev.
- **`app/`** — routes only, kept thin. Pages delegate to a feature; API routes under `app/api/*` return `{ ok: true, data }` or `{ ok: false, error }` via `server/http/response.ts`. Also holds the metadata routes (`icon.tsx`, `opengraph-image.tsx`, `robots.ts`) and `layout.tsx`, which wires `ThemeProvider → QueryProvider → TooltipProvider → AppShell`.
- **`features/`** — one folder per surface, each with an `index.ts` public entry point.
  - `home/` — hero, rails, bento grid, footer + `api.ts`
  - `explore/` — view, card grid, search, chips, genre tiles + `api.ts`, `schemas.ts`, `tabs.ts`, `lib/presets.ts`
  - `continue-watching/` — the home-page rail + `/continue-watching`, both fed by `lib/entries.ts` (server-only: it reads history and TMDB, so it stays out of the barrel)
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

Feature folders are created when they have code, not before. `settings/` is planned and absent — create it with its first real file.

### Content-filter pipeline (`src/server/filter/`)

Two entry points in `apply.ts`:
- `applyContentFilterListLevel(items)` — the one actually in use (`/trending`, `/discover`, `/search`, `/explore`, home). `mapTmdbListItem` always returns empty `keywordNames` / `*Ids` / `genres` because TMDB list payloads don't carry them, so **at list level only L1, L5, L7, L8 and the AI can fire** — L2/L3/L4 self-skip, and L6 is inert because `genres` is empty. It calls `prefetchAiClassifications()` first so the whole page costs one AI request; see L9 below.
- `applyContentFilterFull(items)` — exported but unreferenced; for future detail pages. The debug route calls `runPipeline` directly on a detail fetch.

`pipeline.ts` evaluates layers in priority order:
1. **L8 Manual whitelist** — short-circuits to SAFE with confidence 1.
2. **L7 Manual blacklist** — hard veto (PORNOGRAPHIC).
3. **L1 adult flag, L2 networks, L3 companies, L4 keywords, L5 text analysis, L6 genres** — all sync, score-based. L6 never blocks; it only nudges the score ±0.1.
4. **L9 AI** — consulted for everything the deterministic layers didn't already block. `shouldInvokeAI()` only skips on an L7/L2/L3 hit or a score ≥ 0.85. It used to also skip when `score <= 0.3`, which meant the model could only confirm an existing suspicion and never find anything itself — every layer that runs at list level keys off English phrases or the TMDB `adult` flag, so non-English softcore (`adult=false`, bland overview, sometimes no overview) scored 0 and was passed as SAFE unexamined.

   Asking more often is affordable because `prefetchAiClassifications()` classifies a whole page in **one** `gpt-4o-mini` request (`{i, class, confidence}` rows mapped back by index — never zipped positionally) and warms `filterAiCache`, so the per-item pipeline that follows is all cache hits. Results cache per `${mediaType}:${tmdbId}` for 30 days. Any failure returns `null` (the filter must never throw) and trips a 60s circuit breaker, so a rejected key can't turn every render into a page-worth of timing-out requests. No-op without `OPENAI_API_KEY`.

   **The deterministic layers cannot catch this content on their own** — without a working `OPENAI_API_KEY`, regional softcore will be visible. L5 phrase hits mostly score 0.4 (soft), which routes to the AI rather than blocking.

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
- `/api/explore` parses only `tab`, `page`, `genre`, `sort_by`, `q`, `country`. The presets in `features/explore/lib/presets.ts` and the "See All" hrefs in `home-rails.tsx` emit `language`, `category`, and `vote_count.gte` too, and those are **silently dropped**. (`/api/discover` does honour `language`/`year`/`withGenres`.)
- `country` is an ISO 3166-1 alpha-2 code mapped to TMDB `with_origin_country` (not `region`, which means something else). The country list is a curated static array of codes in `features/explore/lib/countries.ts` — names come from `Intl.DisplayNames`, flags from the regional-indicator code points, so there is no TMDB `/configuration/countries` fetch.
- `ExploreView` treats a bare `?tab=…` as "no active filters" and renders the landing view, so the Trending preset link shows the landing page, not results. The "Browse by Type" tiles work around this by also emitting `sort_by=popularity.desc`.
- Year param name differs by media type — `yearParamFor()` in `server/tmdb/types.ts` handles it.

### Not built yet

`/movie/:id` and `/tv/:id` now exist. `fetchMoviePage()` in `server/tmdb/details.ts` backs the movie page and pulls detail + credits + videos + similar in **one** TMDB request via `append_to_response` — four round trips were most of the page's TTFB. `fetchTitleDetail()` still serves `/tv/:id` (basic layout). Both run the content filter and return `null` for a blocked title or a TMDB 404 so the page renders not-found. Similar titles are filtered too, so a blocked film can't reappear as a recommendation.

The movie page (`features/title/components/movie-detail-view.tsx`) has Watch Movie + Watch Trailer, box office (budget/revenue/profit, hidden when TMDB has neither figure — it reports unknown as `0`, normalised to `null`), a cast rail, production logos, and a related grid. The trailer modal uses the native `<dialog>` element rather than a modal dependency, and only mounts the YouTube iframe while open. **A blocked title 404s on its detail URL**, so moderation can't be routed around by guessing an ID.

Still 404: `/settings`.

### Favourites and collections (`src/server/library.ts`, `src/features/library/`)

Two independent pools, both keyed on `[userId, tmdbId, mediaType]` so a film and a show can share a TMDB id:

- **`Favourite`** — the heart. Flat list, no organisation, backs `/favourites`.
- **`CollectionItem`** — "Add to collection". Carries a nullable `folderId`; **null means unfiled, which is where every new save lands**. Folders are an organising layer *over* the collection, not a precondition for joining it.
- **`CollectionFolder`** — user-named, `@@unique([userId, name])` so a rename can't mint two indistinguishable folders. `onDelete: SetNull` on the item relation means **deleting a folder un-files its titles rather than deleting them** — a folder delete can never cost the user a saved title.

`server/library.ts` mirrors `watch-history.ts`: `"use server"`, signed out is a silent no-op, never a throw.

**Every mutation scopes by `userId` inside the WHERE clause.** Folder and item ids reach the server from the browser, so `update({ where: { id } })` would let any signed-in user rename or delete another user's folder by guessing a cuid. The folder operations therefore use `updateMany`/`deleteMany` for what look like single-row writes — they match zero rows and report "not found" instead. `moveItemToFolder` additionally looks the *destination* folder up by `[id, userId]`, because the item's own scoping says nothing about who owns the folder it's being moved into. `src/server/library.test.ts` pins all of this with a mocked Prisma client; the scoping bugs it catches are invisible in manual testing, where you only ever have one account open.

Client state goes through **one** React Query key (`["library","keys"]`, served by `/api/library/keys`). Every heart on the page reads it, and React Query dedupes the identical query, so a forty-poster grid costs one request rather than forty — and the same title appearing in both a rail and the similar grid stays in sync without either button knowing the other exists. Toggles are optimistic with rollback. The payload carries `signedIn` because empty arrays alone can't distinguish "signed out" from "signed in, nothing saved", and the button needs that to choose between acting and linking to sign-in.

`/my-collection`'s **Manage** dialog (`features/library/components/manage-collection.tsx`) does create/rename/delete folder, file/unfile, and remove. It uses a `<select>` rather than drag-and-drop — same capability, no dependency, and it works with a keyboard and on a phone for free. Unlike the heart it is *not* optimistic: each action awaits its server action then `router.refresh()`es, which is the right trade for a modal opened occasionally.

`features/library/lib/entries.ts` hydrates stored TMDB ids into poster cards, one cached detail request each, and **drops any title the content filter now blocks** — so saving something is not a way to keep access to it after moderation rejects it.

### Watch progress

The player is a cross-origin iframe, so progress only exists if the provider hands it over. **VidLink** (`SOURCES[0]`) posts `{ type: "PLAYER_EVENT", data: { currentTime, duration } }` and accepts `?startAt=`; SuperEmbed and VidSrc post nothing and can't seek, so on those two a title still reaches Continue Watching (via the dwell timer) but with no bar and no resume.

- `WatchTracker` (rendered by `WatchView` for both media types) listens for messages from `progressOrigin` only, then flushes to `POST /api/watch/progress` every 15s and again on `pagehide` — a **route** rather than a server action because only `sendBeacon` survives the navigation.
- `WatchedItem.positionSeconds` / `.runtimeSeconds` hold it. `runtimeSeconds = 0` means *unknown*, never 0% — the UI drops the bar instead.
- Thresholds live in `lib/watch-progress.ts` (shared: `"use server"` modules can only export async functions, and client code can't import from `server/`). Past `FINISHED_RATIO` a movie leaves the rail and an episode's card points at the **next** episode; `/watch/tv/:id` redirects a past-the-end episode into the next season, which is what makes that safe without another TMDB call.
- The dwell timer still exists as the fallback for the two silent providers. It lives in `EpisodeNav` for TV (it also drives the watched tick) and in `WatchTracker` for movies — hence `dwellFallback`.

- `package.json` still lists `webtorrent` and `plyr-react`, neither imported anywhere in `src/` — playback is embeds only (see the note in `features/watch/lib/sources.ts` on why browser WebTorrent can't reach YTS swarms).
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
