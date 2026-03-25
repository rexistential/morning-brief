import OpenAI from "openai";
import { Story, TopicSection } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_PROMPTS: Record<string, string> = {
  punchy: `Conversational, opinionated, zero filler. Tell people WHY something matters, not just what happened. Use dashes freely. Short punchy lines mixed with longer sentences when context needs it. Asides like "one to watch" or "big deal for X" when warranted. Never say "In a move that" or "This comes as" — just say the thing.`,
  neutral: `Clean and factual but still human. Lead with what matters most. No corporate voice. Concise but don't strip out context that makes stories interesting.`,
  technical: `Dense and specific. Model names, benchmarks, architecture details, funding amounts. Assume the reader is deeply technical. Readable — not a paper abstract.`,
  dense: `Pure facts. Lead with numbers, names, amounts, dates. Strip ALL editorializing - no 'impressive', 'staggering', 'formidable'. No opinion, no 'why it matters' commentary. Each story should read like a wire service brief: who did what, when, how much. Example: 'Anthropic raised $3.5B in Series E at $61.5B post-money valuation, led by Lightspeed Venture Partners. Google invested an additional $1B in March 2025.' That density. Every word earns its place.`,
  trends: `You are extracting PATTERNS, not summarizing stories. Look across all the raw material and identify 3-5 recurring themes, emerging trends, or connected signals. Each theme gets a bold title and a paragraph explaining the pattern with specific evidence from multiple stories. Think lossy compression - what are the meta-narratives? What keeps coming up? Ignore one-off stories that do not connect to anything. Output fewer items but with deeper cross-referencing.`,
};

