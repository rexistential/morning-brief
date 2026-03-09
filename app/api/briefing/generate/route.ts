import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchRealNews } from "@/lib/news-fetcher";
import { rewriteBriefing } from "@/lib/briefing-writer";

export async function POST(request: NextRequest) {
  try {
    // Auth: check if called with userId (internal/admin) or via session
    const body = await request.json();
    let userId = body.userId;

    if (!userId) {
      // Try to get from session
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Load stories from the last 7 days for dedup
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: previousBriefings } = await admin
      .from("briefings")
      .select("stories")
      .eq("user_id", userId)
      .gte("briefing_date", sevenDaysAgo)
      .order("briefing_date", { ascending: false });

    const previousStories = (previousBriefings || []).flatMap(b => b.stories || []);

    // Fetch real news based on user's topic preferences, excluding previous stories
    const { stories, topicSections } = await fetchRealNews(
      profile.topics || [],
      profile.briefing_length || "standard",
      previousStories,
    );

    // Rewrite with AI for natural editorial flow
    const { rewrittenSections, editorialContent } = await rewriteBriefing(
      topicSections,
      profile.briefing_tone || "punchy",
    );

    // Use rewritten stories for storage
    const rewrittenStories = rewrittenSections.flatMap(s => s.stories);

    const today = new Date().toISOString().split("T")[0];

    // Delete existing briefing for today (if regenerating)
    await admin.from("briefings").delete()
      .eq("user_id", userId)
      .eq("briefing_date", today);

    const { data: briefing, error: insertError } = await admin
      .from("briefings")
      .insert({
        user_id: userId,
        content: editorialContent,
        stories: rewrittenStories,
        topic_sections: rewrittenSections,
        briefing_date: today,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (profile.email_enabled) {
      console.log(`[EMAIL] Would send briefing to ${profile.email} (Resend not configured yet)`);
    }

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
