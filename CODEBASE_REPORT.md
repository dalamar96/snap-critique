# Snap Critique — Codebase Report

_Generated 2026-07-21_

## 1. What is this application?

**Snap Critique** (snapcritique.com) is an AI-powered photography mentoring/critique platform. Users upload a photo, optionally tag category/goals/context, and Google Gemini analyzes it across composition, technique, creativity, and technical execution, returning a structured critique (scores, strengths, prioritized improvements, action-plan/drills). It has grown from a simple "upload → AI critique → paywall" tool into a fuller platform: structured lessons with homework tied back into the AI critique engine, a public gallery/community directory, comments, and a credit-based monetization model.

Source docs: `README.md` (root), `.env.local.example`, `.agent/workflows/setup-stripe-webhooks.md`.

## 2. Tech stack

- **Framework**: Next.js 16 (App Router, Server Actions, Server Components) — `package.json` (README says 15, but installed version is `next@16.1.0`, so docs are slightly stale)
- **Language**: TypeScript, React 19
- **Database/Auth**: Supabase (Postgres + Auth + Storage), accessed via `@supabase/supabase-js` and `@supabase/ssr`. Two client patterns: `src/lib/supabase/server.ts` (user-scoped, respects RLS) and `src/lib/supabase/admin.ts` (service-role, bypasses RLS — used heavily in server actions after manual `is_admin` checks)
- **AI/LLM**: Google Gemini via `@google/generative-ai`, `src/lib/gemini.ts` — model id is `gemini-3-flash-preview` (worth verifying this is a real/available model)
- **Payments**: Stripe, one-time purchases only (no subscriptions) — `src/lib/stripe.ts`, `src/app/api/checkout/route.ts`, `src/app/api/webhook/route.ts`
- **Styling/UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives: dialog, alert-dialog, switch, slot), `framer-motion`, `lucide-react`, `sonner` toasts, `canvas-confetti`
- **EXIF extraction**: `exifreader` (client & server) to pull camera metadata for AI context
- **Analytics**: Google Analytics 4 via `@next/third-parties`
- **Hosting**: Vercel (inferred from webhook setup doc referencing "your Vercel domain" and `NEXT_PUBLIC_VERCEL_URL` env var usage in `auth/actions.ts`)
- **No ORM** — raw Supabase JS query builder throughout; schema managed via hand-written `.sql` files, not a migration tool like Prisma/Drizzle

## 3. Architecture / folder structure

```
src/
  app/
    page.tsx                 landing page
    wizard/                  upload flow (category/goals/context → upload)
    analysis/[id]/            critique results page (paywall/lock logic) + actions.ts
    dashboard/                user's submission history
    admin/                    admin panel (users, lessons, taxonomy, support inbox, error logs)
    learning/[slug]/          lessons + homework
    gallery/, community/      public showcase + photographer directory
    profile/[id], profile/edit
    api/analyze, api/checkout, api/webhook, api/log   route handlers
    auth/actions.ts, auth/callback/route.ts           login/signup/OAuth-magic-link callback
    login, forgot-password, update-password
    pricing, about, support, privacy, terms
  components/                critique-display, upload-zone, wizard, chat-interface, comments/*, lessons/*, ui/* (shadcn)
  lib/
    gemini.ts, stripe.ts, logger.ts, storage.ts, image.ts
    supabase/{client,server,admin,middleware}.ts, supabase/migrations/*.sql
  config/lesson-registry.tsx  maps lesson slugs → React components (custom rich lesson pages)
  types/                      comments.ts, wizard.ts
supabase/                     root-level schema files: schema.sql, lessons.sql, messages.sql, conversation_status.sql, homework_migrations.sql, seed_lessons*.sql
.agent/workflows/             internal runbook docs (Stripe webhook setup)
```

