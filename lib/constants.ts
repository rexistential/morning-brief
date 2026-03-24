export const TOPICS = [
  { id: "portfolio-news", label: "Portfolio Company News", emoji: "📊" },
  { id: "competitor-intel", label: "Competitor Intelligence", emoji: "⚔️" },
  { id: "market-moves", label: "Market & Sector Moves", emoji: "📈" },
  { id: "fundraising", label: "Fundraising & Exits", emoji: "💰" },
  { id: "product-launches", label: "Product Launches", emoji: "🚀" },
  { id: "ai-ml", label: "AI & Infrastructure", emoji: "🤖" },
  { id: "regulation", label: "Policy & Regulation", emoji: "⚖️" },
] as const;

// Legacy topic IDs that map to new ones (backward compat)
export const LEGACY_TOPIC_MAP: Record<string, string> = {
  "foundation-models": "ai-ml",
  "ai-finance": "market-moves",
  "vc-startups": "fundraising",
  "markets-finance": "market-moves",
  "dev-tools": "product-launches",
  "policy-regulation": "regulation",
  "hardware-chips": "ai-ml",
  "open-source": "ai-ml",
  "robotics": "ai-ml",
  "crypto-web3": "market-moves",
};

export const BRIEFING_LENGTHS = [
  { id: "quick", label: "Quick", description: "3-5 stories" },
  { id: "standard", label: "Standard", description: "6-8 stories" },
  { id: "deep", label: "Deep Dive", description: "10-12 stories" },
] as const;

export const BRIEFING_TONES = [
  { id: "punchy", label: "Punchy & editorial" },
  { id: "neutral", label: "Neutral & factual" },
  { id: "technical", label: "Technical & detailed" },
  { id: "dense", label: "Dense & facts-only" },
  { id: "trends", label: "Trends & patterns" },
] as const;

export const SEND_TIMES = [
  "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00",
] as const;

export const TIMEZONES = [
  "Africa/Johannesburg",
  "US/Eastern",
  "US/Central",
  "US/Mountain",
  "US/Pacific",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const;

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "rob@headline.com,robtweddle9@gmail.com").split(",").map(e => e.trim());

export function getTopicById(id: string) {
  // Check new topics first, then try legacy mapping
  const direct = TOPICS.find(t => t.id === id);
  if (direct) return direct;
  const mapped = LEGACY_TOPIC_MAP[id];
  if (mapped) return TOPICS.find(t => t.id === mapped);
  return undefined;
}

export function getStoryCountForLength(length: string): number {
  switch (length) {
    case "quick": return 4;
    case "standard": return 7;
    case "deep": return 11;
    default: return 7;
  }
}

/** Resolve a user's topic list, mapping any legacy IDs to new ones */
export function resolveUserTopics(topics: string[]): string[] {
  const resolved = new Set<string>();
  for (const t of topics) {
    const mapped = LEGACY_TOPIC_MAP[t];
    resolved.add(mapped || t);
  }
  return [...resolved];
}
