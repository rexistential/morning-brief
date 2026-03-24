# Morning Brief Improvements — Task

Read the existing code in this project first, then implement ALL 5 changes below.

## 1. Fix cross-topic dedup (QUICK FIX)
In `lib/news-fetcher.ts`, the dedup currently works within each topic but stories can appear across different topics. Add a global `seenUrls` and `seenHeadlines` set that persists across ALL topic iterations in `fetchRealNews()`. Before adding any story to a topic section, check it against the global sets using the existing `normalizeUrl()` and `headlinesSimilar()` functions.

## 2. Add source links to editorial email output (QUICK FIX)
In `lib/email.ts`, the `sectionToHtml()` function has two paths:
- When `section.body` exists (editorial rewrite from LLM): renders body HTML but does NOT include source links
- When individual stories are rendered: includes source links

Fix: After the body HTML when section.body exists, append a sources list using section.stories:

```html
<div style="margin-top:12px;padding-top:8px;border-top:1px solid #f3f4f6;">
  story.source_name links separated by " · "
</div>
```

## 3. Add "dense" tone option
Add a new briefing tone called "dense" — facts-only, no editorializing.

a) `lib/constants.ts` — Add to BRIEFING_TONES: `{ id: "dense", label: "Dense & facts-only" }`
b) `lib/types.ts` — Update briefing_tone type union to include "dense"
c) `lib/briefing-writer.ts` — Add TONE_PROMPTS entry:
   dense: Pure facts. Lead with numbers, names, amounts, dates. Strip ALL editorializing — no "impressive", "staggering", "formidable". No opinion, no "why it matters" commentary. Each story reads like a wire service brief: who did what, when, how much. Example: "Anthropic raised $3.5B in Series E at $61.5B post-money valuation, led by Lightspeed Venture Partners. Google invested an additional $1B in March 2025." Every word earns its place.
d) Check `app/onboarding/page.tsx` and `app/dashboard/preferences/page.tsx` — ensure tone options come from constants
e) Create migration `supabase/migrations/002_add_new_tones.sql`

## 4. Add "trends" tone option
Add another tone called "trends" — lossy compression across stories to extract recurring themes.

a) Add to constants: `{ id: "trends", label: "Trends & patterns" }`
b) Add to types union
c) In briefing-writer.ts, add TONE_PROMPTS entry:
   trends: You are extracting PATTERNS, not summarizing stories. Look across all the raw material and identify 3-5 recurring themes, emerging trends, or connected signals. Each theme gets a bold title and a paragraph explaining the pattern with specific evidence from multiple stories. Think "lossy compression" — what are the meta-narratives? What keeps coming up? Ignore one-off stories that do not connect to anything. Output fewer items but with deeper cross-referencing.

## 5. DB Migration
Create `supabase/migrations/002_add_new_tones.sql`:
```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_briefing_tone_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_briefing_tone_check CHECK (briefing_tone IN ('punchy', 'neutral', 'technical', 'dense', 'trends'));
```

## 6. Build & Commit
Run `npm run build` and fix any TypeScript errors.
Commit with message: "feat: add dense & trends tones, fix cross-topic dedup, add source links to emails"

When completely finished, run:
openclaw system event --text "Done: Morning Brief improvements complete" --mode now
