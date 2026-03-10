import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBriefingEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { briefingId } = await request.json();

    if (!briefingId) {
      return NextResponse.json({ error: "briefingId is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: briefing, error } = await supabase
      .from("briefings")
      .select("*")
      .eq("id", briefingId)
      .single();

    if (error || !briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", briefing.user_id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    const result = await sendBriefingEmail(briefing, profile.email);

    if (result.success) {
      await supabase
        .from("briefings")
        .update({ sent_at: new Date().toISOString(), sent_via: "email" })
        .eq("id", briefingId);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error("[SEND-EMAIL] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
