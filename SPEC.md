# Morning Brief — Personalized AI News Portal

## Overview
A web portal where users sign up, set their preferences (topics, briefing length, send time), and receive a personalized AI-generated news briefing via email and web. Think "personalized morning newsletter as a service."

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth)
- **Email:** Resend (npm package `resend`)
- **Auth:** Supabase Auth with magic link (email-based, passwordless)
- **Deployment:** Vercel-ready

## Features

### 1. Landing Page
- Clean marketing-style landing with:
  - Headline: "Your AI briefing, your way"
  - Brief description of what it does
  - "Get Started" CTA → sign up / sign in
  - Sample briefing preview (static example)

### 2. Auth
- Magic link auth via Supabase (enter email, click link to sign in)
- After first sign-in, redirect to onboarding wizard
- Returning users go straight to dashboard

### 3. Onboarding Wizard (first-time setup)
Step-by-step flow:
- **Step 1 — Pick your beats:** Multi-select from topic categories:
  - AI & Machine Learning
  - Foundation Models (OpenAI, Anthropic, Google, Meta, etc.)
  - VC & Startups
  - Markets & Finance
  - Developer Tools & Infrastructure
  - Policy & Regulation
  - Hardware & Chips
  - Open Source
  - Robotics & Physical AI
  - Crypto & Web3
- **Step 2 — Briefing style:**
  - Length: Quick (3-5 stories), Standard (6-8 stories), Deep Dive (10-12 stories)
  - Tone: Punchy & editorial / Neutral & factual / Technical & detailed
- **Step 3 — Delivery:**
  - Send time (dropdown: 6:00 AM through 10:00 AM in 30-min increments)
  - Timezone (auto-detect, with override dropdown)
  - Email address (pre-filled from auth, editable)
- Save preferences → redirect to dashboard

### 4. Dashboard
- **Today's Briefing** — rendered in a clean reading view (the main content area)
  - If briefing hasn't been generated yet today, show "Your briefing is being prepared" or yesterday's
  - Each story: emoji icon, bold headline, 1-3 sentence summary
  - Stories grouped by section (based on user's topic preferences)
  - Links to source articles
- **Sidebar:**
  - Navigation: Today / Archive / Preferences
  - Quick stats: "Member since", "Briefings received"

### 5. Archive
- List of past briefings by date
- Click to read any past briefing
- Simple chronological list with date headers

### 6. Preferences Page
- Edit all onboarding settings (topics, length, tone, send time, timezone, email)
- Toggle email delivery on/off (can still read on web)
- Delete account option

### 7. Admin View (for Rob)
- Route: /admin (protected — only specific email addresses)
- User list with: email, topics, send time, last briefing date, total briefings
- Ability to trigger a briefing generation for any user
- Send stats overview

## Database Schema

### Table: profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  briefing_length TEXT NOT NULL DEFAULT 'standard' CHECK (briefing_length IN ('quick', 'standard', 'deep')),
  briefing_tone TEXT NOT NULL DEFAULT 'punchy' CHECK (briefing_tone IN ('punchy', 'neutral', 'technical')),
  send_time TEXT NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: briefings
```sql
CREATE TABLE briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  stories JSONB NOT NULL DEFAULT '[]',
  topic_sections JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'web', NULL)),
  briefing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: story_clicks (for future personalization)
```sql
CREATE TABLE story_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  briefing_id UUID REFERENCES briefings(id) ON DELETE CASCADE NOT NULL,
  story_url TEXT NOT NULL,
  story_title TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
- profiles: users can read/update their own profile
- briefings: users can read their own briefings
- story_clicks: users can read/insert their own clicks
- Admin override: users with is_admin=true can read all profiles and briefings

### Trigger
- Auto-create a profile row when a new user signs up (using a Supabase trigger on auth.users)
- updated_at trigger on profiles

## API Routes (Next.js Route Handlers)

### POST /api/briefing/generate
- Protected endpoint (requires auth or API key for cron)
- Accepts: { userId } or generates for all users whose send_time matches
- Pipeline:
  1. Fetch user preferences
  2. Gather news sources (this is a PLACEHOLDER — just generate sample content for now)
  3. Filter/rank by user topics
  4. Call LLM to generate briefing in user's preferred tone/length
  5. Save to briefings table
  6. Send email if email_enabled
- For the MVP, this endpoint should generate a REALISTIC SAMPLE briefing based on the user's topic preferences. Use realistic-looking but clearly sample content. The actual news fetching + LLM pipeline will be wired up later.

### POST /api/briefing/send-email
- Takes a briefing ID, renders it as HTML email, sends via Resend
- Track sent_at

### GET /api/briefing/today
- Returns today's briefing for the authenticated user

### GET /api/briefings
- Returns paginated list of user's briefings (for archive)

### POST /api/clicks/track
- Track a story click (briefing_id, story_url, story_title)

## Email Template
- Clean HTML email matching the web reading view
- Header: "Morning Brief — [Date]"
- Sections by topic with emoji icons
- Each story: bold headline, summary, source link
- Footer: "Manage preferences" link back to portal
- Responsive (works on mobile email clients)

## UI Design
- Clean, modern, reading-focused
- Light mode default (dark mode support)
- Card-based story display
- Generous whitespace — this is a reading experience
- Color accents by topic section
- Mobile responsive
- Use shadcn/ui: Card, Button, Input, Select, Badge, Tabs, Switch, Progress (for onboarding)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ADMIN_EMAILS=rob@headline.com,robtweddle9@gmail.com
```

## File Structure
```
/app
  /layout.tsx              — root layout with auth provider
  /page.tsx                — landing page
  /auth/callback/route.ts  — Supabase auth callback
  /dashboard
    /page.tsx              — today's briefing view
    /archive/page.tsx      — past briefings
    /preferences/page.tsx  — edit preferences
  /onboarding/page.tsx     — first-time wizard
  /admin/page.tsx          — admin dashboard
  /api
    /briefing/generate/route.ts
    /briefing/send-email/route.ts
    /briefing/today/route.ts
    /briefings/route.ts
    /clicks/track/route.ts
/components
  /auth/                   — auth components
  /briefing/               — briefing display, story cards
  /onboarding/             — wizard steps
  /dashboard/              — layout, sidebar, nav
  /admin/                  — admin components
  /email/                  — email template (React Email)
  /ui/                     — shadcn components
/lib
  /supabase.ts             — client + server Supabase helpers
  /types.ts                — TypeScript types
  /utils.ts                — formatters, helpers
  /constants.ts            — topics list, tone options, etc.
/supabase
  /migrations/
    /001_initial.sql       — full schema + RLS + triggers
```

## Important Notes
- Supabase project: https://kshtjsdoiyzywduibrhh.supabase.co (SAME project as PropMatch — reuse it)
- Anon key: sb_publishable_84-_us5PAWbSBdKUIL-OqA_rPu0bOKc
- The briefing generation is a PLACEHOLDER for now — generate realistic sample content based on user topics. Don't try to actually fetch news or call an LLM. Just create sample briefings that look real.
- Resend API key not available yet — mock the email sending (log it, mark as sent)
- Make sure `npm run build` passes
- Commit everything when done
- Include a proper README
