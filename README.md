# Snap Critique 📸

**Snap Critique** is an AI-powered photography mentoring platform that provides instant, detailed, and objective feedback on your photos. It acts as a world-class photography instructor, analyzing your images for composition, lighting, and technical execution to help you improve faster.

## 🚀 Features

### core Experience
- **AI Analysis**: Uses Google Gemini Pro Vision to analyze images across 4 dimensions:
  - **Composition Score**: An objective 0-100 rating based on artistic principles.
  - **Technical Assessment**: Analysis of exposure, focus, noise, and lighting consistency.
  - **Strengths**: Highlights what works well in the image.
  - **Improvements**: Priority-ranked suggestions for what to fix (High/Medium/Low).
  - **Action Plan**: Tailored drills and homework to practice.
- **EXIF Data Extraction**: Automatically extracts and displays camera settings (Camera, Lens, ISO, Aperture, Shutter, Metering, Flash, etc.) to give context to the critique.
- **Smart Upload**: Drag-and-drop interface with instant previews and validation.

### Platform Features
- **Credit System**: 
  - New users get 5 free credits.
  - One-time credit packs available via Stripe (no subscriptions).
  - Credits are deducted only for successful analyses.
- **Dashboard**: Central hub to manage all previous critiques.
  - **Search & Filter**: Find analyses by status or privacy.
  - **Soft Delete**: Remove analyses from view without permanent data loss (recoverable by admins).
  - **Privacy Control**: Toggle analyses between Private (owner only) and Public.
- **Sharing**: Generate public links to share critiques with friends or on social media.
- **Admin Panel**:
    - User management table.
    - Global view of all submissions.
    - Status monitoring (Deleted/Public/Private).
- **Google Analytics**: Integrated visitor tracking.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Language**: TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
- **AI Model**: [Google Gemini Pro Vision](https://deepmind.google/technologies/gemini/)
- **Styling**: Tailwind CSS + Shadcn/UI (Radix Primitives)
- **Payments**: Stripe (Webhooks for credit fulfillment)
- **Analytics**: Google Analytics 4

## 📂 Project Structure

```bash
/src
├── app
│   ├── admin           # Admin dashboard & users table
│   ├── analysis        # Dynamic analysis pages & server actions
│   ├── api             # API Routes (Analyze, Stripe Webhooks)
│   ├── dashboard       # User dashboard
│   ├── (auth)          # Login/Signup pages
│   └── layout.tsx      # Root layout (Fonts, GA, Header)
├── components          # Reusable UI components
│   ├── critique-display.tsx # Main analysis visualization
│   ├── upload-zone.tsx      # Drag & drop uploader
│   └── ...
├── lib
│   ├── gemini.ts       # AI Model configuration
│   ├── supabase        # Database clients (Admin/Client)
│   └── utils.ts        # CN & formatting helpers
└── types               # TypeScript interfaces
```

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Google AI Studio Key (Gemini)
- Stripe Account

### Environment Variables
Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI
GEMINI_API_KEY=your_gemini_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## 🔒 Security

- **Row Level Security (RLS)**: All database access is scoped to the authenticated user.
- **Server Actions**: All mutations happen server-side with strict validation.
- **Signed URLs**: Private images are accessed via short-lived signed URLs.

---
Built with ❤️ for photographers.
