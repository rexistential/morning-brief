import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { briefing_id, story_url, story_title } = await request.json();

    if (!briefing_id || !story_url) {
      return NextResponse.json({ error: "briefing_id and story_url are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const authHeader = request.headers.get("authorization");
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace("Bearer ", "") || ""
    );

    const { error } = await supabase.from("story_clicks").insert({
      user_id: user?.id || "00000000-0000-0000-0000-000000000000",
      briefing_id,
      story_url,
      story_title: story_title || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