export async function rewriteBriefing(
  topicSections: TopicSection[],
  tone: string,
): Promise<{ rewrittenSections: TopicSection[]; editorialContent: string }> {
  const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.punchy;

  const rawMaterial = topicSections.map(section => {
    const stories = section.stories.map((s, i) => {
      let line = `- [${i}] Headline: ${s.headline}\n  Summary: ${s.summary}\n  Source: ${s.source_name} (${s.source_url})`;
      if (s.portfolio_company_id) line += `\n  Portfolio Company: ${s.portfolio_company_id}`;
      if (s.is_competitor_news && s.affected_portfolio_company) line += `\n  Competitor news → affects: ${s.affected_portfolio_company}`;
      return line;
    }).join("\n");
    return `## ${section.label}\n${stories}`;
  }).join("\n\n");

  // Build a flat lookup of all stories across sections for SOURCE placeholder resolution
  const allStories: { source_name: string; source_url: string }[] = [];
  for (const section of topicSections) {
    for (const story of section.stories) {
      allStories.push({ source_name: story.source_name, source_url: story.source_url });
    }
  }

  const prompt = `You're writing a daily Portfolio Intelligence briefing for a VC investment team. This briefing monitors Headline VC's portfolio companies AND their competitors.

Here is EXACTLY how each story should read — this is the gold standard:

---
## 📊 PORTFOLIO COMPANY NEWS

**Mistral AI launches Le Chat Enterprise**
Enterprise chat product for European corporates — GPT-4-class performance, data stays in the EU. Pricing undercuts OpenAI by ~30%. BNP Paribas and Siemens are early design partners.
[SOURCE:0]

**Bitwarden hits 100M users**
Up from 50M just 18 months ago. Enterprise revenue now 40% of total — the B2B pivot is working, with Fortune 500 deals landing on the self-hosted deployment angle.
[SOURCE:1]

## ⚔️ COMPETITOR MOVES

**OpenAI drops GPT-5.3 pricing by 40%** → affects: Mistral AI
Across-the-board API price cut. Mistral's "cheaper European alternative" pitch just lost its margin advantage.
[SOURCE:2]

**1Password acquires Kolide** → affects: Bitwarden
Bolts on zero-trust device posture checks — something Bitwarden doesn't have yet. Expect this bundled into 1Password's business tier.
[SOURCE:3]

## 📈 MARKET CONTEXT

**EU AI Act enforcement begins April 1**
First penalties kick in next week. High-risk AI systems need conformity assessments by August. European AI companies have a compliance head start, but the overhead is real.
[SOURCE:4]
---

STUDY THAT FORMAT. The briefing has UP TO SIX sections (include any that have stories, omit empty ones):
1. **📊 PORTFOLIO COMPANY NEWS** — Direct news about Headline's portfolio companies
2. **⚔️ COMPETITOR MOVES** — News about competitors, with "→ affects: [Company]" in the headline showing which portfolio company is impacted
3. **🤖 AI & INFRASTRUCTURE** — AI product launches, model releases, research breakthroughs, dev tools, open source. The big stuff happening in AI/tech.
4. **💰 FUNDRAISING & EXITS** — VC rounds, IPOs, acquisitions, startup funding news
5. **🚀 PRODUCT LAUNCHES** — Notable product launches and feature releases outside of AI
6. **📈 MARKET CONTEXT** — Broader market, regulatory, and sector trends

Each story is:
1. A bold headline (competitor stories include "→ affects: [Portfolio Company]")
2. A SHORT, PUNCHY paragraph — 2-3 sentences MAX. Lead with the key fact, add one line of "so what", done. No padding.
3. A [SOURCE:N] placeholder on its own line after the paragraph, where N is the story index from the raw material
4. Written with personality and opinion — not a sterile summary
5. Specific details (numbers, names, amounts) — but compressed, not sprawling

CRITICAL — SOURCE PLACEHOLDERS:
- EVERY story paragraph MUST end with a [SOURCE:N] placeholder on its own line
- N corresponds to the index number [N] shown next to each story in the raw material
- A story without a source placeholder is INCOMPLETE. Every single story needs one.
- Place the placeholder AFTER the paragraph, on its own line, before the next headline

TONE: ${tonePrompt}

RULES:
- QUALITY OVER QUANTITY. Only include stories where something ACTUALLY HAPPENED. A product launched, a deal closed, funding was raised, an exec was hired, a partnership was announced, a metric was hit. If the source material is just a company description, marketing page, comparison article, or generic "X is a leader in Y" fluff — DROP IT. Do not include it. Do not rewrite garbage into something that sounds like news. Better to have 2 great stories than 5 mediocre ones.
- Every included story gets its own bold headline followed by a tight paragraph — 2-3 sentences, no more
- Lead with the news, follow with the implication. That's it. No meandering.
- For competitor stories, ALWAYS explain what this means for the affected portfolio company
- Add context the reader needs — who are the players, what's the backstory, why should they care
- Use the section structure above. Portfolio News and Competitor Moves come first, then AI & Infrastructure, Fundraising, Product Launches, Market Context. Only include sections that have stories.
- One-sentence summaries are fine if the story is simple. Don't pad for length.
- NEVER use: "In a move that...", "This comes as...", "It's worth noting...", "Interestingly...", "Let's dive in"
- NEVER dress up non-news as news. If a company "continues to innovate" or "is gaining traction" with no specific event, it's NOT a story.
- Don't add stories that aren't in the source material
- Improve clickbait headlines to be informative and punchy
- If a section has no stories, omit it entirely

OUTPUT FORMAT (valid JSON only):
{
  "sections": [
    {
      "topic": "<topic_id: portfolio-news | competitor-intel | ai-ml | fundraising | product-launches | market-moves | regulation>",
      "label": "<section name: PORTFOLIO COMPANY NEWS | COMPETITOR MOVES | AI & INFRASTRUCTURE | FUNDRAISING & EXITS | PRODUCT LAUNCHES | MARKET CONTEXT | POLICY & REGULATION>",
      "body": "<ALL stories for this section. Each story: **Bold Headline**\\n\\nSubstantial paragraph.\\n[SOURCE:N]\\n\\n**Next Headline**\\n\\nNext paragraph.\\n[SOURCE:M]\\n\\nEvery story MUST end with [SOURCE:N] before the next story.>",
      "stories": [
        {
          "headline": "<headline>",
          "source_url": "<ORIGINAL url unchanged>",
          "source_name": "<source name>",
          "topic": "<topic_id>",
          "source_index": <original index N from raw material>
        }
      ]
    }
  ],
  "opener": "<casual one-liner — what's the portfolio vibe today>"
}

The "body" field IS the briefing. Write it like a journalist covering a beat, not a search engine. The "stories" array is just metadata for link tracking.

RAW MATERIAL:
${rawMaterial}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(text);

    const rewrittenSections: TopicSection[] = (parsed.sections || []).map((section: {
      topic: string;
      label: string;
      body?: string;
      stories: { headline: string; source_url: string; source_name: string; topic: string; source_index?: number }[];
    }) => ({
      topic: section.topic,
      label: section.label,
      body: section.body || "",
      stories: section.stories.map(s => ({
        emoji: "",
        headline: s.headline,
        summary: "",
        source_url: s.source_url,
        source_name: s.source_name,
        topic: s.topic,
      })),
    }));

    // Replace [SOURCE:N] placeholders with actual source links
    for (const section of rewrittenSections) {
      if (!section.body) continue;
      section.body = section.body.replace(/\[SOURCE:(\d+)\]/g, (_match, indexStr) => {
        const idx = parseInt(indexStr, 10);
        const story = allStories[idx];
        if (story?.source_url) {
          return `🔗 ${story.source_name || "Source"}: ${story.source_url}`;
        }
        // Fallback: try to find a matching story in the section's own stories array
        const sectionStory = section.stories.find(s => s.source_url);
        if (sectionStory?.source_url) {
          return `🔗 ${sectionStory.source_name || "Source"}: ${sectionStory.source_url}`;
        }
        return "";
      });
    }

    // Build editorial content
    const editorialContent = `${parsed.opener || ""}\n\n${rewrittenSections.map(s => {
      return `## ${s.label}\n\n${s.body || ""}`;
    }).join("\n\n---\n\n")}`;

    return { rewrittenSections, editorialContent };
  } catch (error) {
    console.error("OpenAI rewrite failed:", error);
    const fallbackContent = topicSections.map(s =>
      `## ${s.label}\n\n${s.stories.map(st =>
        `**${st.headline}**\n${st.summary}\n🔗 ${st.source_name}: ${st.source_url}`
      ).join("\n\n")}`
    ).join("\n\n---\n\n");

    return { rewrittenSections: topicSections, editorialContent: fallbackContent };
  }
}
