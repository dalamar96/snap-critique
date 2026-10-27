-- ============================================================================
-- Credit purchase reversals (refunds + chargebacks)
-- ============================================================================
-- When a credit-pack payment is refunded or disputed, the Stripe webhook
-- calls reverse_credit_purchase() to take the purchased credits back from
-- the buyer. Any refund (even partial) or dispute reverses the whole
-- purchase, once. Idempotent. NOT applied automatically.
-- ============================================================================

-- At most one reversal per purchase: Stripe sends charge.refunded again for
-- each partial refund, and a dispute can follow a refund on the same charge.
create unique index if not exists idx_transactions_purchase_reversal
  on public.transactions(stripe_session_id)
  where type = 'purchase_reversal';


-- ============================================================================
-- RPC: reverse_credit_purchase
-- Logs a 'purchase_reversal' transaction (negative credits and amount, so
-- admin revenue totals net out the refund) and removes the credits from the
-- buyer's balance, floored at 0 — credits already spent are not recovered.
-- The reversal row's stripe_session_id is 'reversal_<purchase session id>'
-- (prefixed, so the webhook's checkout idempotency lookup by session id
-- still finds exactly one row); the partial unique index above is the
-- once-only guard, safe under concurrent events.
-- Returns the credits removed, or NULL if there's no matching purchase
-- (e.g. an unlock payment, or the buyer deleted their account) or it was
-- already reversed.
-- ============================================================================

create or replace function public.reverse_credit_purchase(p_session_id text)
returns int
language plpgsql
security definer
as $$
declare
  v_purchase public.transactions%rowtype;
begin
  select * into v_purchase
    from public.transactions
    where stripe_session_id = p_session_id
      and type = 'credit_purchase'
      and user_id is not null
    limit 1;

  if not found then
    return null;
  end if;

  insert into public.transactions (user_id, stripe_session_id, amount, currency, credits, type)
    values (v_purchase.user_id, 'reversal_' || p_session_id, -coalesce(v_purchase.amount, 0), v_purchase.currency,
            -coalesce(v_purchase.credits, 0), 'purchase_reversal')
    on conflict (stripe_session_id) where type = 'purchase_reversal' do nothing;

  if not found then
    return null;
  end if;

  update public.profiles
    set credits_balance = greatest(coalesce(credits_balance, 0) - coalesce(v_purchase.credits, 0), 0)
    where id = v_purchase.user_id;

  return coalesce(v_purchase.credits, 0);
end;
$$;

revoke execute on function public.reverse_credit_purchase(text) from public, anon, authenticated;
