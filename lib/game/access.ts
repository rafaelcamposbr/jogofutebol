import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isMissingSessionError } from "@/lib/auth/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError, logServerEvent } from "@/lib/server/log";
import { buildGuestLegacyState, buildLegacyState, ClubRecord, EventRecord, PressReleaseRecord } from "@/lib/game/legacy-state";

export type GameAccess = {
  mode: "authenticated" | "guest" | "public";
  initialState: ReturnType<typeof buildLegacyState>;
  userEmail?: string;
  verification: {
    email: boolean;
    whatsapp: boolean;
  };
};

const unrestrictedVerification = { email: true, whatsapp: true };

export async function getGameAccess(options: {
  allowPublic?: boolean;
  requireClub?: boolean;
  requireVerification?: "email" | "whatsapp";
  nextPath?: string;
} = {}): Promise<GameAccess> {
  const cookieStore = await cookies();
  const guestMode = cookieStore.get("guest_mode")?.value === "1";
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (guestMode || options.allowPublic) {
      return { mode: guestMode ? "guest" : "public", initialState: buildGuestLegacyState(), verification: unrestrictedVerification };
    }
    redirect(`/error?reason=auth-unavailable&next=${encodeURIComponent(options.nextPath || "/mercado")}`);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    if (guestMode || options.allowPublic) {
      return { mode: guestMode ? "guest" : "public", initialState: buildGuestLegacyState(), verification: unrestrictedVerification };
    }
    if (userError && !isMissingSessionError(userError)) {
      logServerError("auth", "game_session_lookup_failed", userError, { nextPath: options.nextPath });
      redirect(`/error?reason=session-unavailable&next=${encodeURIComponent(options.nextPath || "/mercado")}`);
    }
    logServerEvent("auth", "game_session_missing", { nextPath: options.nextPath });
    redirect(`/login?next=${encodeURIComponent(options.nextPath || "/mercado")}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email_game_verified,whatsapp_game_verified")
    .eq("id", user.id)
    .maybeSingle<{ email_game_verified: boolean; whatsapp_game_verified: boolean }>();
  if (profileError) {
    logServerError("profile", "game_profile_lookup_failed", profileError, { nextPath: options.nextPath });
    redirect(`/error?reason=profile-unavailable&next=${encodeURIComponent(options.nextPath || "/mercado")}`);
  }
  if (!profile) {
    logServerEvent("profile", "game_profile_missing", { nextPath: options.nextPath });
    redirect(`/error?reason=profile-missing&next=${encodeURIComponent(options.nextPath || "/mercado")}`);
  }

  const verification = {
    email: profile.email_game_verified,
    whatsapp: profile.whatsapp_game_verified,
  };
  if (options.requireVerification && !verification[options.requireVerification]) {
    const verificationPath = options.requireVerification === "email" ? "/verificar-email" : "/verificar-whatsapp";
    const nextPath = options.nextPath || (options.requireVerification === "email" ? "/imprensa" : "/escritorio");
    logServerEvent("navigation", "verification_required", {
      channel: options.requireVerification,
      from: nextPath,
      to: verificationPath,
    });
    redirect(`${verificationPath}?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<ClubRecord>();

  if (clubError) {
    logServerError("navigation", "game_club_lookup_failed", clubError, { nextPath: options.nextPath });
    redirect(`/error?reason=club-unavailable&next=${encodeURIComponent(options.nextPath || "/mercado")}`);
  }

  if (!club) {
    if (options.requireClub === false) {
      return { mode: "authenticated", initialState: buildGuestLegacyState(), userEmail: user.email || undefined, verification };
    }
    redirect("/criar-clube");
  }

  const [releaseResult, eventResult] = await Promise.all([
    supabase
      .from("press_releases")
      .select("*")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("events")
      .select("*")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);
  if (releaseResult.error) logServerError("navigation", "press_releases_lookup_failed", releaseResult.error);
  if (eventResult.error) logServerError("navigation", "events_lookup_failed", eventResult.error);

  return {
    mode: "authenticated",
    userEmail: user.email || undefined,
    verification,
    initialState: buildLegacyState(
      club,
      (releaseResult.data || []) as PressReleaseRecord[],
      (eventResult.data || []) as EventRecord[],
    ),
  };
}
