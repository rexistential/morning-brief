export const TOPICS = [
  { id: "ai-ml", label: "AI & Machine Learning", emoji: "🤖" },
  { id: "foundation-models", label: "Foundation Models", emoji: "🧠" },
  { id: "vc-startups", label: "VC & Startups", emoji: "🚀" },
  { id: "markets-finance", label: "Markets & Finance", emoji: "📈" },
  { id: "dev-tools", label: "Developer Tools & Infrastructure", emoji: "🛠️" },
  { id: "policy-regulation", label: "Policy & Regulation", emoji: "⚖️" },
  { id: "hardware-chips", label: "Hardware & Chips", emoji: "💾" },
  { id: "open-source", label: "Open Source", emoji: "📖" },
  { id: "robotics", label: "Robotics & Physical AI", emoji: "🦾" },
  { id: "crypto-web3", label: "Crypto & Web3", emoji: "🪙" },
] as const;

export const BRIEFING_LENGTHS = [
  { id: "quick", label: "Quick", description: "3-5 stories" },
  { id: "standard", label: "Standard", description: "6-8 stories" },
  { id: "deep", label: "Deep Dive", description: "10-12 stories" },
] as const;

export const BRIEFING_TONES = [
  { id: "punchy", label: "Punchy & editorial" },
  { id: "neutral", label: "Neutral & factual" },
  { id: "technical", label: "Technical & detailed" },
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
  return TOPICS.find(t => t.id === id);
}

export function getStoryCountForLength(length: string): number {
  switch (length) {
    case "quick": return 4;
    case "standard": return 7;
    case "deep": return 11;
    default: return 7;
  }
}
