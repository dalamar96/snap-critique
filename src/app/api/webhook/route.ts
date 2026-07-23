import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// This is your Stripe CLI webhook secret for testing your endpoint locally.
// For production, use the webhook secret from the Stripe Dashboard.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
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

    return NextResponse.json({ received: true });
}
