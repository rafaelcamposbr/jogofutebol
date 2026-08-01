import "server-only";

import { redirect } from "next/navigation";
import { authenticatedHomeDestination, isMissingSessionError } from "@/lib/auth/navigation";
import { logServerError, logServerEvent } from "@/lib/server/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOptionalAuthenticatedHome(from: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    logServerEvent("auth", "service_unavailable", { from });
    redirect(`/error?reason=auth-unavailable&next=${encodeURIComponent(from)}`);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userData.user) {
    if (userError && !isMissingSessionError(userError)) {
      logServerError("auth", "session_lookup_failed", userError, { from });
      redirect(`/error?reason=session-unavailable&next=${encodeURIComponent(from)}`);
    }
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle<{ id: string }>();
  if (profileError) {
    logServerError("profile", "profile_lookup_failed", profileError, { from });
    redirect(`/error?reason=profile-unavailable&next=${encodeURIComponent(from)}`);
  }
  if (!profile) {
    logServerEvent("profile", "profile_missing", { from });
    redirect(`/error?reason=profile-missing&next=${encodeURIComponent(from)}`);
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("owner_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (clubError) {
    logServerError("navigation", "club_lookup_failed", clubError, { from });
    redirect(`/error?reason=club-unavailable&next=${encodeURIComponent(from)}`);
  }

  return authenticatedHomeDestination({
    hasClub: Boolean(club),
  });
}

export async function redirectToAuthenticatedHome(from: string, loginPath = "/login") {
  const destination = await getOptionalAuthenticatedHome(from);
  if (!destination) {
    logServerEvent("navigation", "redirect_no_session", { from, to: loginPath });
    redirect(loginPath);
  }
  logServerEvent("navigation", "redirect_authenticated_home", { from, to: destination });
  redirect(destination);
}
