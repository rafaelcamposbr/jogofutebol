import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("guest_mode");
  return response;
}
