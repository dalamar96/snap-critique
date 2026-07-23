-- ============================================================================
-- OPTIONAL: drop unused photographer_profiles scaffolding
-- ============================================================================
-- Confirmed via grep on 2026-07-21/22 that `photographer_profiles` and both
-- `photographer_profile_id` FK columns (on submissions and analyses) are
-- not referenced anywhere in src/. This looks like scaffolding for a
-- feature that was abandoned or never wired up.
--
-- THIS IS THE LOWEST-CONFIDENCE ITEM IN THIS HARDENING PASS. A codebase
-- grep can't rule out something external depending on this table (another
-- service pointed at the same Supabase project, a half-built feature branch
-- elsewhere, a BI/analytics tool reading it directly, etc.). Confirm that
-- before running this. If in doubt, leave it — it's inert either way.
-- ============================================================================

alter table public.submissions drop constraint if exists submissions_photographer_profile_id_fkey;
alter table public.submissions drop column if exists photographer_profile_id;

alter table public.analyses drop constraint if exists analyses_photographer_profile_id_fkey;
alter table public.analyses drop column if exists photographer_profile_id;

drop table if exists public.photographer_profiles;
