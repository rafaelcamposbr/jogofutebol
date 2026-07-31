import { NextRequest, NextResponse } from "next/server";
import { getUsernameValidationError, normalizeUsername } from "@/lib/auth/validation";
import { createSupabaseStatelessClient } from "@/lib/supabase/admin";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const rawUsername = request.nextUrl.searchParams.get("username") || "";
  const username = normalizeUsername(rawUsername);
  if (getUsernameValidationError(rawUsername)) {
    return NextResponse.json({ available: false }, { status: 422, headers: noStore });
  }

  const supabase = createSupabaseStatelessClient();
  if (!supabase) {
    return NextResponse.json(
      { available: null },
      { status: 503, headers: noStore },
    );
  }

  const { data, error } = await supabase.rpc("is_username_available", { p_username: username });

  if (error || typeof data !== "boolean") {
    return NextResponse.json({ available: null }, { status: 503, headers: noStore });
  }

  return NextResponse.json({ available: data }, { headers: noStore });
}
