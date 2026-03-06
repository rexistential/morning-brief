import { Story, TopicSection } from "./types";
import { getTopicById, getStoryCountForLength } from "./constants";

const SAMPLE_STORIES: Record<string, Story[]> = {
  "ai-ml": [
    { emoji: "🤖", headline: "Google DeepMind achieves breakthrough in protein-drug interaction modeling", summary: "A new model called AlphaPharm can predict how drug compounds interact with protein targets with unprecedented accuracy, potentially cutting drug discovery timelines by years.", source_url: "https://example.com/deepmind-alphapharm", source_name: "Nature", topic: "ai-ml" },
    { emoji: "🤖", headline: "Researchers demonstrate AI system that learns from a single example", summary: "MIT researchers published a paper showing a new few-shot learning technique that matches human-level generalization from just one training example on visual tasks.", source_url: "https://example.com/mit-few-shot", source_name: "MIT News", topic: "ai-ml" },
    { emoji: "🤖", headline: "Enterprise AI adoption hits 72% as companies move past experimentation", summary: "McKinsey's latest survey shows nearly three quarters of enterprises have at least one AI use case in production, up from 55% last year.", source_url: "https://example.com/mckinsey-ai", source_name: "McKinsey", topic: "ai-ml" },
  ],
  "foundation-models": [
    { emoji: "🧠", headline: "Anthropic releases Claude 4.5 with expanded reasoning capabilities", summary: "The latest Claude model shows major improvements in mathematical reasoning, code generation, and multi-step planning tasks, setting new benchmarks across several evaluations.", source_url: "https://example.com/claude-4-5", source_name: "Anthropic Blog", topic: "foundation-models" },
    { emoji: "🧠", headline: "OpenAI reportedly training GPT-5 on custom AI chip clusters", summary: "Sources say OpenAI has begun training its next-generation model on a mix of NVIDIA H200s and its own custom silicon, targeting a mid-2026 release.", source_url: "https://example.com/openai-gpt5", source_name: "The Information", topic: "foundation-models" },
    { emoji: "🧠", headline: "Meta open-sources Llama 4 with 400B parameters", summary: "Meta's latest open-weight model matches proprietary alternatives on most benchmarks, raising questions about the viability of closed-source model businesses.", source_url: "https://example.com/llama-4", source_name: "Meta AI Blog", topic: "foundation-models" },
  ],
  "vc-startups": [
    { emoji: "🚀", headline: "AI infrastructure startup raises $500M at $4B valuation", summary: "Modal, which provides serverless GPU infrastructure for AI workloads, closed a massive Series C led by Sequoia, signaling continued investor appetite for AI picks-and-shovels plays.", source_url: "https://example.com/modal-funding", source_name: "TechCrunch", topic: "vc-startups" },
    { emoji: "🚀", headline: "Q1 2026 venture funding hits $85B globally", summary: "Global VC investment continues its recovery, with AI-related deals accounting for 45% of total funding — the highest concentration in a single sector since the dot-com era.", source_url: "https://example.com/q1-vc", source_name: "PitchBook", topic: "vc-startups" },
  ],
  "markets-finance": [
    { emoji: "📈", headline: "NVIDIA market cap surpasses $5 trillion milestone", summary: "Driven by insatiable demand for AI training and inference chips, NVIDIA briefly crossed $5T in market capitalization before settling at $4.95T by market close.", source_url: "https://example.com/nvidia-5t", source_name: "Bloomberg", topic: "markets-finance" },
    { emoji: "📈", headline: "Fed signals patience on rates amid AI productivity boom", summary: "The Federal Reserve held rates steady, with Chair Powell noting that AI-driven productivity gains may be helping contain inflation despite a tight labor market.", source_url: "https://example.com/fed-rates", source_name: "Reuters", topic: "markets-finance" },
  ],
  "dev-tools": [
    { emoji: "🛠️", headline: "GitHub Copilot now writes and runs tests automatically", summary: "GitHub's latest Copilot update can generate test suites, execute them, and iterate on failures — moving closer to autonomous software development.", source_url: "https://example.com/copilot-tests", source_name: "GitHub Blog", topic: "dev-tools" },
    { emoji: "🛠️", headline: "Vercel launches AI-native deployment framework", summary: "The new framework automatically optimizes AI inference endpoints for edge deployment, reducing latency by up to 60% compared to traditional cloud setups.", source_url: "https://example.com/vercel-ai", source_name: "Vercel Blog", topic: "dev-tools" },
  ],
  "policy-regulation": [
    { emoji: "⚖️", headline: "EU AI Act enforcement begins with first compliance audits", summary: "European regulators have launched the first formal audits of high-risk AI systems under the AI Act, targeting healthcare and financial services applications.", source_url: "https://example.com/eu-ai-act", source_name: "Financial Times", topic: "policy-regulation" },
    { emoji: "⚖️", headline: "US Senate introduces bipartisan AI licensing framework", summary: "A new bill would require companies deploying AI models above a compute threshold to obtain federal licenses, with safety testing requirements.", source_url: "https://example.com/us-ai-bill", source_name: "Politico", topic: "policy-regulation" },
  ],
  "hardware-chips": [
    { emoji: "💾", headline: "TSMC begins 1.4nm chip production for AI accelerators", summary: "TSMC's latest node enters volume production ahead of schedule, with initial customers including Apple, NVIDIA, and AMD for next-generation AI chips.", source_url: "https://example.com/tsmc-14nm", source_name: "AnandTech", topic: "hardware-chips" },
    { emoji: "💾", headline: "New photonic chip achieves 100x energy efficiency for AI inference", summary: "A startup called Lightmatter demonstrated a production-ready photonic processor that performs transformer inference at a fraction of the power cost of traditional GPUs.", source_url: "https://example.com/lightmatter", source_name: "IEEE Spectrum", topic: "hardware-chips" },
  ],
  "open-source": [
    { emoji: "📖", headline: "Linux Foundation launches Open AI Model Initiative", summary: "A coalition of tech companies will fund and maintain a set of open-source AI models as public goods, with a $200M initial commitment.", source_url: "https://example.com/linux-openai", source_name: "Linux Foundation", topic: "open-source" },
    { emoji: "📖", headline: "Hugging Face surpasses 1 million public models", summary: "The open-source ML hub hit a major milestone, with model uploads accelerating as more organizations embrace open-weight distribution.", source_url: "https://example.com/hf-1m", source_name: "Hugging Face Blog", topic: "open-source" },
  ],
  "robotics": [
    { emoji: "🦾", headline: "Figure's humanoid robot begins warehouse deployment at Amazon", summary: "Figure 02 robots are now operational in three Amazon fulfillment centers, handling mixed-item picking tasks alongside human workers.", source_url: "https://example.com/figure-amazon", source_name: "The Verge", topic: "robotics" },
    { emoji: "🦾", headline: "Tesla Optimus demonstrates autonomous household tasks", summary: "In a live demo, Tesla's humanoid robot folded laundry, loaded a dishwasher, and navigated a cluttered living room, though with notable pauses between actions.", source_url: "https://example.com/tesla-optimus", source_name: "Wired", topic: "robotics" },
  ],
  "crypto-web3": [
    { emoji: "🪙", headline: "Bitcoin ETFs see record $2B daily inflow", summary: "Institutional demand for Bitcoin ETFs surged to new highs as BTC crossed $120K, with BlackRock's iShares fund leading inflows.", source_url: "https://example.com/btc-etf", source_name: "CoinDesk", topic: "crypto-web3" },
    { emoji: "🪙", headline: "Ethereum completes sharding upgrade, cuts gas fees 90%", summary: "The long-awaited full sharding implementation went live, dramatically reducing transaction costs and boosting throughput to over 100K TPS.", source_url: "https://example.com/eth-sharding", source_name: "The Block", topic: "crypto-web3" },
  ],
};

