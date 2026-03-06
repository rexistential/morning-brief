import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const authHeader = request.headers.get("authorization");
    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace("Bearer ", "") || ""
    );

    let query = supabase
      .from("briefings")
      .select("*")
      .order("briefing_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (user) {
      query = query.eq("user_id", user.id);
    }

    const { data: briefings, error } = await query;

    if (error) {
      return NextResponse.json({ briefings: [], error: error.message });
    }

    return NextResponse.json({ briefings: briefings || [], page, limit });
  } catch {
    return NextResponse.json({ briefings: [] });
  }
}
