# Cinexa

A modern movie and TV streaming UI built with Next.js 15, React 19, Tailwind CSS, and shadcn/ui. Movie and TV data comes from TMDB; playback uses SuperEmbed (TV / iOS fallback), WebTorrent + YTS (movies).

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS 3 + shadcn/ui (new-york style)
- TanStack Query 5, Zod 3
- next-themes (dark + light)
- Geist Sans (body) + Geist Mono
- next-auth 5 + Prisma 6, WebTorrent + Plyr — *installed, not yet wired up*

## Setup

Requires **Node.js 24 LTS** and **npm 10+**.

```bash
nvm use           # picks Node 24 from .nvmrc
npm install
cp .env.example .env   # only TMDB_API_KEY is required to run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Run production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest (single-shot)
npm run test:watch # Vitest watch
```

Prisma is installed but there is no schema yet, so `npx prisma …` will not work until one is added.

## Folder structure

Feature-first: each surface owns its components, client fetchers, and schemas, and exposes them through an `index.ts`. Only genuinely shared code sits at the top level.

```
src/
├── app/          # Routes only — pages delegate to a feature.
│                 # Also API handlers + metadata routes (icon, og, robots)
├── features/     # home, explore, continue-watching, title
├── components/   # Shared UI: media card, app shell, shadcn primitives
├── hooks/        # Cross-feature hooks only
├── lib/          # fetcher, env, metadata, utils
├── server/       # Server-only: tmdb layer, content filter, http helpers
└── types/        # Shapes shared between client and server
```

A component lives in the feature that uses it and only moves to `components/`
once a second feature needs it. Cross-feature imports go through the
feature's `index.ts`, never into its internals.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the data flow, the content-filter pipeline, and
the current known gaps.