export function generateSampleBriefing(
  topics: string[],
  length: string,
  tone: string
): { stories: Story[]; topicSections: TopicSection[]; content: string } {
  const storyCount = getStoryCountForLength(length);
  const allStories: Story[] = [];
  const topicSections: TopicSection[] = [];

  for (const topicId of topics) {
    const topicInfo = getTopicById(topicId);
    const pool = SAMPLE_STORIES[topicId] || [];
    if (pool.length > 0 && topicInfo) {
      const selected = pool.slice(0, Math.ceil(storyCount / topics.length) + 1);
      allStories.push(...selected);
      topicSections.push({
        topic: topicId,
        label: topicInfo.label,
        stories: selected,
      });
    }
  }

  const trimmed = allStories.slice(0, storyCount);
  const trimmedSections = topicSections.map(s => ({
    ...s,
    stories: s.stories.filter(st => trimmed.includes(st)),
  })).filter(s => s.stories.length > 0);

  let tonePrefix = "";
  if (tone === "punchy") tonePrefix = "Here's what's moving the needle today:";
  else if (tone === "neutral") tonePrefix = "Today's key developments:";
  else tonePrefix = "Technical briefing — detailed analysis follows:";

  const content = `${tonePrefix}\n\n${trimmedSections.map(s =>
    `## ${s.stories[0]?.emoji || ""} ${s.label}\n\n${s.stories.map(st =>
      `**${st.headline}**\n${st.summary}\n[${st.source_name}](${st.source_url})`
    ).join("\n\n")}`
  ).join("\n\n---\n\n")}`;

  return { stories: trimmed, topicSections: trimmedSections, content };
}
