-- ============================================================================
-- Credit-race-condition fix: atomic check-and-decrement RPC
-- ============================================================================
-- Prior to this migration, credit deduction was a separate "read balance,
-- decide, later decrement" sequence with a real gap in between (e.g.
-- api/analyze/route.ts checked credits_balance before calling Gemini, then
-- decremented only after Gemini returned — two concurrent requests from a
-- user with 1 credit could both pass the check before either decremented,
-- a double-spend). This function makes the check-and-deduct a single
-- atomic statement so there is no window for that race.
--
-- Existing increment_credits/decrement_credits are left as-is — they're
-- still used for refunds and other call sites that don't need the
-- check-and-deduct-atomically guarantee.
-- ============================================================================

create or replace function public.check_and_decrement_credits(userid uuid, count int)
returns boolean
language sql
security definer
as $$
  update public.profiles
  set credits_balance = credits_balance - count
  where id = userid and credits_balance >= count
  returning true;
$$;

-- returns NULL (falsy) if no row matched (insufficient balance or unknown
-- user); returns true if the decrement succeeded. Callers should treat any
-- non-true result as "insufficient credits."
