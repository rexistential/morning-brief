import { Story, TopicSection } from "./types";
import { getTopicById, getStoryCountForLength } from "./constants";
import {
  PORTFOLIO_COMPANIES,
  matchPortfolioCompanies,
  matchCompetitors,
} from "./portfolio";
import type { PortfolioCompany } from "./portfolio";
import Parser from "rss-parser";

const rssParser = new Parser({ timeout: 10000 });

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

// RSS feeds for general market/tech coverage
const RSS_FEEDS: Array<{ name: string; url: string; topics: string[] }> = [
  { name: "Hacker News", url: "https://hnrss.org/frontpage?count=15", topics: ["ai-ml", "product-launches", "market-moves"] },
  { name: "InfoQ", url: "https://feed.infoq.com/", topics: ["ai-ml", "product-launches"] },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", topics: ["ai-ml", "competitor-intel"] },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/rss.xml", topics: ["ai-ml", "competitor-intel"] },
  { name: "Microsoft AI Blog", url: "https://blogs.microsoft.com/ai/feed/", topics: ["ai-ml", "competitor-intel"] },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", topics: ["ai-ml", "competitor-intel"] },
  { name: "Perplexity Blog", url: "https://www.perplexity.ai/hub/blog/rss.xml", topics: ["ai-ml"] },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", topics: ["fundraising", "product-launches", "market-moves"] },
  { name: "The New Stack", url: "https://thenewstack.io/feed/", topics: ["ai-ml", "product-launches"] },
  { name: "GitHub Blog", url: "https://github.blog/engineering/feed/", topics: ["ai-ml", "product-launches"] },
  { name: "Stripe Blog", url: "https://stripe.com/blog/feed.rss", topics: ["market-moves"] },
  { name: "Hacker Noon", url: "https://hackernoon.com/feed", topics: ["ai-ml", "fundraising"] },
];

interface RssStory {
  title: string;
  url: string;
  summary: string;
  sourceName: string;
  publishedAt: Date | null;
}

async function fetchRssFeeds(topicId: string): Promise<RssStory[]> {
  const relevantFeeds = RSS_FEEDS.filter((f) => f.topics.includes(topicId));
  const stories: RssStory[] = [];
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  for (const feed of relevantFeeds) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 5)) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        if (pubDate && pubDate < twoDaysAgo) continue;

        const summary = (item.contentSnippet || item.content || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 300)
          .trim();

        const cleanSummary = summary
          .replace(/^arXiv:\S+\s+Announce Type:\s*\w+\s*Abstract:\s*/i, "")
          .trim();

        const cleanTitle =
          item.title?.replace(/^arXiv:\S+\s+/, "") || item.title;

        if (cleanTitle && item.link) {
          stories.push({
            title: decodeHtmlEntities(cleanTitle),
            url: item.link,
            summary: decodeHtmlEntities(cleanSummary || cleanTitle),
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

// Market-level search queries for general coverage
const MARKET_SEARCH_QUERIES: Record<string, { web: string[]; twitter: string[] }> = {
  "ai-ml": {
    web: [
      "artificial intelligence news today",
      "AI infrastructure startup news",
    ],
    twitter: ["AI breakthrough OR product launch site:x.com OR site:twitter.com"],
  },
  "fundraising": {
    web: [
      "startup funding round today",
      "venture capital investment AI fintech",
    ],
    twitter: ["startup raised funding series site:x.com OR site:twitter.com"],
  },
  "market-moves": {
    web: [
      "fintech market news today",
      "SaaS market moves acquisitions",
    ],
    twitter: ["fintech SaaS acquisition IPO site:x.com OR site:twitter.com"],
  },
  "product-launches": {
    web: [
      "tech product launch today",
      "startup product launch new feature",
    ],
    twitter: ["product launch startup site:x.com OR site:twitter.com"],
  },
  "regulation": {
    web: [
      "AI regulation policy government",
      "EU AI Act fintech regulation",
    ],
    twitter: ["AI regulation policy site:x.com OR site:twitter.com"],
  },
};

interface BraveResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

// Filter out junk results — download pages, how-to-buy crypto, generic resource pages, etc.
const JUNK_URL_PATTERNS = [
  /how-to-buy/i,
  /\/downloads?\//i,
  /\/download\b/i,
  /bitget\.com/i,
  /coinmarketcap\.com\/currencies/i,
  /\/resource-center/i,
  /\/resources\/?$/i,
  /tracxn\.com\/d\/companies/i,
  /crunchbase\.com\/organization/i,
  /\/pricing\/?$/i,
  /\/careers?\/?$/i,
  /\/about\/?$/i,
  /\/contact\/?$/i,
  /wikipedia\.org/i,
  /glassdoor\./i,
  /indeed\.com/i,
  /linkedin\.com\/company/i,
  /\.techspot\.com\/downloads/i,
  /zoominfo\.com/i,
  /youtube\.com\/watch/i,
  /\/faq\b/i,
  /casino/i,
  /nightrush/i,
  /gambling/i,
  /betting\.com/i,
  /g2\.com\/products/i,
  /capterra\.com/i,
  /trustpilot\.com/i,
  /softwareadvice\.com/i,
];

const JUNK_TITLE_PATTERNS = [
  /how to buy/i,
  /download free/i,
  /company profile.*funding.*competitors/i,
  /alternative \d{4}/i,
  /best .* alternative/i,
  /review \d{4}/i,
  /^.{0,5}$/,  // too short
  /complete.*comparison/i,
  /top \d+.*(casino|software|tools|platforms) (for|in) \d{4}/i,
  /pricing.*alternatives.*comparisons/i,
  /overview.*news.*similar companies/i,
  /vs\.?\s/i,  // "X vs Y" comparison articles
];

function isJunkResult(url: string, title: string): boolean {
  return JUNK_URL_PATTERNS.some((p) => p.test(url)) ||
    JUNK_TITLE_PATTERNS.some((p) => p.test(title));
}

async function searchBrave(
  query: string,
  count: number = 5,
  freshness: string = "pd"
): Promise<BraveResult[]> {
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

    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      }
    );

    if (!res.ok) {
      console.error("Brave search failed:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.web?.results || []).map(
      (r: {
        title: string;
        url: string;
        description: string;
        age?: string;
      }) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        age: r.age,
      })
    );
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
    return (
      nameMap[hostname] ||
      hostname.split(".")[0].charAt(0).toUpperCase() +
        hostname.split(".")[0].slice(1)
    );
  } catch {
    return "Source";
  }
}

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

