import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRealNews } from "@/lib/news-fetcher";
import { rewriteBriefing } from "@/lib/briefing-writer";
import { sendBriefingEmail } from "@/lib/email";

// Cron-triggered endpoint: generates + emails briefings for all users
// whose send_time matches the current hour window.
// Protected by a simple bearer token.

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Optionally accept a specific userId (for manual triggers)
  let targetUserId: string | null = null;
  try {
    const body = await request.json();
    targetUserId = body.userId || null;
  } catch {
    // No body — process all scheduled users
  }

  let users;

  if (targetUserId) {
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .eq("onboarded", true);
    users = data || [];
  } else {
    // Get all onboarded users — in a real setup you'd filter by send_time
    // matching the current hour. For now, process everyone.
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("onboarded", true);
    users = data || [];
  }

  const results: Array<{ email: string; status: string; error?: string }> = [];

  for (const profile of users) {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Skip if already generated today
      const { data: existing } = await admin
        .from("briefings")
        .select("id")
        .eq("user_id", profile.id)
        .eq("briefing_date", today)
        .maybeSingle();

      if (existing) {
        results.push({ email: profile.email, status: "skipped", error: "Already generated today" });
        continue;
      }

      // Load previous stories for dedup
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: previousBriefings } = await admin
        .from("briefings")
        .select("stories")
        .eq("user_id", profile.id)
        .gte("briefing_date", sevenDaysAgo)
        .order("briefing_date", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousStories = (previousBriefings || []).flatMap((b: any) => b.stories || []);

      const { stories, topicSections } = await fetchRealNews(
        profile.topics || [],
        profile.briefing_length || "standard",
        previousStories,
      );

      const { rewrittenSections, editorialContent } = await rewriteBriefing(
        topicSections,
        profile.briefing_tone || "punchy",
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rewrittenStories = rewrittenSections.flatMap((s: any) => s.stories);

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
        results.push({ email: profile.email, status: "error", error: insertError?.message || "Insert failed" });
        continue;
      }

      // Send email if enabled
      if (profile.email_enabled) {
        const emailResult = await sendBriefingEmail(briefing, profile.email);
        if (emailResult.success) {
          await admin
            .from("briefings")
            .update({ sent_at: new Date().toISOString(), sent_via: "email" })
            .eq("id", briefing.id);
          results.push({ email: profile.email, status: "sent" });
        } else {
          results.push({ email: profile.email, status: "generated_no_email", error: emailResult.error });
        }
      } else {
        results.push({ email: profile.email, status: "generated_no_email", error: "Email disabled" });
      }
    } catch (err) {
      results.push({ email: profile.email, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
