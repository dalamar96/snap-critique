import Stripe from 'stripe';

// Use mock key for build/dev if not set. Runtime operations will fail gracefully or require real key.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_12345', {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
});