function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headlinesSimilar(a: string, b: string): boolean {
  const na = normalizeHeadline(a);
  const nb = normalizeHeadline(b);
  if (na === nb) return true;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.split(" ").length >= 5 && longer.startsWith(shorter)) return true;

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 3 && overlap / minSize > 0.7;
}

// ──────────────────────────────────────────────
// Portfolio-aware story tagging
// ──────────────────────────────────────────────

interface TaggedStory extends Story {
  portfolio_company_id?: string;
  is_competitor_news?: boolean;
  affected_portfolio_company?: string;
}

function tagStory(
  headline: string,
  summary: string,
  baseStory: Omit<Story, "portfolio_company_id" | "is_competitor_news" | "affected_portfolio_company">
): TaggedStory {
  const text = `${headline} ${summary}`;

  // Check portfolio company matches first
  const portfolioMatches = matchPortfolioCompanies(text);
  if (portfolioMatches.length > 0) {
    return {
      ...baseStory,
      topic: "portfolio-news",
      portfolio_company_id: portfolioMatches[0].id,
      is_competitor_news: false,
    };
  }

  // Check competitor matches
  const competitorMatches = matchCompetitors(text);
  if (competitorMatches.length > 0) {
    return {
      ...baseStory,
      topic: "competitor-intel",
      is_competitor_news: true,
      affected_portfolio_company: competitorMatches[0].affectedCompany.name,
      portfolio_company_id: competitorMatches[0].affectedCompany.id,
    };
  }

  // No portfolio/competitor match — keep original topic
  return { ...baseStory };
}

// ──────────────────────────────────────────────
// Main fetch function
// ──────────────────────────────────────────────

