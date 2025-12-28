import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

const PACKAGES: any = {
    'starter': { name: 'Starter Pack', credits: 5, price: 499 },
    'pro': { name: 'Pro Pack', credits: 20, price: 1499 },
    'power': { name: 'Power Pack', credits: 50, price: 2999 },
}

export async function POST(req: NextRequest) {
    try {
        const { analysisId, packageId } = await req.json();
        const origin = req.headers.get('origin') || 'https://www.snapcritique.com';

        // Auth Check (Required for credits)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (packageId) {
            if (!user) {
                return NextResponse.json({ error: 'Login required for credits' }, { status: 401 });
            }

            const pkg = PACKAGES[packageId]
            if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

            const session = await stripe.checkout.sessions.create({
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Snap Critique - ${pkg.name}`,
                            description: `${pkg.credits} AI Analysis Credits`
                        },
                        unit_amount: pkg.price,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${origin}/dashboard?credits_added=true`,
                cancel_url: `${origin}/pricing?canceled=true`,
                metadata: {
                    userId: user.id,
                    creditAmount: pkg.credits,
                    packageId: packageId
                }
            });
            return NextResponse.json({ url: session.url });
            return NextResponse.json({ url: session.url });
        }

        return NextResponse.json({ error: 'Package ID required' }, { status: 400 });

    } catch (err: any) {
        console.error('Stripe Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
