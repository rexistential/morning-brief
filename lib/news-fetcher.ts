import { Story, TopicSection } from "./types";
import { getTopicById, getStoryCountForLength } from "./constants";
import Parser from "rss-parser";

const rssParser = new Parser({ timeout: 10000 });

// RSS feeds mapped to topics. Each feed can be relevant to multiple topics.
const RSS_FEEDS: Array<{ name: string; url: string; topics: string[] }> = [
  { name: "Pragmatic Engineer", url: "https://feeds.feedburner.com/ThePragmaticEngineer", topics: ["dev-tools"] },
  { name: "Martin Fowler", url: "https://martinfowler.com/feed.atom", topics: ["dev-tools"] },
  { name: "InfoQ", url: "https://feed.infoq.com/", topics: ["dev-tools", "ai-ml"] },
  { name: "Hacker News", url: "https://hnrss.org/frontpage?count=15", topics: ["ai-ml", "dev-tools", "open-source"] },
  { name: "arXiv CS.AI", url: "https://rss.arxiv.org/rss/cs.AI", topics: ["ai-ml", "foundation-models"] },
  { name: "GitHub Blog", url: "https://github.blog/engineering/feed/", topics: ["dev-tools", "open-source"] },
  { name: "Netflix Tech Blog", url: "https://netflixtechblog.medium.com/feed", topics: ["dev-tools"] },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", topics: ["foundation-models", "ai-ml"] },
  { name: "Stripe Blog", url: "https://stripe.com/blog/feed.rss", topics: ["dev-tools", "ai-finance"] },
  { name: "The New Stack", url: "https://thenewstack.io/feed/", topics: ["dev-tools", "open-source"] },
  { name: "Changelog", url: "https://changelog.com/feed", topics: ["dev-tools", "open-source"] },
  { name: "CSS-Tricks", url: "https://css-tricks.com/feed/", topics: ["dev-tools"] },
  { name: "Hacker Noon", url: "https://hackernoon.com/feed", topics: ["ai-ml", "dev-tools", "vc-startups"] },
];

interface RssStory {
  title: string;
  url: string;
  summary: string;
  sourceName: string;
  publishedAt: Date | null;
}

async function fetchRssFeeds(topicId: string): Promise<RssStory[]> {
  const relevantFeeds = RSS_FEEDS.filter(f => f.topics.includes(topicId));
  const stories: RssStory[] = [];
  const oneDayAgo = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h window for RSS

  for (const feed of relevantFeeds) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 5)) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        // Only include recent items
        if (pubDate && pubDate < oneDayAgo) continue;

        const summary = (item.contentSnippet || item.content || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 300)
          .trim();

        if (item.title && item.link) {
          stories.push({
            title: item.title,
            url: item.link,
            summary: summary || item.title,
            sourceName: feed.name,
            publishedAt: pubDate,
          });
        }
      }
    } catch (err) {
      console.error(`[RSS] Failed to fetch ${feed.name}:`, err);
    }
  }

  return stories;
}

// Each topic gets web queries + Twitter/X-specific queries
const TOPIC_SEARCH_QUERIES: Record<string, { web: string[]; twitter: string[] }> = {
  "ai-ml": {
    web: ["artificial intelligence news today", "machine learning breakthrough"],
    twitter: ["AI breakthrough site:x.com OR site:twitter.com"],
  },
  "foundation-models": {
    web: ["OpenAI Anthropic Google AI model news", "LLM foundation model update"],
    twitter: ["GPT Claude Gemini new model site:x.com OR site:twitter.com"],
  },
  "ai-finance": {
    web: [
      "AI financial modeling Excel tools",
      "AI finance spreadsheet automation product launch",
      "AI CFO accounting tools fintech",
    ],
    twitter: [
      "AI Excel financial modeling site:x.com OR site:twitter.com",
      "AI finance tools spreadsheet site:x.com OR site:twitter.com",
      "fintech AI product launch site:x.com OR site:twitter.com",
    ],
  },
  "vc-startups": {
    web: ["AI startup funding round", "venture capital AI investment"],
    twitter: ["AI startup raised funding site:x.com OR site:twitter.com"],
  },
  "markets-finance": {
    web: ["stock market AI technology news", "finance technology news today"],
    twitter: ["AI stocks market fintech site:x.com OR site:twitter.com"],
  },
  "dev-tools": {
    web: ["developer tools AI coding news", "software development tools update"],
    twitter: ["AI coding tool developer site:x.com OR site:twitter.com"],
  },
  "policy-regulation": {
    web: ["AI regulation policy government", "AI safety policy news"],
    twitter: ["AI regulation policy site:x.com OR site:twitter.com"],
  },
  "hardware-chips": {
    web: ["AI chip GPU semiconductor news", "NVIDIA AMD AI hardware"],
    twitter: ["NVIDIA AMD AI chip site:x.com OR site:twitter.com"],
  },
  "open-source": {
    web: ["open source AI model release", "open source machine learning news"],
    twitter: ["open source AI model release site:x.com OR site:twitter.com"],
  },
  "robotics": {
    web: ["robotics AI automation news", "humanoid robot news"],
    twitter: ["robotics AI humanoid site:x.com OR site:twitter.com"],
  },
  "crypto-web3": {
    web: ["cryptocurrency Bitcoin news today", "crypto blockchain AI news"],
    twitter: ["crypto AI blockchain site:x.com OR site:twitter.com"],
  },
};

