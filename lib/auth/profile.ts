import { redirect } from "next/navigation";
import { isMissingSessionError } from "@/lib/auth/navigation";
import { logServerError, logServerEvent } from "@/lib/server/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GameProfile = {
  id: string;
  username: string;
  username_normalized: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string | null;
  whatsapp_normalized: string | null;
  email_game_verified: boolean;
  whatsapp_game_verified: boolean;
  email_verified_at: string | null;
  whatsapp_verified_at: string | null;
  created_at: string;
};

export async function getAuthenticatedProfile(nextPath = "/minha-conta") {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    logServerEvent("auth", "service_unavailable", { nextPath });
    redirect(`/error?reason=auth-unavailable&next=${encodeURIComponent(nextPath)}`);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userData.user) {
    if (userError && !isMissingSessionError(userError)) {
      logServerError("auth", "session_lookup_failed", userError, { nextPath });
      redirect(`/error?reason=session-unavailable&next=${encodeURIComponent(nextPath)}`);
    }
    logServerEvent("auth", "session_missing", { nextPath });
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id,username,username_normalized,first_name,last_name,email,whatsapp,whatsapp_normalized,email_game_verified,whatsapp_game_verified,email_verified_at,whatsapp_verified_at,created_at",
    )
    .eq("id", userData.user.id)
    .maybeSingle<GameProfile>();

  if (profileError) {
    logServerError("profile", "profile_lookup_failed", profileError, { nextPath });
    redirect(`/error?reason=profile-unavailable&next=${encodeURIComponent(nextPath)}`);
  }
  if (!profile) {
    logServerEvent("profile", "profile_missing", { nextPath });
    redirect(`/error?reason=profile-missing&next=${encodeURIComponent(nextPath)}`);
  }
  return { supabase, user: userData.user, profile };
}
