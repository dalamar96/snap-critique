-- ============================================================================
-- Referral program: admin management
-- ============================================================================
-- Supports /admin/referrals:
--   * referral_rewards.purchase_amount — the payment (cents) behind each
--     reward, so referred revenue can be reported from one table.
--   * profiles.referral_rewards_suspended — fraud control; a suspended
--     referrer's referrals still attribute, but no new rewards are queued.
--   * admin RPCs to release a pending reward early or cancel a reward
--     (void if pending, claw back if released).
-- Requires 20261026000000_referrals.sql. Idempotent. NOT applied automatically.
-- ============================================================================

alter table public.referral_rewards
  add column if not exists purchase_amount int;   -- cents; null for rewards queued before this migration

alter table public.profiles
  add column if not exists referral_rewards_suspended boolean not null default false;


-- ============================================================================
-- RPC: queue_referral_reward (replaces the version in 20261026000000)
-- Same behavior, plus: records purchase_amount, and queues nothing for a
-- suspended referrer.
-- ============================================================================

drop function if exists public.queue_referral_reward(uuid, text, text, int, int, int, int);

create or replace function public.queue_referral_reward(
  p_referred_id uuid,
  p_session_id text,
  p_payment_intent text,
  p_purchase_credits int,
  p_purchase_amount int,
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

  if exists (
    select 1 from public.profiles
    where id = v_referral.referrer_id and referral_rewards_suspended
  ) then
    return null;
  end if;

  v_reward := greatest(floor(p_purchase_credits * p_percent / 100.0)::int, 1);

  insert into public.referral_rewards
    (referral_id, referrer_id, stripe_session_id, stripe_payment_intent,
     purchase_credits, purchase_amount, reward_credits, release_after)
  values
    (v_referral.id, v_referral.referrer_id, p_session_id, p_payment_intent,
     p_purchase_credits, p_purchase_amount, v_reward, now() + make_interval(days => p_hold_days))
  on conflict (stripe_session_id) do nothing;

  if not found then
    return null;
  end if;
  return v_reward;
end;
$$;


-- ============================================================================
-- RPC: admin_release_referral_reward
-- Pays one pending reward now, skipping the rest of its hold. Same effects
-- as release_referral_rewards() for that row. Returns true if released,
-- false if it wasn't pending.
-- ============================================================================

create or replace function public.admin_release_referral_reward(p_reward_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_reward public.referral_rewards%rowtype;
begin
  update public.referral_rewards
    set status = 'released', released_at = now()
    where id = p_reward_id and status = 'pending'
    returning * into v_reward;

  if not found then
    return false;
  end if;

  update public.profiles
    set credits_balance = coalesce(credits_balance, 0) + v_reward.reward_credits
    where id = v_reward.referrer_id;

  insert into public.transactions (user_id, stripe_session_id, amount, currency, credits, type)
    values (v_reward.referrer_id, 'referral_' || v_reward.stripe_session_id, 0, 'usd',
            v_reward.reward_credits, 'referral_reward');

  return true;
end;
$$;


-- ============================================================================
-- RPC: admin_cancel_referral_reward
-- Pending -> 'voided' (never paid). Released -> 'reversed': credits clawed
-- back from the referrer (floored at 0) with a negative 'referral_reversal'
-- transaction, same as void_referral_rewards(). Returns the new status, or
-- NULL if the reward was already voided/reversed.
-- ============================================================================

create or replace function public.admin_cancel_referral_reward(p_reward_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_reward public.referral_rewards%rowtype;
begin
  update public.referral_rewards
    set status = 'voided', voided_at = now()
    where id = p_reward_id and status = 'pending';
  if found then
    return 'voided';
  end if;

  update public.referral_rewards
    set status = 'reversed', voided_at = now()
    where id = p_reward_id and status = 'released'
    returning * into v_reward;
  if not found then
    return null;
  end if;

  update public.profiles
    set credits_balance = greatest(coalesce(credits_balance, 0) - v_reward.reward_credits, 0)
    where id = v_reward.referrer_id;

  insert into public.transactions (user_id, stripe_session_id, amount, currency, credits, type)
    values (v_reward.referrer_id, 'referral_reversal_' || v_reward.stripe_session_id, 0, 'usd',
            -v_reward.reward_credits, 'referral_reversal');

  return 'reversed';
end;
$$;

revoke execute on function public.queue_referral_reward(uuid, text, text, int, int, int, int, int) from public, anon, authenticated;
revoke execute on function public.admin_release_referral_reward(uuid) from public, anon, authenticated;
revoke execute on function public.admin_cancel_referral_reward(uuid) from public, anon, authenticated;
