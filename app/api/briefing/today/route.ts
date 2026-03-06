import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const supabase = createServerSupabaseClient();

    // Get user from cookie/session
    const cookieHeader = request.headers.get("cookie") || "";
    // Extract user ID from the supabase auth token if available
    // For now, get the most recent briefing for the authenticated user

    const today = new Date().toISOString().split("T")[0];

    // Try to get user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace("Bearer ", "") || ""
    );

    if (!user) {
      // Fallback: get the latest briefing (for demo purposes when auth token isn't passed)
      const { data: briefing } = await supabase
        .from("briefings")
        .select("*")
        .eq("briefing_date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({ briefing: briefing || null });
    }

    const { data: briefing } = await supabase
      .from("briefings")
      .select("*")
      .eq("user_id", user.id)
      .eq("briefing_date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ briefing: briefing || null });
  } catch {
    return NextResponse.json({ briefing: null });
  }
}
