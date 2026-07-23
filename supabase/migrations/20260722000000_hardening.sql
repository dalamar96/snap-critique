-- ============================================================================
-- Production hardening: rate limiting, admin audit log, analyses RLS
-- ============================================================================
-- NOT YET APPLIED to production as of writing this file — apply via the
-- Supabase SQL Editor or `npx supabase db push` before relying on any of
-- the app code that calls check_rate_limit() or writes to
-- admin_audit_log (both are written defensively to fail open / no-op with
-- a logged warning if these don't exist yet, so deploying the app code
-- before running this migration won't hard-break anything — but rate
-- limiting and audit logging simply won't be active until it's applied).
-- ============================================================================


-- ============================================================================
-- TABLE + RPC: rate_limits / check_rate_limit
-- Postgres-backed rate limiting (chosen over an external service like
-- Upstash so it ships without a new account/credentials). One atomic
-- upsert per call — no read-then-write race, same pattern as
-- check_and_decrement_credits in 20260721000001_credit_fixes.sql.
-- ============================================================================

create table public.rate_limits (
  key text primary key,          -- e.g. 'login:203.0.113.5' or 'analyze:user-uuid'
  count int not null default 1,
  window_start timestamptz not null default now()
);

-- Returns true if the call is allowed (under the limit), false if the
-- caller should be rejected (rate-limited). Resets the window
-- automatically once it has expired.
create or replace function public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set
      count = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then 1
        else public.rate_limits.count + 1
      end,
      window_start = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then now()
        else public.rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Housekeeping: rows for expired windows accumulate forever otherwise.
-- Not scheduled automatically here (no pg_cron assumption) — run
-- periodically, e.g. via a Supabase scheduled function, or manually:
--   delete from public.rate_limits where window_start < now() - interval '1 day';


-- ============================================================================
-- TABLE: admin_audit_log
-- Attributes destructive/mutating admin actions to the admin who performed
-- them (previously only credit adjustments were logged, via `transactions`).
-- ============================================================================

create table public.admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid not null references public.profiles(id),
  action text not null,               -- e.g. 'hard_delete_submission', 'restore_submission', 'update_user_credits'
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamptz default now() not null
);

create index idx_admin_audit_log_created_at on public.admin_audit_log(created_at desc);

alter table public.admin_audit_log enable row level security;
-- No client policies — written and read exclusively via createAdminClient()
-- (service role) in admin/actions.ts, same pattern as error_logs.


-- ============================================================================
-- RLS: analyses + profiles
-- Defense-in-depth only — in practice almost every read/write in this app
-- goes through createAdminClient() (service role, bypasses RLS), so these
-- policies matter for any code path that slips and uses the anon-key
-- client, not for current app behavior. analyses has no user_id column
-- (confirmed against the live schema) so "owner" access is checked via a
-- join back through submissions.
--
-- VERIFY BEFORE APPLYING: confirm no client-side (browser, anon-key) code
-- path relies on analyses/profiles being unreadable in a way these
-- policies would change. Best done by applying to a staging project first
-- if you have one.
-- ============================================================================

create policy "Public analyses are viewable by everyone" on public.analyses
  for select using (is_public = true);

create policy "Owners can view own analyses" on public.analyses
  for select using (
    exists (
      select 1 from public.submissions
      where submissions.id = analyses.submission_id
        and submissions.user_id = auth.uid()
    )
  );

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (is_public = true);
