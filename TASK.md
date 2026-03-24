# TASK: Portfolio Intelligence — Morning Brief v2

## Overview
Transform the Morning Brief app from a general AI/tech news digest into a **Portfolio Intelligence Platform** for Headline VC. The app should monitor news about Headline's portfolio companies AND their competitors, surfacing actionable insights to the investment team daily.

## What Exists
- Next.js app deployed on Vercel (working, live)
- Supabase backend (auth, profiles, briefings, daily_news_pool)
- News fetching pipeline: RSS feeds + Brave web search → daily_news_pool → per-user briefing generation → email delivery
- OpenAI rewriting (gpt-4o-mini) for tone/editorial
- User profiles with topic preferences, send time, timezone
- Click tracking, archives, admin panel

## What to Build

### 1. Portfolio Company Registry (`lib/portfolio.ts`)
Create a new module with Headline's portfolio companies. Each company needs:
```ts
interface PortfolioCompany {
  id: string;           // slug: "mistral-ai"
  name: string;         // "Mistral AI"
  sector: string;       // "Infrastructure" | "Software" | "Fintech" | "Consumer"
  status: "active" | "exited" | "public";
  region: string;       // "Europe" | "US" | "Brazil" | "Asia"
  searchTerms: string[];  // ["Mistral AI", "Mistral", "mistral.ai"]
  competitors: string[];  // ["OpenAI", "Anthropic", "Cohere", "Meta AI"]
  website?: string;
}
```

Populate with these known portfolio companies (from headline.com/portfolio):
- Mistral AI (Infrastructure) — competitors: OpenAI, Anthropic, Cohere, Meta AI, Google DeepMind
- Bitwarden (Software) — competitors: 1Password, LastPass, Dashlane, NordPass
- Creditas (Fintech, Brazil) — competitors: Nubank, PicPay, Inter
- Raisin (Fintech, Europe) — competitors: Deposit Solutions, WeltSparen, SaveBetter
- Gopuff (Consumer) — competitors: DoorDash, Instacart, Gorillas, Getir
- SEMrush (Software, public SEMR) — competitors: Ahrefs, Moz, SpyFu, Similarweb
- Fetch (Consumer) — competitors: Ibotta, Shopkick, Checkout51
- Nivoda (Software) — competitors: VDB, RapNet, Polygon.io (diamonds)
- Honeycomb (Infrastructure) — competitors: Datadog, New Relic, Splunk, Grafana
- Staffbase (Software) — competitors: Workvivo, Simpplr, Firstup
- Brite Payments (Fintech) — competitors: Trustly, Klarna, Stripe
- Natural Cycles (Consumer) — competitors: Flo, Clue, Ovia
- Housecall Pro (Software) — competitors: ServiceTitan, Jobber, Housecall Pro
- Bumble (Consumer, public BMBL) — competitors: Tinder/Match, Hinge, Grindr
- Acorns (Fintech) — competitors: Robinhood, Stash, Betterment, Wealthfront
- Finom (Fintech) — competitors: Qonto, Penta, Holvi
- Heidi Health (Software) — competitors: Nuance/DAX, Ambience, Abridge
- Owner (Software) — competitors: Toast, Square, ChowNow
- Sorare (Consumer) — competitors: DraftKings, FanDuel, Dapper Labs
- Buk (Software, LatAm) — competitors: Gusto, Deel, Factorial
- Olist (Consumer, Brazil) — competitors: Mercado Libre, VTEX, Nuvemshop
- Plancraft (Software) — competitors: Procore, Buildertrend, CoConstruct
- Podimo (Consumer) — competitors: Spotify, Apple Podcasts, Audible
- Air (Software) — competitors: Brandfolder, Bynder, Frontify
- Motion (Software) — competitors: Asana, Monday.com, Notion Calendar
- Farfetch (Consumer, public FTCH) — competitors: Net-a-Porter, SSENSE, Mytheresa
- Sonos (Consumer, public SONO) — competitors: Bose, Apple HomePod, Amazon Echo
- The RealReal (Consumer, public REAL) — competitors: Vestiaire Collective, Poshmark, ThredUp
- Pismo (Fintech, acquired by Visa) — competitors: Marqeta, Galileo, i2c
- Segment (Software, acquired by Twilio) — competitors: mParticle, Rudderstack, Amplitude
- Black Forest Labs (Infrastructure) — competitors: Stability AI, Midjourney, DALL-E
- DeepIP (Software) — competitors: PatSnap, Anaqua, CPA Global
- Procure AI (Software) — competitors: Coupa, Jaggaer, SAP Ariba
- Thread (Software) — competitors: (TBD based on what Thread does)
- Grüns (Consumer) — competitors: AG1, Huel, Ka'Chava