export async function fetchRealNews(
  topics: string[],
  length: string,
  previousStories: Story[] = []
): Promise<{ stories: Story[]; topicSections: TopicSection[] }> {
  const storyCount = getStoryCountForLength(length);

  // Build dedup sets from previous briefings
  const previousUrls = new Set(
    previousStories.map((s) => normalizeUrl(s.source_url))
  );
  const previousHeadlines = previousStories.map((s) => s.headline);

  const isDuplicate = (url: string, headline: string): boolean => {
    if (previousUrls.has(normalizeUrl(url))) return true;
    return previousHeadlines.some((prev) => headlinesSimilar(prev, headline));
  };

  const globalSeenUrls = new Set<string>();
  const globalSeenHeadlines: string[] = [];
  const allTaggedStories: TaggedStory[] = [];

  const isGlobalDuplicate = (url: string, headline: string): boolean => {
    const normUrl = normalizeUrl(url);
    if (globalSeenUrls.has(normUrl)) return true;
    if (globalSeenHeadlines.some((prev) => headlinesSimilar(prev, headline)))
      return true;
    return false;
  };

  const addToGlobalDedup = (story: TaggedStory) => {
    globalSeenUrls.add(normalizeUrl(story.source_url));
    globalSeenHeadlines.push(story.headline);
  };

  // ── Phase 1: Search for each portfolio company ──
  console.log(
    `[news-fetcher] Searching ${PORTFOLIO_COMPANIES.length} portfolio companies...`
  );

  // Batch portfolio company searches — use "pw" (past week) for better coverage
  // Group companies into combined searches to reduce API calls
  // e.g. search 3-4 companies per query using OR
  const companiesWithNews = new Set<string>();

  // Strategy: combine 3 companies per Brave search to stay under rate limits
  const companyChunks: PortfolioCompany[][] = [];
  for (let i = 0; i < PORTFOLIO_COMPANIES.length; i += 3) {
    companyChunks.push(PORTFOLIO_COMPANIES.slice(i, i + 3));
  }

  // Run in serial batches of 3 queries to avoid rate limits
  for (let batchIdx = 0; batchIdx < companyChunks.length; batchIdx += 3) {
    const batchOfChunks = companyChunks.slice(batchIdx, batchIdx + 3);
    
    const batchResults = await Promise.all(
      batchOfChunks.map(async (chunk) => {
        // Combine company names into one OR query
        const queryParts = chunk.map((c) => `"${c.name}"`);
        const query = queryParts.join(" OR ");
        const results = await searchBrave(query, 6, "pw");
        return { chunk, results };
      })
    );

    for (const { chunk, results } of batchResults) {
      for (const r of results) {
        const headline = decodeHtmlEntities(r.title);
        const summary = decodeHtmlEntities(r.description);
        const fullText = `${headline} ${summary}`.toLowerCase();

        if (isJunkResult(r.url, headline)) continue;
        if (isDuplicate(r.url, headline)) continue;
        if (isGlobalDuplicate(r.url, headline)) continue;

        // Figure out which company this result is about
        const matchedCompany = chunk.find((c) =>
          c.searchTerms.some((term) => fullText.includes(term.toLowerCase()))
        );
        if (!matchedCompany) continue;

        const story: TaggedStory = {
          emoji: "📊",
          headline,
          summary,
          source_url: r.url,
          source_name: extractSourceName(r.url),
          topic: "portfolio-news",
          portfolio_company_id: matchedCompany.id,
          is_competitor_news: false,
        };

        addToGlobalDedup(story);
        allTaggedStories.push(story);
        companiesWithNews.add(matchedCompany.id);
      }
    }

    // Small delay between batches to avoid rate limits
    if (batchIdx + 3 < companyChunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(
    `[news-fetcher] Found news for ${companiesWithNews.size} portfolio companies`
  );

  // ── Phase 2: Search competitors of companies that had news ──
  const competitorSearches: Array<{
    competitor: string;
    affectedCompany: PortfolioCompany;
  }> = [];

  for (const companyId of companiesWithNews) {
    const company = PORTFOLIO_COMPANIES.find((c) => c.id === companyId);
    if (!company) continue;
    for (const competitor of company.competitors.slice(0, 3)) {
      competitorSearches.push({ competitor, affectedCompany: company });
    }
  }

  // Only search competitors of companies that had news (keep it focused)
  // Plus a small set of "always watch" competitors for the biggest portfolio companies
  const alwaysWatchCompanies = PORTFOLIO_COMPANIES
    .filter((c) => ["mistral-ai", "bitwarden", "bumble", "gopuff", "semrush", "creditas", "honeycomb"].includes(c.id))
    .flatMap((c) =>
      c.competitors.slice(0, 1).map((comp) => ({
        competitor: comp,
        affectedCompany: c,
      }))
    )
    .filter(
      (cs) =>
        !competitorSearches.some(
          (existing) =>
            existing.competitor === cs.competitor &&
            existing.affectedCompany.id === cs.affectedCompany.id
        )
    );

  const allCompetitorSearches = [
    ...competitorSearches,
    ...alwaysWatchCompanies,
  ].slice(0, 20);

  console.log(
    `[news-fetcher] Searching ${allCompetitorSearches.length} competitors...`
  );

  // Batch competitor searches
  const competitorBatches: typeof allCompetitorSearches[] = [];
  for (let i = 0; i < allCompetitorSearches.length; i += 5) {
    competitorBatches.push(allCompetitorSearches.slice(i, i + 5));
  }

  for (const batch of competitorBatches) {
    const batchResults = await Promise.all(
      batch.map(async ({ competitor, affectedCompany }) => {
        const query = `"${competitor}" news OR launch OR funding OR update`;
        const results = await searchBrave(query, 3, "pw");
        return { competitor, affectedCompany, results };
      })
    );

    for (const { competitor, affectedCompany, results } of batchResults) {
      for (const r of results) {
        const headline = decodeHtmlEntities(r.title);
        const summary = decodeHtmlEntities(r.description);

        if (isJunkResult(r.url, headline)) continue;
        if (isDuplicate(r.url, headline)) continue;
        if (isGlobalDuplicate(r.url, headline)) continue;

        const story: TaggedStory = {
          emoji: "⚔️",
          headline,
          summary,
          source_url: r.url,
          source_name: extractSourceName(r.url),
          topic: "competitor-intel",
          is_competitor_news: true,
          affected_portfolio_company: affectedCompany.name,
          portfolio_company_id: affectedCompany.id,
        };

        addToGlobalDedup(story);
        allTaggedStories.push(story);
      }
    }
  }

  // ── Phase 3: General market news (RSS + Brave) to fill gaps ──
  const marketTopics = topics.filter(
    (t) =>
      t !== "portfolio-news" &&
      t !== "competitor-intel" &&
      ["market-moves", "fundraising", "product-launches", "ai-ml", "regulation"].includes(t)
  );

  for (const topicId of marketTopics) {
    const topicInfo = getTopicById(topicId);
    if (!topicInfo) continue;

    const queryConfig = MARKET_SEARCH_QUERIES[topicId] || {
      web: [`${topicInfo.label} news today`],
      twitter: [],
    };

    const [rssStories, ...braveResults] = await Promise.all([
      fetchRssFeeds(topicId),
      ...queryConfig.web
        .slice(0, 2)
        .map((q) => searchBrave(q, 4)),
    ]);

    let results: BraveResult[] = braveResults.flat();

    // Twitter queries
    let twitterResults: BraveResult[] = [];
    for (const query of queryConfig.twitter || []) {
      const batch = await searchBrave(query, 3, "pw");
      twitterResults.push(...batch);
      if (twitterResults.length >= 2) break;
    }

    const rssAsBrave = rssStories.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.summary,
      isTwitter: false,
      isRss: true,
      sourceName: r.sourceName,
    }));

    const combined = [
      ...rssAsBrave,
      ...results.map((r) => ({
        ...r,
        isTwitter: false,
        isRss: false,
        sourceName: "",
      })),
      ...twitterResults.map((r) => ({
        ...r,
        isTwitter: true,
        isRss: false,
        sourceName: "",
      })),
    ];

    // Per-topic dedup
    const seen = new Set<string>();
    const unique = combined.filter((r) => {
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

    const fresh = unique.filter((r) => {
      if (isDuplicate(r.url, r.title)) return false;
      if (isGlobalDuplicate(r.url, r.title)) return false;
      return true;
    });

    for (const r of fresh.slice(0, 4)) {
      const headline = decodeHtmlEntities(r.title);
      const summary = decodeHtmlEntities(r.description);

      // Re-tag: even market stories might mention portfolio companies
      const baseStory: Story = {
        emoji: r.isTwitter ? "🐦" : (topicInfo.emoji || "📰"),
        headline,
        summary,
        source_url: r.url,
        source_name:
          r.isRss && r.sourceName ? r.sourceName : extractSourceName(r.url),
        topic: topicId,
      };

      const tagged = tagStory(headline, summary, baseStory);
      addToGlobalDedup(tagged);
      allTaggedStories.push(tagged);
    }
  }

  // ── Build TopicSections from tagged stories ──
  const sectionOrder = [
    "portfolio-news",
    "competitor-intel",
    "market-moves",
    "fundraising",
    "product-launches",
    "ai-ml",
    "regulation",
  ];

  const grouped = new Map<string, TaggedStory[]>();
  for (const story of allTaggedStories) {
    const existing = grouped.get(story.topic) || [];
    existing.push(story);
    grouped.set(story.topic, existing);
  }

  const topicSections: TopicSection[] = [];
  const allStories: Story[] = [];

  for (const topicId of sectionOrder) {
    const items = grouped.get(topicId);
    if (!items || items.length === 0) continue;
    const topicInfo = getTopicById(topicId);
    if (!topicInfo) continue;

    topicSections.push({
      topic: topicId,
      label: topicInfo.label,
      stories: items,
    });
    allStories.push(...items);
  }

  // Trim to target story count
  const trimmed = allStories.slice(0, storyCount);
  const trimmedSections = topicSections
    .map((s) => ({
      ...s,
      stories: s.stories.filter((st) => trimmed.includes(st)),
    }))
    .filter((s) => s.stories.length > 0);

  console.log(
    `[news-fetcher] Total: ${allTaggedStories.length} stories, returning ${trimmed.length}`
  );

  return { stories: trimmed, topicSections: trimmedSections };
}
