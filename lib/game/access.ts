import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    redirect("/login?next=/central");
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    if (guestMode || options.allowPublic) {
      return { mode: guestMode ? "guest" : "public", initialState: buildGuestLegacyState(), verification: unrestrictedVerification };
    }
    redirect("/login?next=/central");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_game_verified,whatsapp_game_verified")
    .eq("id", user.id)
    .single<{ email_game_verified: boolean; whatsapp_game_verified: boolean }>();
  if (!profile) redirect("/error?reason=profile");

  const verification = {
    email: profile.email_game_verified,
    whatsapp: profile.whatsapp_game_verified,
  };
  if (options.requireVerification && !verification[options.requireVerification]) {
    const verificationPath = options.requireVerification === "email" ? "/verificar-email" : "/verificar-whatsapp";
    const nextPath = options.nextPath || (options.requireVerification === "email" ? "/imprensa" : "/escritorio");
    redirect(`${verificationPath}?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<ClubRecord>();

  if (!club) {
    if (options.requireClub === false) {
      return { mode: "authenticated", initialState: buildGuestLegacyState(), userEmail: user.email || undefined, verification };
    }
    redirect("/criar-clube");
  }

  const [{ data: releases }, { data: events }] = await Promise.all([
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

  return {
    mode: "authenticated",
    userEmail: user.email || undefined,
    verification,
    initialState: buildLegacyState(club, (releases || []) as PressReleaseRecord[], (events || []) as EventRecord[]),
  };
}
