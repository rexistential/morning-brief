import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRealNews } from "@/lib/news-fetcher";
import { TOPICS } from "@/lib/constants";

// Phase 1: Bulk news fetch for all topics.
// Runs once daily (e.g. 4:00 AM UTC) before per-user generation.
// Stores raw stories in daily_news_pool for Phase 2 to consume.

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

  const allTopicIds = TOPICS.map((t) => t.id);
  const today = new Date().toISOString().split("T")[0];

  try {
    const { topicSections } = await fetchRealNews(allTopicIds, "deep");

    // Build rows — portfolio columns are optional (may not exist in DB yet)
    const baseRows = topicSections.flatMap((section) =>
      section.stories.map((story) => ({
        fetch_date: today,
        topic: story.topic || section.topic,
        headline: story.headline,
        summary: story.summary,
        source_url: story.source_url,
        source_name: story.source_name,
        emoji: story.emoji || "",
        portfolio_company_id: story.portfolio_company_id || null,
        is_competitor_news: story.is_competitor_news || false,
        affected_portfolio_company: story.affected_portfolio_company || null,
      }))
    );

    // Try with portfolio columns first, fall back to without if columns don't exist
    let rows = baseRows;
    const { error: testError } = await admin
      .from("daily_news_pool")
      .select("portfolio_company_id")
      .limit(0);
    
    if (testError) {
      // Portfolio columns don't exist yet — strip them
      rows = baseRows.map(({ portfolio_company_id, is_competitor_news, affected_portfolio_company, ...rest }) => rest) as typeof baseRows;
    }

    if (rows.length === 0) {
      return NextResponse.json({ stored: 0, message: "No stories fetched" });
    }

    const { error } = await admin
      .from("daily_news_pool")
      .upsert(rows, { onConflict: "fetch_date,source_url" });

    if (error) {
      console.error("[fetch-news] Upsert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ stored: rows.length, date: today });
  } catch (err) {
    console.error("[fetch-news] Fatal error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
