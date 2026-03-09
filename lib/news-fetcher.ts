import { Story, TopicSection } from "./types";
import { getTopicById, getStoryCountForLength } from "./constants";

const TOPIC_SEARCH_QUERIES: Record<string, string[]> = {
  "ai-ml": ["artificial intelligence news today", "machine learning breakthrough"],
  "foundation-models": ["OpenAI Anthropic Google AI model news", "LLM foundation model update"],
  "vc-startups": ["AI startup funding round", "venture capital AI investment"],
  "markets-finance": ["stock market AI technology news", "finance technology news today"],
  "dev-tools": ["developer tools AI coding news", "software development tools update"],
  "policy-regulation": ["AI regulation policy government", "AI safety policy news"],
  "hardware-chips": ["AI chip GPU semiconductor news", "NVIDIA AMD AI hardware"],
  "open-source": ["open source AI model release", "open source machine learning news"],
  "robotics": ["robotics AI automation news", "humanoid robot news"],
  "crypto-web3": ["cryptocurrency Bitcoin news today", "crypto blockchain AI news"],
};

const TOPIC_EMOJIS: Record<string, string> = {
  "ai-ml": "🤖",
  "foundation-models": "🧠",
  "vc-startups": "🚀",
  "markets-finance": "📈",
  "dev-tools": "🛠️",
  "policy-regulation": "⚖️",
  "hardware-chips": "💾",
  "open-source": "📖",
  "robotics": "🦾",
  "crypto-web3": "🪙",
};

interface BraveResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

async function searchBrave(query: string, count: number = 5): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("BRAVE_SEARCH_API_KEY not set");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(count),
      freshness: "pd", // past day
      text_decorations: "false",
    });

    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!res.ok) {
      console.error("Brave search failed:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.web?.results || []).map((r: { title: string; url: string; description: string; age?: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age,
    }));
  } catch (err) {
    console.error("Brave search error:", err);
    return [];
  }
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const nameMap: Record<string, string> = {
      "techcrunch.com": "TechCrunch",
      "theverge.com": "The Verge",
      "arstechnica.com": "Ars Technica",
      "wired.com": "Wired",
      "bloomberg.com": "Bloomberg",
      "reuters.com": "Reuters",
      "nytimes.com": "NY Times",
      "theinformation.com": "The Information",
      "cnbc.com": "CNBC",
      "ft.com": "Financial Times",
      "wsj.com": "WSJ",
      "nature.com": "Nature",
      "arxiv.org": "arXiv",
      "venturebeat.com": "VentureBeat",
      "pitchbook.com": "PitchBook",
      "coindesk.com": "CoinDesk",
      "theblock.co": "The Block",
      "github.blog": "GitHub Blog",
      "openai.com": "OpenAI",
      "anthropic.com": "Anthropic",
      "blog.google": "Google Blog",
      "ai.meta.com": "Meta AI",
      "huggingface.co": "Hugging Face",
    };
    return nameMap[hostname] || hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch {
    return "Source";
  }
}

export async function fetchRealNews(
  topics: string[],
  length: string,
): Promise<{ stories: Story[]; topicSections: TopicSection[] }> {
  const storyCount = getStoryCountForLength(length);
  const storiesPerTopic = Math.max(2, Math.ceil(storyCount / topics.length));

  const topicSections: TopicSection[] = [];
  const allStories: Story[] = [];

  for (const topicId of topics) {
    const topicInfo = getTopicById(topicId);
    if (!topicInfo) continue;

    const queries = TOPIC_SEARCH_QUERIES[topicId] || [`${topicInfo.label} news today`];
    const emoji = TOPIC_EMOJIS[topicId] || "📰";

    // Search with the first query, fall back to second if needed
    let results = await searchBrave(queries[0], storiesPerTopic + 2);
    if (results.length < 2 && queries[1]) {
      const moreResults = await searchBrave(queries[1], storiesPerTopic);
      results = [...results, ...moreResults];
    }

    // Deduplicate by domain
    const seen = new Set<string>();
    const unique = results.filter(r => {
      try {
        const domain = new URL(r.url).hostname;
        if (seen.has(domain)) return false;
        seen.add(domain);
        return true;
      } catch {
        return true;
      }
    });

    const topicStories: Story[] = unique.slice(0, storiesPerTopic).map(r => ({
      emoji,
      headline: r.title,
      summary: r.description,
      source_url: r.url,
      source_name: extractSourceName(r.url),
      topic: topicId,
    }));

    if (topicStories.length > 0) {
      topicSections.push({
        topic: topicId,
        label: topicInfo.label,
        stories: topicStories,
      });
      allStories.push(...topicStories);
    }
  }

  // Trim to target story count
  const trimmed = allStories.slice(0, storyCount);
  const trimmedSections = topicSections.map(s => ({
    ...s,
    stories: s.stories.filter(st => trimmed.includes(st)),
  })).filter(s => s.stories.length > 0);

  return { stories: trimmed, topicSections: trimmedSections };
}
