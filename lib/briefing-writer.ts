import OpenAI from "openai";
import { Story, TopicSection } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_PROMPTS: Record<string, string> = {
  punchy: `Write in a punchy, editorial style. Be direct and opinionated. Use short sentences that hit hard. Add context that makes the reader smarter — don't just restate headlines. Think newsletter writer, not news wire. Inject personality without being cheesy.`,
  neutral: `Write in a clean, factual style. Lead with the most important information. Be concise but thorough. No opinion, no editorializing — just smart, well-organized reporting that respects the reader's time.`,
  technical: `Write with technical depth. Include specifics — model names, benchmarks, architecture details, funding amounts. Assume the reader is technical and doesn't need hand-holding. Be precise and information-dense.`,
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

  const prompt = `You are writing a personalized daily news briefing. Your job is to take raw search results and rewrite them into a flowing, readable briefing that someone actually wants to read with their morning coffee.

${tonePrompt}

RULES:
- Rewrite each story with a compelling 1-2 sentence writeup that tells the reader WHY this matters, not just WHAT happened
- Keep the original headline but improve it if it's clickbaity or vague
- Group stories naturally under their topic sections
- Each story should feel like a mini-insight, not a regurgitated snippet
- Don't add stories that aren't in the source material
- Don't use phrases like "In a move that..." or "This comes as..." — just say the thing
- No bullet points within stories — flowing prose
- Keep each story writeup to 2-3 sentences max

OUTPUT FORMAT (respond with valid JSON only, no markdown):
{
  "sections": [
    {
      "topic": "<topic_id>",
      "label": "<section_label>",
      "stories": [
        {
          "headline": "<improved or original headline>",
          "summary": "<your rewritten 2-3 sentence writeup>",
          "source_url": "<original url — DO NOT CHANGE>",
          "source_name": "<original source name>",
          "emoji": "<original emoji>",
          "topic": "<topic_id>"
        }
      ]
    }
  ],
  "opener": "<one punchy sentence to open the briefing — what's the vibe today?>"
}

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

    // Reconstruct TopicSections with rewritten content, preserving original URLs
    const rewrittenSections: TopicSection[] = (parsed.sections || []).map((section: {
      topic: string;
      label: string;
      stories: Story[];
    }) => ({
      topic: section.topic,
      label: section.label,
      stories: section.stories.map((s: Story) => ({
        emoji: s.emoji,
        headline: s.headline,
        summary: s.summary,
        source_url: s.source_url,
        source_name: s.source_name,
        topic: s.topic,
      })),
    }));

    // Flatten stories for the top-level array
    const allStories = rewrittenSections.flatMap(s => s.stories);

    // Build editorial content string
    const editorialContent = `${parsed.opener || ""}\n\n${rewrittenSections.map(s =>
      `## ${s.stories[0]?.emoji || "📰"} ${s.label}\n\n${s.stories.map((st: Story) =>
        `**${st.headline}**\n${st.summary}\n[${st.source_name}](${st.source_url})`
      ).join("\n\n")}`
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
