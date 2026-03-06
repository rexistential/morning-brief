# Morning Brief

Personalized AI-generated news briefing portal. Users sign up, set their preferences (topics, briefing length, tone, send time), and receive a personalized briefing via web and email.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth)
- **Email:** Resend (mocked for now)
- **Auth:** Supabase Auth with magic link

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase and Resend credentials
npm run dev
```

## Database Setup

Run the migration in `supabase/migrations/001_initial.sql` against your Supabase project.

## Features

- Landing page with sign-up
- Magic link authentication
- Onboarding wizard (topics, style, delivery preferences)
- Dashboard with today's briefing
- Archive of past briefings
- Preferences management
- Admin dashboard
- API routes for briefing generation, email sending, click tracking
- Sample/mock briefing generation based on user topic preferences

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ADMIN_EMAILS=rob@headline.com,robtweddle9@gmail.com
```
