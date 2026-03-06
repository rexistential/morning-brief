import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateSampleBriefing } from "@/lib/sample-briefing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { stories, topicSections, content } = generateSampleBriefing(
      profile.topics || [],
      profile.briefing_length || "standard",
      profile.briefing_tone || "punchy"
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: briefing, error: insertError } = await supabase
      .from("briefings")
      .upsert(
        {
          user_id: userId,
          content,
          stories,
          topic_sections: topicSections,
          briefing_date: today,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,briefing_date" }
      )
      .select()
      .single();

    if (insertError) {
      // If upsert on conflict fails (no unique constraint yet), try insert
      const { data: newBriefing, error: err2 } = await supabase
        .from("briefings")
        .insert({
          user_id: userId,
          content,
          stories,
          topic_sections: topicSections,
          briefing_date: today,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (err2) {
        return NextResponse.json({ error: err2.message }, { status: 500 });
      }

      // Mock email sending
      if (profile.email_enabled) {
        console.log(`[MOCK EMAIL] Would send briefing to ${profile.email}`);
      }

      return NextResponse.json({ briefing: newBriefing });
    }

    if (profile.email_enabled) {
      console.log(`[MOCK EMAIL] Would send briefing to ${profile.email}`);
    }

    return NextResponse.json({ briefing });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
