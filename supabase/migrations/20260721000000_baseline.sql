-- ============================================================================
-- Snap Critique — Baseline migration
-- ============================================================================
-- Captures CURRENT PRODUCTION STATE as reconstructed on 2026-07-21 by
-- reverse-engineering the live schema from application code (src/**),
-- because the database was never fully managed through tracked migrations —
-- many tables/columns below were created directly in the Supabase dashboard
-- and had no corresponding .sql file anywhere in the repo before this.
--
-- This is migration #1 in the newly-adopted tracked-migrations workflow
-- (supabase/migrations/<timestamp>_<name>.sql, applied via
-- `npx supabase db push`). It intentionally matches production as closely
-- as possible rather than "fixing" anything — cleanups/new features are
-- separate, later migrations (see 20260721000001_credit_fixes.sql).
--
-- VERIFIED 2026-07-21 against the live project via PostgREST's OpenAPI
-- introspection endpoint, which resolved every originally-"UNVERIFIED"
-- marker and corrected several real mistakes (see supabase/schema.sql's
-- header for the verification method, and git history for what changed).
--
-- IMPORTANT: if this project's Supabase database already has these tables
-- (i.e. you're linking tracked migrations onto an existing live project
-- rather than provisioning a fresh one), do NOT run this migration as-is —
-- it will fail on `create table` for tables that already exist. Instead,
-- baseline the migration history without re-applying it:
--   npx supabase migration repair --status applied 20260721000000
-- then apply only 20260721000001_credit_fixes.sql onward. See README.md's
-- Database Setup section.
--
-- The old fragment files this replaces (previous supabase/schema.sql,
-- lessons.sql, messages.sql, conversation_status.sql, homework_migrations.sql,
-- and src/lib/supabase/migrations/*.sql) are kept for historical reference
-- but are superseded by supabase/migrations/*.
-- ============================================================================


-- ============================================================================
-- ENUM TYPES
-- ============================================================================

create type submission_status as enum ('queued', 'processing', 'done', 'error');
-- CONFIRMED: 'pending' is NOT a valid value of this enum (verified against
-- the live DB on 2026-07-21). The 'pending' check in
-- src/app/analysis/[id]/page.tsx is dead defensive code.

create type comment_type as enum ('general', 'critique', 'praise', 'question', 'suggestion');
-- CONFIRMED a real Postgres enum (verified against the live DB), not plain
-- text as originally guessed.


-- ============================================================================
-- TABLE: profiles
-- One row per auth.users user (created via trigger/server action on signup).
-- ============================================================================

create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  credits_balance int default 0,                 -- new users get 5 free credits (granted in app code, not a DB default)
  is_admin boolean default false not null,
  is_public boolean default false not null,       -- controls visibility on /community
  full_name text,
  business_name text,
  bio text,
  website_url text,
  avatar_url text,                                -- storage path OR full http(s) URL for OAuth-provided avatars
  camera_brands text[],                            -- array of camera_brands.name STRINGS (not FK ids)
  photography_types text[],                        -- array of photography_types.name STRINGS (not FK ids)
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- UNVERIFIED: public profiles must be readable by anyone for /community and
-- /profile/[id] to work; no committed policy exists for this. Likely handled
-- via createAdminClient() (service role) in server actions/pages instead of
-- a public SELECT policy. Verify and add an explicit policy if needed:
-- create policy "Public profiles are viewable by everyone" on public.profiles
--   for select using (is_public = true);


-- ============================================================================
-- TABLE: submissions
-- One row per uploaded photo. user_id is nullable to support guest uploads
-- (claimed later via the guest_token_<submissionId> cookie flow).
-- ============================================================================

create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),    -- nullable for guests
  image_path text not null,
  thumbnail_path text,
  category text,
  goals jsonb,                                     -- array of strings
  context text,
  status submission_status default 'queued',
  metadata jsonb,                                   -- EXIF: make, camera, lens, iso, focal_length,
                                                      -- aperture, shutter_speed, exposure_comp, metering, flash, datetime
  lesson_id uuid references public.lessons(id) on delete set null,  -- set when submitted as lesson homework
  deleted_at timestamptz,                            -- soft delete; NULL = active
  created_at timestamptz default now(),
  photographer_profile_id uuid  -- FK to photographer_profiles added below (after that table exists); CONFIRMED present, not referenced anywhere in src/
);

alter table public.submissions enable row level security;

create policy "Anyone can insert submissions" on public.submissions
  for insert with check (true);

create policy "Users can view own submissions" on public.submissions
  for select using (auth.uid() = user_id);


-- ============================================================================
-- TABLE: analyses
-- One row per completed AI critique for a submission.
-- ============================================================================

create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) not null,
  -- CONFIRMED: analyses has NO user_id column (verified against the live
  -- schema). Ownership lives only on submissions.user_id.
  full_critique jsonb,                                -- full structured Gemini response, see shape below
  preview_text text,                                  -- shown pre-unlock, for the paywall
  title text,
  score int,                                          -- overall 0-100 score (mirrors full_critique.scores.overall)
  goal_score int,                                     -- set when submission is lesson homework
  is_unlocked boolean default false,
  is_public boolean default false not null,           -- controls visibility on /gallery
  created_at timestamptz default now(),
  photographer_profile_id uuid  -- FK to photographer_profiles added below (after that table exists); CONFIRMED present, not referenced anywhere in src/
);

alter table public.analyses enable row level security;

-- UNVERIFIED: no committed policies for analyses beyond RLS being enabled.
-- The app appears to rely heavily on createAdminClient() (service role) in
-- server actions/pages for analyses reads/writes, bypassing RLS. If any
-- client-side reads happen directly, matching SELECT policies are needed,
-- e.g.:
-- create policy "Public analyses are viewable by everyone" on public.analyses
--   for select using (is_public = true);
-- create policy "Owners can view own analyses" on public.analyses
--   for select using (auth.uid() = user_id);

-- full_critique jsonb shape (informational, not enforced by Postgres):
-- {
--   "scores": { "composition": int, "technique": int, "creativity": int, "overall": int },
--   "goal_score": int | null,
--   "goal_feedback": string | null,
--   "nsfw_score": number,
--   "ai_generated_score": number,
--   "description": string,
--   "strengths": string[],
--   "improvements": [{ "title": string, "description": string, "priority": "High"|"Medium"|"Low" }],
--   "technical_assessment": string,
--   "next_steps": string[],
--   "preview_summary": string,
--   "title": string,
--   "score": int
-- }


-- ============================================================================
-- TABLE: system_prompts
-- Versioned AI prompt storage. NOTE: as of this writing, api/analyze/route.ts
-- hardcodes its prompt inline and does NOT read from this table — the admin
-- UI to edit/version prompts here currently has no effect on generation.
-- ============================================================================

create table public.system_prompts (
  id uuid default gen_random_uuid() primary key,
  version text,                                       -- e.g. "v1.0"
  content text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

alter table public.system_prompts enable row level security;

create policy "Anyone can read active prompts" on public.system_prompts
  for select using (true);


-- ============================================================================
-- TABLE: lessons
-- Hierarchical: modules are rows with parent_id null; sub-lessons reference
-- their parent module. Referenced by src/config/lesson-registry.tsx for
-- custom rich lesson page components keyed by slug.
-- ============================================================================

create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  description text,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  points int not null default 0,
  icon text,                                           -- Lucide icon name
  parent_id uuid references public.lessons(id),
  order_index int default 0,
  published boolean default false,
  has_homework boolean default false,
  learning_goals text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;

create policy "Lessons are viewable by authenticated users"
  on public.lessons for select
  to authenticated
  using (true);


-- ============================================================================
-- TABLE: user_lesson_progress
-- Tracks completed lesson "theory" sections and XP awarded.
-- ============================================================================

create table public.user_lesson_progress (
  user_id uuid references auth.users(id) not null,
  lesson_id uuid references public.lessons(id) not null,
  completed_at timestamptz default timezone('utc'::text, now()) not null,
  points_awarded int not null,
  primary key (user_id, lesson_id)
);

alter table public.user_lesson_progress enable row level security;

create policy "Users can view their own progress"
  on public.user_lesson_progress for select
  to authenticated
  using (auth.uid() = user_id);

-- No client-side INSERT policy: progress is only written server-side via
-- createAdminClient() (service role) in learning/actions.ts, to prevent
-- users from awarding themselves XP directly.


-- ============================================================================
-- TABLE: user_homework_progress
-- Bonus XP for submitting a photo as lesson homework and having it scored.
-- ============================================================================

create table public.user_homework_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete set null,
  points_awarded int default 0,
  completed_at timestamptz default now(),
  unique (user_id, lesson_id)
);

alter table public.user_homework_progress enable row level security;

create policy "Users can view their own homework progress"
  on public.user_homework_progress for select
  using (auth.uid() = user_id);

-- Writes go through createAdminClient() (service role) in
-- learning/actions.ts and api/analyze/route.ts, so no client INSERT policy.


-- ============================================================================
-- TABLE: comments
-- Threaded comments on analyses, with optional (x, y) pin coordinates for
-- annotating a specific point on the photo. UNVERIFIED: no CREATE TABLE was
-- ever committed for this table — it was created directly in the Supabase
-- dashboard. This definition is synthesized entirely from application code
-- (src/app/analysis/actions.ts) and the RLS/FK fragments that DO exist
-- (src/lib/supabase/migrations/{add,fix}_comments_fk.sql, comments_rls.sql).
-- Verify column types/defaults against the live database before trusting
-- this to recreate the table from scratch.
-- ============================================================================

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id),
  user_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id),       -- self-referencing, for threaded replies
  text text not null,
  category comment_type default 'general',
  location_x double precision,
  location_y double precision,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- KNOWN ISSUE (flagged in comments_rls.sql, unresolved): the deleteComment
-- server action checks admin status manually with the user-scoped client,
-- but if the acting user is an admin deleting someone ELSE's comment, this
-- RLS policy will reject it because auth.uid() != user_id. deleteComment
-- should use createAdminClient() (service role) for the admin-delete path
-- to bypass RLS, the same pattern used elsewhere for admin operations.


-- ============================================================================
-- TABLE: photography_types
-- Hierarchical taxonomy of photography genres/specialties (e.g. Portrait ->
-- Wedding, Landscape -> Astro). Managed via the admin taxonomy editor.
-- NOTE: profiles.photography_types stores selected type NAMES as a text[],
-- not FKs into this table — the two are only loosely connected in the app.
-- UNVERIFIED: no CREATE TABLE was ever committed; base columns below are
-- synthesized from admin taxonomy code plus the one ALTER TABLE migration
-- that does exist (src/lib/supabase/migrations/update_types_hierarchy.sql).
-- ============================================================================

create table public.photography_types (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  slug text unique,
  parent_id uuid references public.photography_types(id),
  sort_order int default 0
);


-- ============================================================================
-- TABLE: camera_brands
-- Flat taxonomy of camera brands, managed via the admin taxonomy editor.
-- UNVERIFIED: zero SQL evidence of this table anywhere (no CREATE, no
-- ALTER) — 100% created directly in the Supabase dashboard. Columns
-- inferred purely from .insert({ name }) / .select() usage.
-- ============================================================================

create table public.camera_brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);


-- ============================================================================
-- TABLE: transactions
-- Log of Stripe purchases and admin credit adjustments. Also contains
-- legacy rows from the old single-analysis "unlock" flow that predates the
-- current credit-pack model (see api/webhook/route.ts for both code paths).
-- UNVERIFIED: no CREATE TABLE ever committed; synthesized from
-- api/webhook/route.ts and admin/actions.ts usage.
-- ============================================================================

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),          -- nullable: legacy guest "unlock" purchases had no user_id
  stripe_session_id text not null,                        -- synthetic id (admin_<user_id>_<timestamp>) for manual admin adjustments
  amount int,                                              -- cents, from Stripe amount_total
  currency text,
  credits int,
  type text,                                                -- 'credit_purchase' | 'unlock' | 'admin_adjustment' (app-level, not DB enum)
  created_at timestamptz default now()
);


-- ============================================================================
-- TABLE: error_logs
-- Client + server error logging, viewable/purgeable in the admin panel.
-- NOTE: this table uses a column named `timestamp`, not `created_at`,
-- inconsistent with every other table's naming convention.
-- UNVERIFIED: no CREATE TABLE ever committed; synthesized from
-- src/lib/logger.ts and src/app/api/log/route.ts.
-- ============================================================================

create table public.error_logs (
  id uuid default gen_random_uuid() primary key,
  "timestamp" timestamptz default now(),
  level text default 'error',                             -- 'info' | 'warn' | 'error' | 'fatal' (app-level, not DB enum)
  message text not null,
  stack text,
  context jsonb,
  user_id uuid,                                             -- no DB FK enforced; joined manually to profiles in admin/actions.ts
  source text
);

-- ============================================================================
-- TABLE: photographer_profiles
-- DISCOVERED via live-schema introspection — NOT referenced anywhere in
-- src/ (confirmed by grep). Scaffolding for a photographer-profile feature
-- that was either abandoned or never wired up; the app uses `profiles` for
-- all profile functionality instead. submissions.photographer_profile_id
-- and analyses.photographer_profile_id both point here and are similarly
-- unused. Included for completeness/FK integrity, not because anything
-- depends on it.
-- ============================================================================

create table public.photographer_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  is_public boolean default false not null,
  location text,
  experience_level text,
  shooting_focus text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Deferred FKs from submissions/analyses (declared without `references`
-- above since photographer_profiles didn't exist yet at that point in the
-- file — added here now that it does).
alter table public.submissions
  add constraint submissions_photographer_profile_id_fkey
  foreign key (photographer_profile_id) references public.photographer_profiles(id);

alter table public.analyses
  add constraint analyses_photographer_profile_id_fkey
  foreign key (photographer_profile_id) references public.photographer_profiles(id);


-- ============================================================================
-- TABLE: messages
-- In-app support chat between a user and admin staff.
-- ============================================================================

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  content text not null,
  is_from_admin boolean default false,
  read_at timestamptz,
  created_at timestamptz default now(),
  parent_id uuid references public.messages(id)
);

create index idx_messages_user_id on public.messages(user_id);
create index idx_messages_created_at on public.messages(created_at desc);


-- ============================================================================
-- TABLE: conversation_status
-- One row per user tracking whether their support conversation is open or
-- resolved.
-- ============================================================================

create table public.conversation_status (
  user_id uuid primary key references auth.users(id),
  status text check (status in ('open', 'resolved')) default 'open',
  updated_at timestamptz default now()
);

-- RLS not enabled: this table is accessed exclusively via createAdminClient()
-- (service role) in server actions.


-- ============================================================================
-- RPC FUNCTIONS
-- Atomic credit increment/decrement, used to avoid read-modify-write races
-- on profiles.credits_balance. Both call sites have a manual UPDATE fallback
-- if the RPC errors, implying these should be SECURITY DEFINER functions.
-- UNVERIFIED: exact function bodies were never found in the repo — this is
-- a best-effort reconstruction matching observed call signatures
-- (rpc('increment_credits', { userid, count }) / rpc('decrement_credits',
-- { userid, count })). Confirm against the live database before relying on
-- this to recreate the functions from scratch.
-- ============================================================================

create or replace function public.increment_credits(userid uuid, count int)
returns void
language sql
security definer
as $$
  update public.profiles
  set credits_balance = credits_balance + count
  where id = userid;
$$;

create or replace function public.decrement_credits(userid uuid, count int)
returns void
language sql
security definer
as $$
  update public.profiles
  set credits_balance = greatest(credits_balance - count, 0)
  where id = userid;
$$;


-- ============================================================================
-- STORAGE
-- Single private bucket: 'submissions'. All reads go through
-- createSignedUrl() (1hr expiry); there are no public URLs.
-- Path conventions:
--   uploads/{random}_{timestamp}.{ext}   original uploaded image
--   previews/{random}_{timestamp}.{ext}  resized/stripped preview (used for
--                                        Gemini analysis when present)
--   avatars/{userId}_{timestamp}.{ext}   user avatar images
-- ============================================================================

-- insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false);
