import { redirect } from "next/navigation";
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
  if (!supabase) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,username,username_normalized,first_name,last_name,email,whatsapp,whatsapp_normalized,email_game_verified,whatsapp_game_verified,email_verified_at,whatsapp_verified_at,created_at",
    )
    .eq("id", userData.user.id)
    .single<GameProfile>();

  if (!profile) redirect("/error?reason=profile");
  return { supabase, user: userData.user, profile };
}
