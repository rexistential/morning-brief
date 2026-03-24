import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRealNews } from "@/lib/news-fetcher";
import { rewriteBriefing } from "@/lib/briefing-writer";
import { sendBriefingEmail } from "@/lib/email";
import { getTopicById, getStoryCountForLength } from "@/lib/constants";
import { Story, TopicSection, DailyNewsPoolItem } from "@/lib/types";

// Runs every 30 minutes. For each onboarded user, checks if the current time
// in their timezone matches their send_time (within a 30-min window).
// If so, generates their briefing and emails it.
//
// Phase 2: Reads from daily_news_pool (populated by /api/cron/fetch-news)
// instead of calling fetchRealNews per-user. Falls back to fetchRealNews
// if the pool is empty for today.

function isUserDue(sendTime: string, timezone: string): boolean {
  try {
    // Get current time in the user's timezone
    const now = new Date();
    const userNow = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );
    const userHour = userNow.getHours();
    const userMinute = userNow.getMinutes();

    // Parse send_time (format: "07:00" or "07:30")
    const [sendHour, sendMinute] = sendTime.split(":").map(Number);

    // Match if we're within the 30-minute window starting at send_time
    const userTotalMin = userHour * 60 + userMinute;
    const sendTotalMin = sendHour * 60 + sendMinute;

    return userTotalMin >= sendTotalMin && userTotalMin < sendTotalMin + 30;
  } catch {
    return false;
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

function headlinesSimilar(a: string, b: string): boolean {
  const na = normalizeHeadline(a);
  const nb = normalizeHeadline(b);
  if (na === nb) return true;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 3 && overlap / minSize > 0.7;
}

function poolToTopicSections(
  poolStories: DailyNewsPoolItem[],
  storyCount: number,
  previousStories: Story[]
): TopicSection[] {
  // Filter out duplicates from previous briefings
  const previousHeadlines = previousStories.map((s) => s.headline);
  const previousUrls = new Set(
    previousStories.map((s) => s.source_url.toLowerCase())
  );

  const fresh = poolStories.filter((p) => {
    if (previousUrls.has(p.source_url.toLowerCase())) return false;
    return !previousHeadlines.some((prev) =>
      headlinesSimilar(prev, p.headline)
    );
  });

  // Group by topic
  const grouped = new Map<string, DailyNewsPoolItem[]>();
  for (const item of fresh) {
    const existing = grouped.get(item.topic) || [];
    existing.push(item);
    grouped.set(item.topic, existing);
  }

  // Convert to TopicSection[], respecting story count limit
  // Prioritize portfolio news → competitor intel → market context
  const sectionOrder = [
    "portfolio-news",
    "competitor-intel",
    "market-moves",
    "fundraising",
    "product-launches",
    "ai-ml",
    "regulation",
  ];
  const sections: TopicSection[] = [];
  let totalStories = 0;

  const orderedTopics = [
    ...sectionOrder.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !sectionOrder.includes(t)),
  ];

  for (const topicId of orderedTopics) {
    const items = grouped.get(topicId);
    if (!items) continue;
    if (totalStories >= storyCount) break;
    const topicInfo = getTopicById(topicId);
    if (!topicInfo) continue;

    const remaining = storyCount - totalStories;
    const stories: Story[] = items.slice(0, remaining).map((item) => ({
      emoji: item.emoji || "",
      headline: item.headline,
      summary: item.summary,
      source_url: item.source_url,
      source_name: item.source_name,
      topic: item.topic,
      portfolio_company_id: item.portfolio_company_id,
      is_competitor_news: item.is_competitor_news,
      affected_portfolio_company: item.affected_portfolio_company,
    }));

    if (stories.length > 0) {
      sections.push({
        topic: topicId,
        label: topicInfo.label,
        stories,
      });
      totalStories += stories.length;
    }
  }

  return sections;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for manual single-user trigger
  let targetUserId: string | null = null;
  try {
    const body = await request.json();
    targetUserId = body.userId || null;
  } catch {
    // No body — process scheduled users
  }

  let users;

  if (targetUserId) {
    // Manual trigger — skip time check
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .eq("onboarded", true);
    users = data || [];
  } else {
    // Scheduled run — get all onboarded users and filter by time
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("onboarded", true);

    users = (data || []).filter((p) =>
      isUserDue(p.send_time || "07:00", p.timezone || "UTC")
    );
  }

  if (users.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "No users due right now",
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const results: Array<{ email: string; status: string; error?: string }> = [];

  // Pre-fetch today's pool once for all users
  const { data: fullPool } = await admin
    .from("daily_news_pool")
    .select("*")
    .eq("fetch_date", today)
    .order("fetched_at", { ascending: true });

  const poolAvailable = fullPool && fullPool.length > 0;

  for (const profile of users) {
    try {
      // Skip if already generated today
      const { data: existing } = await admin
        .from("briefings")
        .select("id")
        .eq("user_id", profile.id)
        .eq("briefing_date", today)
        .maybeSingle();

      if (existing) {
        results.push({
          email: profile.email,
          status: "skipped",
          error: "Already generated today",
        });
        continue;
      }

      // Load previous stories for dedup
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const { data: previousBriefings } = await admin
        .from("briefings")
        .select("stories")
        .eq("user_id", profile.id)
        .gte("briefing_date", sevenDaysAgo)
        .order("briefing_date", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousStories = (previousBriefings || []).flatMap(
        (b: any) => b.stories || []
      );

      const userTopics: string[] = profile.topics || [];
      const storyCount = getStoryCountForLength(
        profile.briefing_length || "standard"
      );

      let topicSections: TopicSection[] = [];

      if (poolAvailable) {
        // Phase 2: Use daily_news_pool filtered by user's topics
        const userPool = (fullPool as DailyNewsPoolItem[]).filter((item) =>
          userTopics.includes(item.topic)
        );
        topicSections = poolToTopicSections(
          userPool,
          storyCount,
          previousStories
        );
      }

      // Fallback: if pool is empty or yielded no stories, use fetchRealNews
      if (topicSections.length === 0) {
        const result = await fetchRealNews(
          userTopics,
          profile.briefing_length || "standard",
          previousStories
        );
        topicSections = result.topicSections;
      }

      const { rewrittenSections, editorialContent } = await rewriteBriefing(
        topicSections,
        profile.briefing_tone || "punchy"
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rewrittenStories = rewrittenSections.flatMap(
        (s: any) => s.stories
      );

      const { data: briefing, error: insertError } = await admin
        .from("briefings")
        .insert({
          user_id: profile.id,
          content: editorialContent,
          stories: rewrittenStories,
          topic_sections: rewrittenSections,
          briefing_date: today,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !briefing) {
        results.push({
          email: profile.email,
          status: "error",
          error: insertError?.message || "Insert failed",
        });
        continue;
      }

      if (profile.email_enabled) {
        const emailResult = await sendBriefingEmail(briefing, profile.email);
        if (emailResult.success) {
          await admin
            .from("briefings")
            .update({
              sent_at: new Date().toISOString(),
              sent_via: "email",
            })
            .eq("id", briefing.id);
          results.push({ email: profile.email, status: "sent" });
        } else {
          results.push({
            email: profile.email,
            status: "generated_no_email",
            error: emailResult.error,
          });
        }
      } else {
        results.push({
          email: profile.email,
          status: "generated_no_email",
          error: "Email disabled",
        });
      }
    } catch (err) {
      results.push({ email: profile.email, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
