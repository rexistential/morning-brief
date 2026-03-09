import OpenAI from "openai";
import { Story, TopicSection } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_PROMPTS: Record<string, string> = {
  punchy: `Conversational, opinionated, zero filler. Tell people WHY something matters, not just what happened. Use dashes freely. Short punchy lines mixed with longer sentences when context needs it. Asides like "one to watch" or "big deal for X" when warranted. Never say "In a move that" or "This comes as" — just say the thing.`,
  neutral: `Clean and factual but still human. Lead with what matters most. No corporate voice. Concise but don't strip out context that makes stories interesting.`,
  technical: `Dense and specific. Model names, benchmarks, architecture details, funding amounts. Assume the reader is deeply technical. Readable — not a paper abstract.`,
};

export async function rewriteBriefing(
  topicSections: TopicSection[],
  tone: string,
): Promise<{ rewrittenSections: TopicSection[]; editorialContent: string }> {
  const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.punchy;

  const rawMaterial = topicSections.map(section => {
    const stories = section.stories.map(s =>
      `- Headline: ${s.headline}\n  Summary: ${s.summary}\n  Source: ${s.source_name} (${s.source_url})`
    ).join("\n");
    return `## ${section.label}\n${stories}`;
  }).join("\n\n");

  const prompt = `You're writing a daily news briefing. Here is EXACTLY how each story should read — this is the gold standard:

---
**Pentagon officially designates Anthropic a "supply chain risk"**
Defense Secretary Pete Hegseth followed through on threats, formally blacklisting Anthropic from DoD contracts. Defense contractors are already pivoting away from Claude "out of an abundance of caution." Anthropic CEO Dario Amodei fired back in a blistering internal memo, saying the dispute stems from the company refusing to "donate to Trump" or offer "dictator-style praise." Politico reports lobbyists and ex-officials say Trump is "wrecking his own AI agenda" with the spat.

**OpenAI drops GPT-5.3 Instant**
The new default ChatGPT model focuses on tone and conversational flow — fewer unnecessary refusals, less preachy preambles, and 27% fewer hallucinations when using web search. OpenAI says it addresses the "cringe" factor of 5.2 Instant, which had a habit of saying things like "Stop. Take a breath." Small model, big vibes upgrade.

**Defense contractors scrambling = opportunity for alternatives**
With Anthropic effectively locked out of defense contracts, there's a vacuum forming. Defense-tech startups and alternative AI providers (Palantir's AIP, Scale AI, Mistral for non-US contracts) could benefit. If you're tracking deal flow in defense-adjacent AI, this is a catalyst moment — expect pitches from startups positioning as "Pentagon-safe" AI providers.
---

STUDY THAT FORMAT. Each story is:
1. A bold headline
2. A SUBSTANTIAL paragraph (3-5 sentences) explaining what happened, why it matters, and what the implications are
3. Written with personality and opinion — not a sterile summary
4. Packed with specific details, names, numbers, quotes when available

TONE: ${tonePrompt}

RULES:
- Every story gets its own bold headline followed by a meaty paragraph — NOT a one-liner summary
- Each paragraph should be 3-5 sentences minimum. Dig into the WHY and SO WHAT
- Add context the reader needs — who are the players, what's the backstory, why should they care
- Group stories under section headers
- NEVER write thin one-sentence summaries. That's the opposite of what we want
- NEVER use: "In a move that...", "This comes as...", "It's worth noting...", "Interestingly...", "Let's dive in"
- Don't add stories that aren't in the source material
- Improve clickbait headlines to be informative and punchy

OUTPUT FORMAT (valid JSON only):
{
  "sections": [
    {
      "topic": "<topic_id>",
      "label": "<short section name e.g. GENERAL AI NEWS, VC & FINANCE CORNER, AI TOOLS>",
      "body": "<ALL stories for this section, written EXACTLY in the format above. Each story: **Bold Headline**\\n\\nSubstantial paragraph of 3-5 sentences.\\n\\n**Next Headline**\\n\\nNext paragraph. Use \\n\\n between stories. Do NOT include source links in the body text — just write the editorial content.>",
      "stories": [
        {
          "headline": "<headline>",
          "source_url": "<ORIGINAL url unchanged>",
          "source_name": "<source name>",
          "topic": "<topic_id>"
        }
      ]
    }
  ],
  "opener": "<casual one-liner — what's the vibe today>"
}

The "body" field IS the briefing. Write it like a journalist, not a search engine. The "stories" array is just metadata for link tracking.

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

    const editorialContent = `${parsed.opener || ""}\n\n${rewrittenSections.map(s =>
      `## ${s.label}\n\n${s.body || ""}`
    ).join("\n\n---\n\n")}`;

    return { rewrittenSections, editorialContent };
  } catch (error) {
    console.error("OpenAI rewrite failed:", error);
    const fallbackContent = topicSections.map(s =>
      `## ${s.label}\n\n${s.stories.map(st =>
        `**${st.headline}**\n${st.summary}`
      ).join("\n\n")}`
    ).join("\n\n---\n\n");

    return { rewrittenSections: topicSections, editorialContent: fallbackContent };
  }
}
