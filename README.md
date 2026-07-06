# LiftCipher

A mobile-first fitness and body-recomposition tracking PWA. Dark, premium UI;
multi-user with per-account data isolation; deterministic nutrition math; a
double-progression training coach; and a single general AI coach in Insights.

**Live app:** https://liftcipher.netlify.app

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Postgres + Auth + Row Level Security)
- Netlify (hosting, auto-deploy on push, serverless Next.js runtime)
- Google Gemini (server-side route handler) for the Insights AI coach

See `DECISIONS.md` for why, and what changed from the original spec.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase project values
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

### Environment variables

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase publishable/anon key, safe to expose (RLS enforces access) |
| `GEMINI_KEY` | server only (`/api/ai/*` routes) | Google AI Studio API key — **never** exposed to the client |

## Database

All schema/RLS lives in the Supabase project itself (managed via migrations
applied through the Supabase MCP tooling during development, not checked into
this repo as SQL files). Tables: `weights`, `workout_logs`, `workout_plans`,
`nutrition`, `body_scans`, `peptides`, `supplements`, `user_goals` — every
table has Row Level Security enabled with `select/insert/update/delete`
policies scoped to `auth.uid() = user_id`.

## Deploying

The site auto-deploys from this repo on Netlify (`@netlify/plugin-nextjs`).
Push to the connected branch and Netlify builds and deploys automatically.
Required env vars (above) are set in Netlify's site settings, not in source.

**One manual step in Supabase you'll want to do:** in the Supabase dashboard,
go to Authentication → Sign In / Providers → Email, and turn off "Confirm
email" if you want testers to be able to sign up and use the app instantly
without checking their inbox. There's no API for this setting — see
`DECISIONS.md` for details.

## Project structure

```
src/
  app/
    (auth)/login, (auth)/signup     — auth pages, no bottom nav
    (app)/weight|train|nutrition|body|stack|goals|insights  — the 7 tabs
    api/ai/coach, api/ai/test       — server-side Gemini calls
  components/
    ui/        — Card, Button, Input, Chip, ProgressRing, etc. (design system)
    shell/     — Header, BottomNav, service worker registration
    train/, body/, nutrition/, stack/, goals/  — tab-specific components
  lib/
    supabase/  — browser + server Supabase clients, session middleware
    types.ts   — generated DB types + app-level domain types
    mapping.ts — the ONLY place that converts app objects <-> DB rows
    progression.ts, macros.ts, devices.ts, insights.ts, ai.ts — business logic
```
