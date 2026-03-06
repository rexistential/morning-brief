import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerSupabaseClient();
    // Exchange the code - with service role we just redirect
    // The actual exchange happens client-side via the Supabase auth listener
  }

  return NextResponse.redirect(new URL(next, request.url));
}