### 2. Update Topics/Constants (`lib/constants.ts`)
Replace the current topic categories with portfolio-relevant ones:
```ts
export const TOPICS = [
  { id: "portfolio-news", label: "Portfolio Company News", emoji: "📊" },
  { id: "competitor-intel", label: "Competitor Intelligence", emoji: "⚔️" },
  { id: "market-moves", label: "Market & Sector Moves", emoji: "📈" },
  { id: "fundraising", label: "Fundraising & Exits", emoji: "💰" },
  { id: "product-launches", label: "Product Launches", emoji: "🚀" },
  { id: "ai-ml", label: "AI & Infrastructure", emoji: "🤖" },
  { id: "regulation", label: "Policy & Regulation", emoji: "⚖️" },
] as const;
```

### 3. Update News Fetcher (`lib/news-fetcher.ts`)
Modify `fetchRealNews` to:
- Search for each portfolio company name via Brave search (query: `"Company Name" news`)
- Search for competitors of each portfolio company
- Categorize results: portfolio-news vs competitor-intel vs market-moves
- Keep RSS feeds for general market coverage (HN, TechCrunch, etc.)
- Add search queries like: `"Mistral AI" OR "mistral.ai" funding OR launch OR partnership`

The fetcher should:
1. Loop through all portfolio companies, search for each
2. Loop through competitors of companies that had news (if Mistral has news, also check what OpenAI/Anthropic are doing)
3. Tag each story with the portfolio company it relates to
4. Fall back to general market news to fill gaps

### 4. Update Briefing Writer (`lib/briefing-writer.ts`)
Modify the rewrite prompt to:
- Group stories by: Portfolio News → Competitor Moves → Market Context
- For competitor stories, explicitly mention which portfolio company is affected and why
- Add a "So What?" angle — what does this mean for the portfolio company?
- Keep the punchy editorial tone

Example output format:
```
## 📊 PORTFOLIO COMPANY NEWS

**Mistral AI launches Le Chat Enterprise**
Mistral rolled out its enterprise chat product targeting European corporates worried about data sovereignty...

**Bitwarden hits 100M users**
The open-source password manager crossed 100M registered users...

## ⚔️ COMPETITOR MOVES

**OpenAI drops GPT-5.3 pricing by 40%** → affects: Mistral AI
OpenAI slashed API pricing... This puts pressure on Mistral's enterprise pricing...

**1Password acquires Kolide** → affects: Bitwarden
1Password picked up device trust startup Kolide... Bitwarden's enterprise play may need to respond...

## 📈 MARKET CONTEXT

**EU AI Act enforcement begins April 1**
First wave of EU AI Act penalties...
```

### 5. Update Database Schema
Add a new table or extend daily_news_pool:
```sql
-- Add columns to daily_news_pool (or create portfolio_news_pool)
ALTER TABLE daily_news_pool ADD COLUMN portfolio_company_id TEXT;
ALTER TABLE daily_news_pool ADD COLUMN is_competitor_news BOOLEAN DEFAULT false;
ALTER TABLE daily_news_pool ADD COLUMN affected_portfolio_company TEXT;
```

### 6. Update UI
- Dashboard should show portfolio companies being monitored
- Briefing view should visually separate portfolio news vs competitor intel
- Add a "Portfolio" section to preferences where users can select which companies they care about (default: all)

### 7. Keep Backward Compatibility
- Keep the general news topics available as an option (users can opt into "General AI/Tech" alongside portfolio monitoring)
- Don't break the existing email delivery pipeline
- Keep click tracking working

## Technical Notes
- Brave Search API is already integrated via `lib/news-fetcher.ts`
- Supabase project: urjchvlehiamzivaknqq
- Vercel auto-deploys on git push to main
- OpenAI API (gpt-4o-mini) handles rewriting
- CRON_SECRET protects cron endpoints

## Priority
1. Portfolio company registry + search (core data)
2. News fetcher updates (search for portfolio + competitors)
3. Briefing writer updates (new format with competitor analysis)
4. Database schema updates
5. UI updates (nice to have for v1, can be basic)

## Out of Scope for v1
- Real-time alerts (daily digest is fine)
- Sentiment analysis
- App store / Glassdoor monitoring
- Integration with DeepDive
