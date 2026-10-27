-- ============================================================================
-- Referral (affiliate) program
-- ============================================================================
-- Every profile gets a shareable referral_code. A visitor arriving via
-- /?ref=<code> gets a cookie (src/proxy.ts); if they then sign up, a
-- `referrals` row links them to the referrer.
--
-- Each credit purchase by a referred user queues a `referral_rewards` row
-- (a percentage of the credits bought) in 'pending' status. Rewards are held
-- for a few days so refunds/chargebacks can void them before the referrer is
-- paid; a daily cron (/api/cron/release-referral-rewards) releases matured
-- rewards. A refund or dispute after release claws the credits back.
--
-- Reward lifecycle:  pending ──release──> released ──refund/dispute──> reversed
--                       └──refund/dispute──> voided
--
-- Percent / hold / window are passed in from src/lib/referrals.ts so the
-- policy lives in one place. Idempotent. NOT applied automatically.
-- ============================================================================

alter table public.profiles
  add column if not exists referral_code text unique
    default substr(md5(gen_random_uuid()::text), 1, 8);

-- Backfill existing rows (the default only fires for new inserts).
update public.profiles
  set referral_code = substr(md5(gen_random_uuid()::text), 1, 8)
  where referral_code is null;


-- ============================================================================
-- TABLE: referrals
-- One row per referred user (referred_id is unique, so a user can only ever
-- be attributed to one referrer). created_at starts the reward window.
-- ============================================================================

create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,
  constraint referrals_no_self_referral check (referrer_id <> referred_id)
);

create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);

alter table public.referrals enable row level security;

drop policy if exists "Referrers can view own referrals" on public.referrals;
create policy "Referrers can view own referrals" on public.referrals
  for select using (auth.uid() = referrer_id);


-- ============================================================================
-- TABLE: referral_rewards
-- One row per qualifying purchase. stripe_session_id is unique so a
-- redelivered checkout webhook can't queue a second reward;
-- stripe_payment_intent is how refund/dispute events find the reward.
-- ============================================================================

