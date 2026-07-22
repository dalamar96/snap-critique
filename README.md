# Snap Critique 📸

**Snap Critique** is an AI-powered photography mentoring platform that provides instant, detailed, and objective feedback on your photos. It acts as a world-class photography instructor, analyzing your images for composition, lighting, and technical execution — and has grown into a broader learning + community platform built around that core critique engine.

## 🚀 Features

### Core Experience

- **AI Analysis**: Uses Google Gemini to analyze images across multiple dimensions:
  - **Composition / Technique / Creativity scores**: objective 0-100 ratings.
  - **Technical Assessment**: analysis of exposure, focus, noise, and lighting consistency.
  - **Strengths**: what works well in the image.
  - **Improvements**: priority-ranked suggestions (High/Medium/Low).
  - **Action Plan**: tailored drills and next steps.
  - **Content signals**: NSFW and AI-generated-image likelihood scores, surfaced in the gallery.
- **EXIF Data Extraction**: automatically extracts camera settings (camera, lens, ISO, aperture, shutter, metering, flash, etc.) to give context to the critique.
- **Smart Upload**: drag-and-drop wizard (category/goals/context → upload) with instant previews and validation.
- **Guest flow with claiming**: unauthenticated users get one free analysis; on signup/login, that guest submission is claimed and linked to the new account via a signed cookie.

### Platform Features

- **Credit System**: new users get 5 free credits; one-time credit packs (Starter/Pro/Power) available via Stripe (no subscriptions); credits deducted per analysis.
- **Paywall**: locked analyses have sensitive fields (improvements, next steps, technical assessment, goal feedback) stripped server-side before the response reaches the client — not just hidden in the UI.
- **Dashboard**: search/filter your submissions, soft delete, and toggle analyses between private and public.
- **Learning Module**: hierarchical lessons (modules → sub-lessons) with theory sections and optional photo homework scored against lesson goals, XP/points, and bonus XP for completing a full module.
- **Comments**: threaded comments on analyses, with optional pin coordinates to annotate a specific point on the photo.
- **Community & Gallery**: a public gallery of public analyses and a directory of public photographer profiles.
- **Profiles**: bio, business name, website, camera brands, and photography-type tags.
- **Support Chat**: in-app messaging between users and admins.
- **Admin Panel**: user management + credit adjustments, global submissions view, soft-delete/restore/hard-delete with storage cleanup, orphaned-file scanner, error log viewer, lesson CRUD, taxonomy (camera brands / photography types) tree editor, system-prompt editor, support inbox.
- **SEO**: sitemap, robots.txt, JSON-LD Review structured data, OG images via signed URLs.
- **Google Analytics**: GA4 visitor tracking.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Language**: TypeScript, React 19
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage). No ORM — raw Supabase JS query builder; schema is hand-written SQL, see [`supabase/schema.sql`](supabase/schema.sql).
- **AI Model**: [Google Gemini](https://deepmind.google/technologies/gemini/) via `@google/generative-ai`
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix primitives), Framer Motion
- **Payments**: Stripe — one-time credit-pack checkout, webhook-driven fulfillment
- **Analytics**: Google Analytics 4

## 📂 Project Structure

