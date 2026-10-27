import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { REFERRAL_HOLD_DAYS, REFERRAL_REWARD_PERCENT, REFERRAL_WINDOW_MONTHS } from '@/lib/referrals';

// This is your Stripe CLI webhook secret for testing your endpoint locally.
// For production, use the webhook secret from the Stripe Dashboard.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe fields like payment_intent are an id string unless expanded.
function stripeId(ref: string | { id: string } | null | undefined): string | null {
    if (!ref) return null;
    return typeof ref === 'string' ? ref : ref.id;
}

export async function POST(req: Request) {
    const body = await req.text();
    // Await headers() in Next 15+, but for now standard headers access via req works or headers() function.
    // req.headers is standard Web API. next/headers provides readonly access.
    // We use req.headers for signature.
    const signature = req.headers.get('stripe-signature') as string;

    let event;

    try {
        if (!webhookSecret) {
            // In dev without webhook secret, specific verification might be skipped or throw.
            // We assume 'sk_test_mock' logic might apply if we are using mock but here we need real signature verification if calling from real stripe.
            // If we are using valid stripe lib, constructEvent verifies it.
            console.warn("No Webhook Secret found, skipping signature verification (DEV ONLY)");
            // DANGEROUS: logic for dev if needed, else throw.
            // return NextResponse.json({ error: 'No secret' }, { status: 400 });
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed: ${message}`);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Idempotency guard: Stripe can and does redeliver webhook events
        // (timeouts, retries). Both branches below insert a `transactions`
        // row keyed by session.id, so if one already exists for this
        // session, this event has already been processed — skip re-crediting
        // / re-unlocking rather than double-applying it.
        const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

        if (existingTransaction) {
            console.log(`[Webhook] Session ${session.id} already processed, skipping`);
            return NextResponse.json({ received: true });
        }

        if (metadata.userId && metadata.creditAmount) {
            const userId = metadata.userId;
            const creditsToAdd = parseInt(metadata.creditAmount);
            const amount = session.amount_total;
            const currency = session.currency;

            console.log(`[Webhook] Adding ${creditsToAdd} credits to user ${userId}`);

            // 1. Log Transaction
            const { error: txError } = await supabase.from('transactions').insert({
                user_id: userId,
                stripe_session_id: session.id,
                amount: amount,
                currency: currency,
                credits: creditsToAdd,
                type: 'credit_purchase'
            });

            if (txError) {
                console.error('[Webhook] Failed to log transaction:', txError);
            }

            // 2. Increment Credits
            const { error: rpcError } = await supabase.rpc('increment_credits', {
                userid: userId,
                count: creditsToAdd
            });

            if (rpcError) {
                console.error('[Webhook] RPC Failed, falling back to manual update:', rpcError);
                // Fallback: Read-Modify-Write
                const { data: profile } = await supabase.from('profiles').select('credits_balance').eq('id', userId).single();
                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({ credits_balance: (profile.credits_balance || 0) + creditsToAdd })
                        .eq('id', userId);
                }
            } else {
                console.log('[Webhook] Credits added successfully');
            }

            // 3. Referral reward: queued as pending, released by the daily
            // cron after the hold period (the RPC no-ops if unreferred).
            const { data: rewardCredits, error: referralError } = await supabase.rpc('queue_referral_reward', {
                p_referred_id: userId,
                p_session_id: session.id,
                p_payment_intent: stripeId(session.payment_intent),
                p_purchase_credits: creditsToAdd,
                p_purchase_amount: amount,
                p_percent: REFERRAL_REWARD_PERCENT,
                p_hold_days: REFERRAL_HOLD_DAYS,
                p_window_months: REFERRAL_WINDOW_MONTHS
            });

            if (referralError) {
                console.error('[Webhook] Failed to queue referral reward:', referralError);
            } else if (rewardCredits) {
                console.log(`[Webhook] Queued ${rewardCredits} pending referral credits for session ${session.id}`);
            }
        }

        // Handle Direct Analysis Unlock (Legacy / Single Purchase)
        if (metadata.analysisId) {
            console.log(`[Webhook] Unlocking analysis ${metadata.analysisId}`);

            // Log Transaction for Unlock
            const { error: txError } = await supabase.from('transactions').insert({
                stripe_session_id: session.id,
                amount: session.amount_total,
                currency: session.currency,
                type: 'unlock'
                // user_id might be null here if guest, or we can try to find it via metadata if linked later
            });

            if (txError) {
                console.error('[Webhook] Failed to log unlock transaction:', txError);
            }

            await supabase
                .from('analyses')
                .update({ is_unlocked: true })
                .eq('submission_id', metadata.analysisId);
        }
    }

    // Refunds (full or partial) and chargebacks reverse the purchase: the
    // buyer's credits are taken back, and the referral reward for that
    // payment is voided (cancelled if still pending, clawed back if
    // released). Both RPCs are idempotent, so on any failure we return
    // non-2xx and let Stripe retry the whole event.
    if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
        const paymentIntent = stripeId((event.data.object as Stripe.Charge | Stripe.Dispute).payment_intent);

        if (paymentIntent) {
            const { data: affected, error } = await supabase.rpc('void_referral_rewards', {
                p_payment_intent: paymentIntent
            });

            if (error) {
                console.error(`[Webhook] Failed to void referral rewards for ${paymentIntent}:`, error);
                return NextResponse.json({ error: 'Failed to void referral rewards' }, { status: 500 });
            }
            if (affected) {
                console.log(`[Webhook] Voided/reversed ${affected} referral reward(s) for ${paymentIntent} (${event.type})`);
            }

            // Purchases are stored by checkout session id, so look up the
            // session that created this payment.
            let sessionId: string | undefined;
            try {
                const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
                sessionId = sessions.data[0]?.id;
            } catch (err) {
                console.error(`[Webhook] Failed to look up checkout session for ${paymentIntent}:`, err);
                return NextResponse.json({ error: 'Failed to look up checkout session' }, { status: 500 });
            }

            if (sessionId) {
                const { data: creditsRemoved, error: reverseError } = await supabase.rpc('reverse_credit_purchase', {
                    p_session_id: sessionId
                });

                if (reverseError) {
                    console.error(`[Webhook] Failed to reverse credit purchase ${sessionId}:`, reverseError);
                    return NextResponse.json({ error: 'Failed to reverse credit purchase' }, { status: 500 });
                }
                if (creditsRemoved) {
                    console.log(`[Webhook] Removed ${creditsRemoved} purchased credits for session ${sessionId} (${event.type})`);
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
