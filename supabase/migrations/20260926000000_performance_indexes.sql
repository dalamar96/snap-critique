-- Performance: indexes for the hot query paths + an aggregate RPC for the
-- dashboard peer benchmark (previously computed by pulling every submission
-- row into Node on each dashboard load).
--
-- NOT applied automatically — review, then run via `supabase db push` or the
-- SQL editor. Every statement is idempotent (IF NOT EXISTS / OR REPLACE).

-- Dashboard + progress: a user's live submissions, newest first.
create index if not exists idx_submissions_user_created
  on public.submissions (user_id, created_at desc)
  where deleted_at is null;

-- Peer benchmark / admin counts: filter by status among non-deleted rows.
create index if not exists idx_submissions_status_category
  on public.submissions (status, category)
  where deleted_at is null;

-- Joins from submissions -> analyses (dashboard, analysis page, gallery).
create index if not exists idx_analyses_submission_id
  on public.analyses (submission_id);

-- Gallery / community / profile: public analyses, newest first.
create index if not exists idx_analyses_public_created
  on public.analyses (created_at desc)
  where is_public = true;

-- Analysis page comment thread.
create index if not exists idx_comments_submission_created
  on public.comments (submission_id, created_at);

-- Public profile listing.
create index if not exists idx_profiles_public_created
  on public.profiles (created_at desc)
  where is_public = true;

-- Progress data joins lesson completions per user (PK is (user_id, lesson_id),
-- already covers user_lesson_progress). Homework has unique(user_id, lesson_id).

-- Peer benchmark aggregate: one row per category instead of every submission.
create or replace function public.category_score_averages()
returns table (category text, average_score numeric)
language sql
stable
security definer
set search_path = public
as $$
  select s.category, avg(a.score)::numeric as average_score
  from public.submissions s
  join public.analyses a on a.submission_id = s.id
  where s.status = 'done'
    and s.deleted_at is null
    and s.category is not null
    and a.score is not null
  group by s.category
$$;

-- Aggregates only, but keep it server-side: callable by the service role
-- (the app's admin client), not by anon/authenticated browsers.
revoke all on function public.category_score_averages() from public, anon, authenticated;
grant execute on function public.category_score_averages() to service_role;