```bash
src/
  app/
    page.tsx                 landing page
    wizard/                  upload flow (category/goals/context → upload)
    analysis/[id]/            critique results page (paywall/lock logic) + actions.ts
    dashboard/                user's submission history
    admin/                    admin panel (users, lessons, taxonomy, support inbox, error logs)
    learning/[slug]/          lessons + homework
    gallery/, community/      public showcase + photographer directory
    profile/[id], profile/edit
    api/analyze, api/checkout, api/webhook, api/log   route handlers
    auth/actions.ts, auth/callback/route.ts           login/signup/OAuth-magic-link callback + guest-claim flow
    login, forgot-password, update-password
    pricing, about, support, privacy, terms
  components/                critique-display, upload-zone, wizard, chat-interface, comments/*, lessons/*, ui/* (shadcn)
  lib/
    gemini.ts, stripe.ts, logger.ts, storage.ts, image.ts
    supabase/{client,server,admin,middleware}.ts
  config/lesson-registry.tsx  maps lesson slugs to custom rich lesson page components
  types/                      comments.ts, wizard.ts
supabase/                     schema.sql (source of truth) + historical seed/migration fragments
```

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google AI Studio key (Gemini)
- Stripe account

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
# NOTE: the app currently reads two different site-URL env vars in
# different places (SEO/metadata code uses NEXT_PUBLIC_SITE_URL; the auth
# redirect flow uses NEXT_PUBLIC_BASE_URL, falling back to Vercel's
# NEXT_PUBLIC_VERCEL_URL). Set both to the same value until this is
# consolidated onto a single variable.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Google AI
GEMINI_API_KEY=your-gemini-key

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Database Setup

Schema changes are now tracked as real Supabase CLI migrations under [`supabase/migrations/`](supabase/migrations/), not ad-hoc dashboard edits. [`supabase/schema.sql`](supabase/schema.sql) is a flattened, human-readable snapshot of what those migrations produce — handy for a quick read, but not what actually gets applied.

**Fresh project** (no existing tables):

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This runs every migration in order, starting with `20260721000000_baseline.sql`.

**Existing/live project** (tables already exist, e.g. this repo's own production database): running the baseline migration as-is will fail on `create table` for tables that already exist. Baseline the migration history instead of re-running it, then apply only what comes after:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase migration repair --status applied 20260721000000
npx supabase db push   # applies 20260721000001_credit_fixes.sql onward
```

Going forward: any schema change should be a new file under `supabase/migrations/<timestamp>_<name>.sql`, applied with `supabase db push` — never a direct dashboard edit. Update `supabase/schema.sql`'s snapshot to match when you do.

See the header comments in `supabase/migrations/20260721000000_baseline.sql` and `supabase/schema.sql` for caveats — several tables/columns predate this workflow and were reconstructed from application code rather than a captured `information_schema` dump, so verify against the live project if in doubt. `supabase/migrations/_archive/` holds old ad-hoc `inspect_*.sql` debugging scripts that were committed instead of real migrations — kept for history, not meant to be run.

You'll also need to create a private `submissions` storage bucket (see the bottom of `schema.sql` for the exact path conventions the app expects).

### Installation

1. Install dependencies:

```bash
npm install
```

1. Run the development server:

```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000)

### Stripe Webhooks

See [`.agent/workflows/setup-stripe-webhooks.md`](.agent/workflows/setup-stripe-webhooks.md) for local and production webhook setup.

## 🔒 Security

- **Row Level Security (RLS)**: database access is scoped to the authenticated user; admin/server operations use a service-role client after an explicit `is_admin` check.
- **Server Actions**: mutations happen server-side with validation; the paywall strips sensitive critique fields server-side rather than hiding them client-side.
- **Signed URLs**: all storage access (images, avatars) is via short-lived (1hr) signed URLs — the bucket is private, there are no public image URLs.

## 🧪 Testing

There is currently no automated test suite (no Jest/Vitest/Playwright config, no CI). Quality assurance is manual. The guest-claim/login-linking flow and credit-deduction logic are the most fragile, money-adjacent code paths and would benefit most from test coverage first.

## 📌 Known Gaps

See [`CODEBASE_REPORT.md`](CODEBASE_REPORT.md) for a fuller audit, but in short:

- `system_prompts` admin editor exists but isn't actually read by `api/analyze/route.ts` (prompt is hardcoded).
- The guest-claim/login-linking flow has had several recent bug-fix commits and still has debug logging left in `analysis/[id]/page.tsx`.
- No centralized admin-auth guard — `is_admin` is checked inline in ~20 separate server actions.

---

Built with ❤️ for photographers.
