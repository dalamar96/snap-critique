import type { NextConfig } from "next";

// Content-Security-Policy scoped to what this app actually loads, verified
// by grepping src/ rather than copy-pasting a generic template — and by
// actually loading the app in a headless browser and reading
// `console --errors` (caught two real gaps that grep alone missed: GA4's
// actual beacon endpoints, and a ProductHunt badge image in footer.tsx):
// - Google Analytics (@next/third-parties/google, layout.tsx) needs
//   googletagmanager.com for its script and an inline dataLayer-init
//   script (hence 'unsafe-inline' on script-src — a nonce-based CSP would
//   avoid that but needs nonces wired through proxy.ts + the root layout,
//   a bigger change left as a follow-up). Its collect beacons land on
//   analytics.google.com / stats.g.doubleclick.net / www.google.com, not
//   just google-analytics.com.
// - Supabase Storage signed URLs (images) and the browser Supabase client
//   (auth/rest calls) both hit *.supabase.co.
// - footer.tsx renders a ProductHunt badge image from api.producthunt.com.
// - Stripe is NOT loaded client-side: checkout.ts creates a session
//   server-side and the client just navigates to the returned hosted
//   checkout URL (confirmed — @stripe/stripe-js is an unused dependency),
//   so no stripe.com script-src entry is needed.
// - Fonts are next/font/google, which self-hosts at build time — no
//   runtime request to fonts.googleapis.com.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://api.producthunt.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://stats.g.doubleclick.net https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
