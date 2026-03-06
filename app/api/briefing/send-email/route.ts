import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { briefingId } = await request.json();

    if (!briefingId) {
      return NextResponse.json({ error: "briefingId is required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: briefing, error } = await supabase
      .from("briefings")
      .select("*, profiles!inner(email)")
      .eq("id", briefingId)
      .single();

    if (error || !briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    // Mock email sending - Resend API key not available yet
    console.log(`[MOCK EMAIL] Sending briefing ${briefingId} to ${(briefing as Record<string, unknown>).profiles}`);

    await supabase
      .from("briefings")
      .update({ sent_at: new Date().toISOString(), sent_via: "email" })
      .eq("id", briefingId);

    return NextResponse.json({ success: true, message: "Email sent (mocked)" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