create table if not exists public.referral_rewards (
  id uuid default gen_random_uuid() primary key,
  referral_id uuid not null references public.referrals(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  purchase_credits int not null,
  reward_credits int not null,
  status text not null default 'pending'
    check (status in ('pending', 'released', 'voided', 'reversed')),
  release_after timestamptz not null,
  released_at timestamptz,
  voided_at timestamptz,                 -- set for both 'voided' and 'reversed'
  created_at timestamptz default now() not null
);

create index if not exists idx_referral_rewards_referrer_id on public.referral_rewards(referrer_id);
create index if not exists idx_referral_rewards_pending on public.referral_rewards(release_after)
  where status = 'pending';
create index if not exists idx_referral_rewards_payment_intent on public.referral_rewards(stripe_payment_intent);

alter table public.referral_rewards enable row level security;

-- Referrers can see their own pending/earned rewards on the dashboard.
-- Writes go exclusively through the security-definer RPCs below.
drop policy if exists "Referrers can view own referral rewards" on public.referral_rewards;
create policy "Referrers can view own referral rewards" on public.referral_rewards
  for select using (auth.uid() = referrer_id);


-- ============================================================================
-- RPC: queue_referral_reward
-- Called by the Stripe webhook on every credit purchase. No-ops (returns
-- NULL) if the buyer wasn't referred, the reward window has expired, or this
-- session was already queued. Otherwise returns the queued reward credits.
-- p_window_months NULL = rewards for the lifetime of the referral.
-- ============================================================================

-- Drop the earlier first-purchase-only version if it was ever applied.
drop function if exists public.grant_referral_reward(uuid, int, text);

create or replace function public.queue_referral_reward(
  p_referred_id uuid,
  p_session_id text,
  p_payment_intent text,
  p_purchase_credits int,
  p_percent int,
  p_hold_days int,
  p_window_months int
)
returns int
language plpgsql
security definer
as $$
declare
  v_referral public.referrals%rowtype;
  v_reward int;
begin
  select * into v_referral from public.referrals where referred_id = p_referred_id;
  if not found then
    return null;
  end if;

  if p_window_months is not null
     and now() > v_referral.created_at + make_interval(months => p_window_months) then
    return null;
  end if;

  v_reward := greatest(floor(p_purchase_credits * p_percent / 100.0)::int, 1);

  insert into public.referral_rewards
    (referral_id, referrer_id, stripe_session_id, stripe_payment_intent,
     purchase_credits, reward_credits, release_after)
  values
    (v_referral.id, v_referral.referrer_id, p_session_id, p_payment_intent,
     p_purchase_credits, v_reward, now() + make_interval(days => p_hold_days))
  on conflict (stripe_session_id) do nothing;

  if not found then
    return null;
  end if;
  return v_reward;
end;
$$;


-- ============================================================================
-- RPC: release_referral_rewards
-- Called daily by the cron route. Moves every matured pending reward to
-- 'released', credits the referrers, and logs a 'referral_reward'
-- transaction per reward — all in one statement. The status = 'pending'
-- guard makes overlapping runs safe (a row is only ever released once).
-- Returns the number of rewards released.
-- ============================================================================

create or replace function public.release_referral_rewards()
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  with released as (
    update public.referral_rewards
      set status = 'released', released_at = now()
      where status = 'pending' and release_after <= now()
      returning referrer_id, reward_credits, stripe_session_id
  ),
  credited as (
    update public.profiles p
      set credits_balance = coalesce(p.credits_balance, 0) + t.total
      from (select referrer_id, sum(reward_credits)::int as total from released group by referrer_id) t
      where p.id = t.referrer_id
  ),
  logged as (
    insert into public.transactions (user_id, stripe_session_id, amount, currency, credits, type)
      select referrer_id, 'referral_' || stripe_session_id, 0, 'usd', reward_credits, 'referral_reward'
      from released
  )
  select count(*) into v_count from released;

  return v_count;
end;
$$;


-- ============================================================================
-- RPC: void_referral_rewards
-- Called by the Stripe webhook on charge.refunded / charge.dispute.created.
-- Pending rewards for the payment are voided (never paid). Already-released
-- rewards are reversed: the credits are clawed back from the referrer
-- (floored at 0 — credits they've already spent are not recovered) and a
-- negative 'referral_reversal' transaction is logged. Idempotent: rewards
-- already voided/reversed are untouched. Returns the number of rewards
-- affected.
-- ============================================================================

create or replace function public.void_referral_rewards(p_payment_intent text)
returns int
language plpgsql
security definer
as $$
declare
  v_voided int;
  v_reversed int;
begin
  update public.referral_rewards
    set status = 'voided', voided_at = now()
    where stripe_payment_intent = p_payment_intent and status = 'pending';
  get diagnostics v_voided = row_count;

  with reversed as (
    update public.referral_rewards
      set status = 'reversed', voided_at = now()
      where stripe_payment_intent = p_payment_intent and status = 'released'
      returning referrer_id, reward_credits, stripe_session_id
  ),
  debited as (
    update public.profiles p
      set credits_balance = greatest(coalesce(p.credits_balance, 0) - t.total, 0)
      from (select referrer_id, sum(reward_credits)::int as total from reversed group by referrer_id) t
      where p.id = t.referrer_id
  ),
  logged as (
    insert into public.transactions (user_id, stripe_session_id, amount, currency, credits, type)
      select referrer_id, 'referral_reversal_' || stripe_session_id, 0, 'usd', -reward_credits, 'referral_reversal'
      from reversed
  )
  select count(*) into v_reversed from reversed;

  return v_voided + v_reversed;
end;
$$;

revoke execute on function public.queue_referral_reward(uuid, text, text, int, int, int, int) from public, anon, authenticated;
revoke execute on function public.release_referral_rewards() from public, anon, authenticated;
revoke execute on function public.void_referral_rewards(text) from public, anon, authenticated;
