# Cinexa

A modern movie and TV streaming UI built with Next.js 15, React 19, Tailwind CSS, and shadcn/ui. Movie and TV data comes from TMDB; playback uses SuperEmbed (TV / iOS fallback), WebTorrent + YTS (movies).

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS 3 + shadcn/ui (new-york style)
- TanStack Query 5, Zod 3
- next-themes (dark + light)
- next-auth 5 + Prisma 6
- WebTorrent + Plyr (movie playback)
- Geist Pixel (display) + Geist Sans (body)

## Setup

Requires **Node.js 24 LTS** and **npm 10+**.

```bash
nvm use           # picks Node 24 from .nvmrc
npm install
cp .env.example .env   # then fill in TMDB_API_KEY, DATABASE_URL, NEXTAUTH_SECRET
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

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma db push
```

## Folder structure

```
src/
├── app/          # Next.js App Router (routes + API handlers)
├── components/   # Shared UI: shadcn primitives, app shell, home
├── features/     # Domain modules: movies, tv, watch, collections, …
├── hooks/        # Reusable React hooks
├── lib/          # utils, env, schemas, api-client, streaming adapters
├── server/       # Server-only: services, mappers, http, auth, db
├── styles/       # Global CSS / design tokens
├── types/        # Shared TS types
└── data/         # Static seed data
```

## Architecture

See `.claude/plans/greedy-tumbling-nebula.md` for the full architecture and phasing plan.