const TOPIC_EMOJIS: Record<string, string> = {
  "ai-ml": "🤖",
  "foundation-models": "🧠",
  "ai-finance": "💹",
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

async function searchBrave(query: string, count: number = 5, freshness: string = "pd"): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("BRAVE_SEARCH_API_KEY not set");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(count),
      freshness,
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
      "x.com": "X (Twitter)",
      "twitter.com": "X (Twitter)",
    };
    return nameMap[hostname] || hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch {
    return "Source";
  }
}

// Normalize URL for dedup comparison (strip tracking params, trailing slashes, etc.)
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.href.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Normalize headline for fuzzy dedup (lowercase, strip punctuation)
function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if two headlines are similar enough to be the same story
function headlinesSimilar(a: string, b: string): boolean {
  const na = normalizeHeadline(a);
  const nb = normalizeHeadline(b);
  if (na === nb) return true;

  // Check if one contains most of the other (>70% word overlap)
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 3 && overlap / minSize > 0.7;
}

export async function fetchRealNews(
  topics: string[],
  length: string,
  previousStories: Story[] = [],
): Promise<{ stories: Story[]; topicSections: TopicSection[] }> {
  const storyCount = getStoryCountForLength(length);
  const storiesPerTopic = Math.max(2, Math.ceil(storyCount / topics.length));

  // Build dedup sets from previous briefings
  const previousUrls = new Set(previousStories.map(s => normalizeUrl(s.source_url)));
  const previousHeadlines = previousStories.map(s => s.headline);

  const isDuplicate = (url: string, headline: string): boolean => {
    if (previousUrls.has(normalizeUrl(url))) return true;
    return previousHeadlines.some(prev => headlinesSimilar(prev, headline));
  };

  const topicSections: TopicSection[] = [];
  const allStories: Story[] = [];

  // Global dedup sets across all topics
  const globalSeenUrls = new Set<string>();
  const globalSeenHeadlines: string[] = [];

  for (const topicId of topics) {
    const topicInfo = getTopicById(topicId);
    if (!topicInfo) continue;

    const queryConfig = TOPIC_SEARCH_QUERIES[topicId] || {
      web: [`${topicInfo.label} news today`],
      twitter: [],
    };
    const emoji = TOPIC_EMOJIS[topicId] || "📰";

    // Fetch RSS feeds for this topic (in parallel with web search)
    const [rssStories, ...braveResults] = await Promise.all([
      fetchRssFeeds(topicId),
      ...queryConfig.web.slice(0, 2).map(q => searchBrave(q, storiesPerTopic + 3)),
    ]);

    let results: BraveResult[] = braveResults.flat();

    // Fetch Twitter/X results
    let twitterResults: BraveResult[] = [];
    for (const query of queryConfig.twitter) {
      const batch = await searchBrave(query, 3, "pw");
      twitterResults.push(...batch);
      if (twitterResults.length >= 2) break;
    }

    // Convert RSS stories to the same shape
    const rssAsBrave = rssStories.map(r => ({
      title: r.title,
      url: r.url,
      description: r.summary,
      isTwitter: false,
      isRss: true,
      sourceName: r.sourceName,
    }));

    // Combine: RSS first (higher signal), then web, then twitter
    const combined = [
      ...rssAsBrave,
      ...results.map(r => ({ ...r, isTwitter: false, isRss: false, sourceName: "" })),
      ...twitterResults.map(r => ({ ...r, isTwitter: true, isRss: false, sourceName: "" })),
    ];

    // Deduplicate by URL and domain
    const seen = new Set<string>();
    const unique = combined.filter(r => {
      try {
        const normalUrl = normalizeUrl(r.url);
        if (seen.has(normalUrl)) return false;
        const domain = new URL(r.url).hostname;
        const key = r.isTwitter ? r.url : domain;
        if (seen.has(key)) return false;
        seen.add(key);
        seen.add(normalUrl);
        return true;
      } catch {
        return true;
      }
    });

    // Filter out duplicates from previous days and cross-topic duplicates
    const fresh = unique.filter(r => {
      if (isDuplicate(r.url, r.title)) return false;
      const normUrl = normalizeUrl(r.url);
      if (globalSeenUrls.has(normUrl)) return false;
      if (globalSeenHeadlines.some(prev => headlinesSimilar(prev, r.title))) return false;
      return true;
    });

    const topicStories: Story[] = fresh.slice(0, storiesPerTopic).map(r => ({
      emoji: r.isTwitter ? "🐦" : emoji,
      headline: r.title,
      summary: r.description,
      source_url: r.url,
      source_name: r.isRss && r.sourceName ? r.sourceName : extractSourceName(r.url),
      topic: topicId,
    }));

    // Add to global dedup sets
    for (const s of topicStories) {
      globalSeenUrls.add(normalizeUrl(s.source_url));
      globalSeenHeadlines.push(s.headline);
    }

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
