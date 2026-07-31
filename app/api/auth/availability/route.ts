import { NextRequest, NextResponse } from "next/server";
import { normalizeUsername, RESERVED_USERNAMES } from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const username = normalizeUsername(request.nextUrl.searchParams.get("username") || "");
  if (!/^[a-z0-9._]{3,24}$/.test(username) || RESERVED_USERNAMES.has(username)) {
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { available: false, unavailable: true },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username_normalized", username)
    .limit(1)
    .maybeSingle();

  return NextResponse.json(
    { available: !data && !error },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
