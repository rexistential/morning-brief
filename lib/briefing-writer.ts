import OpenAI from "openai";
import { Story, TopicSection } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_PROMPTS: Record<string, string> = {
  punchy: `You write like a sharp friend who works in tech and actually reads everything. Conversational, opinionated, zero filler. You tell people WHY something matters to them, not just what happened. Use dashes freely. Short punchy lines mixed with the occasional longer sentence when context needs it. Drop in asides like "one to watch" or "big deal for X" when warranted. Never say "In a move that" or "This comes as" — just say the thing.`,
  neutral: `Clean and factual but still human. Lead with what matters most. No corporate voice — write like a smart journalist who respects the reader's time. Be concise but don't strip out the context that makes stories interesting.`,
  technical: `Dense and specific. Model names, benchmarks, architecture details, funding amounts, metrics. Assume the reader is deeply technical. Still readable — not a paper abstract. More Hacker News comment than press release.`,
};

export async function rewriteBriefing(
  topicSections: TopicSection[],
  tone: string,
): Promise<{ rewrittenSections: TopicSection[]; editorialContent: string }> {
  const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.punchy;

  // Build the raw material for the LLM
  const rawMaterial = topicSections.map(section => {
    const stories = section.stories.map(s =>
      `- Headline: ${s.headline}\n  Summary: ${s.summary}\n  Source: ${s.source_name} (${s.source_url})`
    ).join("\n");
    return `## ${section.label}\n${stories}`;
  }).join("\n\n");

  const prompt = `You're writing a daily AI/tech news briefing that reads like a sharp newsletter — not a news aggregator. Think Morning Brew meets a smart group chat. Here's an example of the EXACT style and format to match:

---
*GENERAL AI NEWS*

📌 *OpenAI drops GPT-5.4 with native computer use*
Two days after GPT-5.3 Instant, OpenAI shipped GPT-5.4 in two flavours — Thinking (for Plus+ users) and Pro ($200/mo). The headline features: 47% fewer tokens on some tasks, native computer-use mode (mouse/keyboard control via screenshots), and new financial plugins. It beat human performance on the OSWorld desktop navigation benchmark (75% vs 72.4%).

📌 *MIT researchers crack LLM memory bottleneck*
A new technique called "Attention Matching" compacts the KV cache by up to 50x with minimal accuracy loss. Big deal for enterprise use cases like long-document analysis and autonomous coding agents where memory costs cap everything.

*VC & FINANCE CORNER*

💰 *GPT-5.4's Excel/Sheets plugins — one to watch*
OpenAI's new financial integrations let GPT-5.4 work directly inside spreadsheet cells for granular analysis. Following similar moves from Anthropic's Claude for Finance, this is becoming a real battleground for enterprise finance workflows.
---

${tonePrompt}

RULES:
- Each section gets a bold header with an emoji theme (use * for bold in the label)
- Each story starts with a marker emoji (📌 for general news, 💰 for finance/VC, 🐦 for Twitter/X finds, 🔧 for tools, etc.)
- Headlines are bold (wrapped in *)
- The writeup flows naturally after the headline — 2-3 sentences that tell the reader WHY it matters
- Make it feel like one continuous read, not isolated cards
- Improve clickbait headlines but keep them informative
- Don't add stories that aren't in the source material
- NEVER use: "In a move that...", "This comes as...", "It's worth noting...", "Interestingly..."
- Keep it tight — every sentence earns its place

OUTPUT FORMAT (respond with valid JSON only, no markdown):
{
  "sections": [
    {
      "topic": "<topic_id>",
      "label": "<section_label — short and punchy, e.g. 'AI NEWS' not 'AI Threats and Developments'>",
      "body": "<the full editorial writeup for this section as flowing paragraphs. Weave ALL stories in this section into connected prose. Bold key names/products with **double asterisks**. Reference sources inline like (Source Name). Each story should transition naturally into the next — use connective phrases, contrasts, or thematic links. Aim for 2-4 paragraphs per section. Include source URLs as markdown links: [Source Name](url).>",
      "stories": [
        {
          "headline": "<headline>",
          "source_url": "<original url — DO NOT CHANGE>",
          "source_name": "<original source name>",
          "topic": "<topic_id>"
        }
      ]
    }
  ],
  "opener": "<one casual line setting the vibe — like texting a friend what's in the news today>"
}

CRITICAL: The "body" field is the main content. Write it as flowing editorial paragraphs that weave all the section's stories together naturally. NOT a list of disconnected items. The "stories" array is just for metadata/link tracking — the real reading experience is the body text.

RAW MATERIAL:
${rawMaterial}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(text);

    // Reconstruct sections with body text and story metadata
    const rewrittenSections: TopicSection[] = (parsed.sections || []).map((section: {
      topic: string;
      label: string;
      body?: string;
      stories: { headline: string; source_url: string; source_name: string; topic: string }[];
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

    // Build editorial content string
    const editorialContent = `${parsed.opener || ""}\n\n${rewrittenSections.map(s =>
      `## ${s.label}\n\n${(s as TopicSection & { body?: string }).body || ""}`
    ).join("\n\n---\n\n")}`;

    return {
      rewrittenSections,
      editorialContent,
    };
  } catch (error) {
    console.error("OpenAI rewrite failed:", error);
    // Fall back to raw content
    const fallbackContent = topicSections.map(s =>
      `## ${s.stories[0]?.emoji || "📰"} ${s.label}\n\n${s.stories.map(st =>
        `**${st.headline}**\n${st.summary}\n[${st.source_name}](${st.source_url})`
      ).join("\n\n")}`
    ).join("\n\n---\n\n");

    return {
      rewrittenSections: topicSections,
      editorialContent: fallbackContent,
    };
  }
}
