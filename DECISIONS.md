# Decisions

## Naming

Renamed from "LevelUp" to **LiftCipher** per request. This touched the app
name/branding, PWA manifest, page titles, and generated icons — not the
underlying Supabase project name or GitHub repo, which are cosmetic and not
worth the churn of renaming.

## Stack

Used the recommended stack, with Netlify instead of Vercel since that's what
was already provisioned and explicitly requested:

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, replacing the old
  hand-maintained `index.html` with React-via-CDN `<script>` tags. This alone
  eliminates the "blank screen from CDN load order" class of bug — Next's
  bundler resolves and orders all dependencies at build time.
- **Netlify** hosting via `@netlify/plugin-nextjs`, reusing the existing
  connected site (renamed `leveluphealth` → `liftcipher`, now served at
  `liftcipher.netlify.app`) rather than provisioning a new one.
- **Supabase** — reused the existing project (`uorwaxkedqvogfeghjnu`) rather
  than creating a new one, since it already had the right tables and was
  referenced in the task as the project to build on.
- **Google Gemini** stayed the LLM provider. Its API key was already stored as
  a Netlify env var (`GEMINI_KEY`) and was never committed to source (checked
  full git history — the old `netlify/functions/ai.js` only had a comment
  placeholder, the real key always came from `process.env.GEMINI_KEY`), so no
  rotation was needed.

## Database changes

The existing schema was 90% right but needed adjustments to match the spec
and fix latent bugs, applied as migrations via the Supabase MCP tooling:

- **Dropped the `notes` table.** It had zero rows and was never in the
  required table list (`weights, workout_logs, workout_plans, nutrition,
  body_scans, peptides, supplements, user_goals`) — the spec explicitly says
  there's no Notes tab anymore.
- **Fixed missing auto-increment on bigint `id` columns** (`workout_logs`,
  `body_scans`, `peptides`, `supplements`) — they had no default/identity at
  all, meaning the old app must have been generating IDs client-side. Added
  `generated always as identity` to each.
- **Dropped the unused `weights.id` text column** — the real primary key is
  `(user_id, date)`.
- **Re-keyed `nutrition`** to a true `(user_id, date)` primary key (it had a
  spare `id` column previously) so upserts are simple and per-day.
- **Added `device` / `device_label` to `body_scans`** for the scan-method
  picker and per-device error charts.
- **Unified `supplements.dose` to `numeric`** (was `text`) to match
  `peptides` and support consistent math.
- Re-applied RLS on every table with explicit `select/insert/update/delete`
  policies scoped to `auth.uid() = user_id` (all 8 tables were already
  RLS-enabled, but policies were rewritten uniformly to guarantee no drift
  between tables).

No real user data was lost: the only pre-existing rows were two of the
account owner's own weight entries, which were verified intact after every
migration.

## Camel/snake mapping

`src/lib/mapping.ts` is the single place that converts between app-level
camelCase objects and DB snake_case rows, per table, as small explicit typed
functions (not a generic runtime mapper) — a typo here is a TypeScript
compile error, not a silently-dropped write. Every read and write in every
tab goes through these functions and is `await`ed before the UI treats it as
saved; writes optimistically update local state, then re-fetch from the
server to reconcile, so what's on screen always matches what's actually
persisted.

## AI coach architecture

The `/api/ai/coach` and `/api/ai/test` route handlers hold the only code that
reads `GEMINI_KEY` — it's never referenced in client code. Rather than have
the server route re-fetch the user's data (which would need a service-role
key), the client — which already has an authenticated Supabase session —
assembles a compact plain-text summary (weight trend, training frequency,
recent nutrition average, latest scan, active stack, goals) and posts just
that summary to the route. The route only ever sees derived, already-public-
to-that-user data, never touches the database, and never sees the Supabase
key.

`lib/ai.ts` tries a short list of Gemini model names in order
(`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash-latest` →
`gemini-1.5-flash`) and surfaces the real upstream error text on total
failure, directly addressing the old "model renamed, got a silent 404"
failure mode.

## PWA

Hand-rolled rather than using a plugin: `public/manifest.webmanifest`, a
minimal network-first `public/sw.js`, and icons generated programmatically
via `scripts/generate-icons.mjs` (sharp rendering an SVG "LC" wordmark to the
192/512/maskable/apple-touch-icon sizes). This is a placeholder mark — swap
the SVG in that script for real brand art whenever you have it and re-run
`node scripts/generate-icons.mjs`.

## Verification

This session runs in a sandboxed environment whose network policy blocks
direct outbound HTTPS to arbitrary hosts (confirmed via the agent proxy
status endpoint returning `403` policy denials for both
`uorwaxkedqvogfeghjnu.supabase.co` and general internet hosts) — so a live
Playwright browser pass against the deployed app wasn't possible from inside
this session.

Instead, per-user isolation was verified directly at the database level: a
second test user was created, a row was inserted for each of two users into
`weights`, and RLS was exercised by simulating an authenticated Postgres
session as each user in turn (`set local role authenticated; set local
request.jwt.claims ...`). Each simulated user could only **read** their own
row, and an **insert** attempting to write a row under the other user's
`user_id` was rejected by the RLS policy (`42501: new row violates row-level
security policy`). All test data was deleted afterward; the pre-existing real
account data was confirmed intact throughout.

Recommended follow-up: do one real pass on your phone — sign up, log
something in each tab, sign out, sign in as a friend's account, confirm you
each only see your own data and it survives a reload.

## Email confirmation

Supabase doesn't expose "require email confirmation" through any API or MCP
tool available in this session — it's a dashboard-only toggle at
**Authentication → Sign In / Providers → Email → "Confirm email"**. Turn it
off there if you want testers to sign up and start using the app without
checking their inbox first. Left at its default (on) until you make that
call, since it's a security/UX tradeoff that's yours to make.