No `/tests` directory, no CI config (`.github` doesn't exist), no `vercel.json`.

## 4. Core features implemented

- **AI Photo Critique** (`api/analyze/route.ts`): drag-drop upload → Supabase Storage → EXIF extraction → Gemini prompt (with homework/lesson context injection when applicable) → structured JSON critique stored in `analyses` table
- **Guest → Signup flow with "claiming"**: unauthenticated users can get one free analysis; a `guest_token_<submissionId>` httpOnly cookie lets them claim ownership of that submission after signing up/logging in (logic split between `auth/actions.ts` login/signup and `analysis/[id]/page.tsx`'s explicit `?claim=true` flow — subject of several recent commits, see #7)
- **Credit system**: 5 free credits on signup; Stripe one-time packages (Starter/Pro/Power) top up credits (`api/checkout`, `api/webhook`); credits deducted per analysis or per "unlock"
- **Paywall / locked analysis**: analyses can be locked (`is_unlocked`); server strips sensitive fields (`improvements`, `next_steps`, `technical_assessment`, `goal_feedback`) before sending to client when locked (`analysis/[id]/page.tsx` lines ~253-280) — real server-side security, not just UI hiding
- **Dashboard**: search/filter own submissions, soft delete (`deleted_at`), public/private toggle, sharing dialog
- **Learning module**: hierarchical lessons (`lessons` table with `parent_id` for modules→sub-lessons), XP/points system, per-lesson theory completion + optional "homework" (submit a photo scored against lesson goals via `goal_score`), bonus XP for completing a full module (`learning/actions.ts`)
- **Comments**: threaded comments on analyses with location-pinning (`location_x/y` — likely for annotating specific parts of a photo), admin moderation via admin client bypass
- **Community/Gallery**: public gallery of public analyses (`gallery/page.tsx`) and a photographer directory of public profiles (`community/page.tsx`)
- **Profiles**: editable profile with bio, business name, photography type tags, avatar
- **Support messaging**: in-app chat between user and admin (`messages` table, `conversation_status`, `chat-interface.tsx`, `admin/support-inbox.tsx`)
- **Admin panel**: user management + credit adjustment, all-submissions table, unclaimed-submissions table, soft-delete/restore/hard-delete, error log viewer, orphaned storage file cleanup, lesson CRUD, taxonomy (camera brands / photography types) tree editor, system prompt editor/versioning, support inbox
- **Content moderation signals**: Gemini returns `nsfw_score` and `ai_generated_score` per image (surfaced in gallery, likely used to filter/flag rather than hard-block currently)
- **SEO**: sitemap.ts, robots.ts, JSON-LD structured data (Review schema) on analysis and gallery pages, OG image via signed URL

## 5. Data model

From `supabase/schema.sql` + `lessons.sql` + `messages.sql` + `homework_migrations.sql` + migrations:

- `profiles` — id (=auth.users id), email, credits_balance, is_admin (added later), is_public, avatar_url, bio, business_name, full_name, photography_types (added later, undocumented migrations)
- `submissions` — image_path, thumbnail_path, category, goals(jsonb), context, status enum(queued/processing/done/error), user_id (nullable = guest), metadata(jsonb EXIF), lesson_id (FK→lessons), deleted_at (soft delete)
- `analyses` — submission_id FK, full_critique(jsonb — the whole Gemini response), preview_text, title, is_unlocked, score, goal_score, is_public (added later)
- `system_prompts` — versioned admin-editable AI prompts (though the actual analyze route currently hardcodes its prompt rather than reading from this table)
- `lessons` — slug, title, level (Beginner/Intermediate/Advanced), points, icon, parent_id (self-referencing tree), order_index, published, has_homework, learning_goals
- `user_lesson_progress` — (user_id, lesson_id) composite PK, points_awarded
- `user_homework_progress` — user_id, lesson_id, submission_id, points_awarded, unique(user_id, lesson_id)
- `messages` — user_id, content, is_from_admin, read_at, parent_id (support chat)
- `conversation_status` — per-user open/resolved flag for support
- `comments` — (inferred from usage, no canonical CREATE found in repo, only RLS/FK migrations) submission_id, user_id, parent_id, text, category, location_x/y
- `photography_types` — hierarchical taxonomy (slug, parent_id, sort_order), `camera_brands` — flat taxonomy
- `transactions` — Stripe purchase + admin credit-adjustment log (user_id, amount, currency, credits, type, stripe_session_id)
- `error_logs` — level, message, stack, context(jsonb), user_id, source(client/server), timestamp

**Notable gap**: there is no single canonical up-to-date schema file — `supabase/schema.sql` is the original v1 schema and many columns/tables (`is_admin`, `is_public`, `comments`, `camera_brands`, `transactions`, `error_logs`, `photography_types`) were added via later scattered migration files or possibly directly in the Supabase dashboard (not captured in any file). This is a real risk for onboarding/expansion.

## 6. Admin / payments / third-party integrations

- **Admin panel** (`src/app/admin/**`): full back-office — user table with credit adjustments, global submissions table, unclaimed-submissions view, soft-delete/restore/hard-delete with storage cleanup, orphaned-file scanner, error log viewer/deleter, support inbox with reply, lesson CRUD + taxonomy tree editor, system-prompt editor. Access gated by `profiles.is_admin`, checked manually in nearly every server action (no centralized middleware-level admin guard — repeated boilerplate in every function in `admin/actions.ts`)
- **Stripe**: one-time checkout only, 3 fixed credit packages (Starter $4.99/5 credits, Pro $14.99/20, Power $29.99/50), webhook-driven fulfillment with an atomic RPC (`increment_credits`/`decrement_credits`) plus manual fallback
- **Google Analytics 4** via `@next/third-parties/google`
- **Google Gemini** (`@google/generative-ai`) is the only AI integration

## 7. Recent git log themes

Recent commits (most recent first) show active, ongoing work on:
- `80aa518` update admin area for deletes and restores
- `505a518` / `373d901` "trying to fix" / "fixing the problem with claims when logging in" — the guest-submission claiming flow (linking anonymous uploads to a new account on login/signup); still unstable per commit messages ("trying to fix")
- `3d9aff4` banner change on locked analysis page — paywall/lock UI on `/analysis/[id]`
- `6f7c85d` learning redirects unauthenticated users to signup
- Earlier history shows the app growing from a simple "upload → paywall → Stripe unlock" tool (`cad848e update blured out critique`, `ab0c30e added ai detection`) into the fuller platform: `a84c882 added community and profiles`, `3e90e7c added comments to critiques`, `0084eae added ability to reply to the comments`, `cb1cca1 updates and adding more to learning stuff`, plus a `credits` model replacing the old per-analysis Stripe unlock (legacy/dead code remains in `api/webhook/route.ts` for the old single-analysis-unlock flow alongside the new credit-pack flow)
- Several security-hardening commits: `a3279da fixed a couple of security issues`, `6cd21dd fixed free analysis loophole!`, `c46c536 update for GDPR`

Confirms: a real paywall/locked-content system (server-side field stripping, not just CSS blur), a "learning" section with lessons+homework, and an auth "claims" system for guest uploads still being actively debugged (leftover `console.log`/`console.warn` debug statements in `analysis/[id]/page.tsx`'s claim logic, e.g. `[Claim Debug]`).

## 8. TODOs / unfinished / commented-out work

- `analysis/[id]/page.tsx` claim logic has a `// TEMP: For debugging/testing` comment and leftover `console.log`/`console.warn` debug statements — flagged by the dev themselves as unresolved/fragile
- `src/lib/supabase/migrations/comments_rls.sql` has an explicit inline TODO/note: the `deleteComment` admin-bypass RLS interaction is called out as a potential inconsistency ("FIX: In `deleteComment`, if admin, we should probably use `createAdminClient`...")
- `src/app/api/checkout/route.ts` has dead/duplicate code: two identical `return NextResponse.json({ url: session.url });` statements back to back (unreachable second line)
- `admin/actions.ts` — `getAdminDashboardData()` has multiple self-documented approximations: revenue calc limited to last 1000 transactions ("loading all transactions is bad"), `auth.admin.listUsers()` not paginated against the 50 profiles being shown, orphan-file detection is explicitly called "an estimation"
- `system_prompts` table/admin UI (`admin/prompt-form.tsx`, `updateSystemPrompt`) exists for versioning the AI prompt, but `api/analyze/route.ts` does not appear to read from this table — the prompt is hardcoded inline. Looks like a half-wired feature (admin can "save" a prompt that has no effect)
- `src/lib/supabase/migrations/` contains several one-off "inspect_*.sql" files (`inspect_columns.sql`, `inspect_comments.sql`, `inspect_constraint_def.sql`, `inspect_defaults.sql`, `inspect_fks.sql`) — look like ad-hoc debugging queries committed rather than real migrations, reinforcing there's no formal migration/schema-versioning discipline
- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BASE_URL` are used inconsistently across files (`analysis/[id]/page.tsx` uses `NEXT_PUBLIC_SITE_URL`, `auth/actions.ts` uses `NEXT_PUBLIC_BASE_URL`) — a minor config foot-gun (`.env.local.example` only defines `NEXT_PUBLIC_BASE_URL`, not `NEXT_PUBLIC_SITE_URL`)

## 9. Testing setup

**None.** No test files (`*.test.*`/`*.spec.*`), no Jest/Vitest/Playwright config, no `__tests__` directories, and no CI workflow (`.github` doesn't exist). `package.json` scripts are limited to `dev`, `build`, `start`, `lint`. Quality assurance appears to rely entirely on manual testing/production hotfixing (consistent with the git log's iterative "fixing X", "trying to fix Y" commit style).

## 10. Overall maturity assessment

This is a **live, real-revenue side project in active MVP-to-early-growth stage**, built solo (or by a very small team) with heavy AI-assisted iteration.

**Strengths**: genuinely solid server-side security posture (RLS + admin-client double-checks, server-side content stripping for the paywall rather than client-side hiding, signed URLs for private storage, GDPR-oriented commit), real payment integration with idempotent-ish credit RPCs + fallbacks, decent SEO investment (JSON-LD, sitemap, OG tags), and surprisingly broad feature surface (learning platform + community + support chat + admin back office) for a project this size.

**Weaknesses typical of early-stage/solo projects**: zero automated tests; schema not centrally version-controlled (multiple ad-hoc "inspect_*.sql" and undocumented columns added outside of any tracked migration); repeated admin-auth-check boilerplate copy-pasted into ~20 server actions instead of a shared guard/middleware; debug `console.log`s and a `TEMP` comment left in production auth-claim code; a half-wired system-prompt admin feature; a dead-code duplicate return statement; inconsistent env var naming; the git log's own language ("trying to fix", "hopefully this fixes it") signals the claim/login-linking flow is a known soft spot.

## 11. Recommendations for expansion

**Fix first** (these will bite harder the more you build on top of them):
1. Consolidate the DB schema into a single source of truth — adopt real, tracked Supabase migrations instead of ad-hoc `inspect_*.sql` files and undocumented dashboard changes.
2. Stabilize the guest-claim/login-linking flow — it's the shakiest part of the app and touches money (credits) and account linking; add at least basic test coverage around credit-deduction and guest-claim logic before building more auth-dependent features on top.
3. Centralize the `is_admin` check into shared middleware/helper instead of copy-pasted boilerplate across ~20 server actions.

**Expansion directions**, roughly in order of leverage:
1. **Deepen the learning loop** — streaks/reminders, "recommended next lesson" driven by weak areas from past critiques, badges/certificates. Reuses existing infra.
2. **Wire up the system-prompt table** — `system_prompts` exists in the admin UI but isn't read by `api/analyze/route.ts`. Wiring it up enables prompt tuning/A-B testing without deploys, and is a foundation for critique "styles" (harsh mentor vs. encouraging) or genre-specific prompts.
3. **Community/social features** — following other photographers, activity feeds, lightweight contests/challenges tied into the credit economy.
4. **Monetization expansion** — add a subscription tier (unlimited critiques or monthly credit allowance) alongside the existing one-time Stripe checkout.
5. **Admin/ops leverage** — as the admin surface grows, centralize the repeated auth-check pattern now while it's cheap.
