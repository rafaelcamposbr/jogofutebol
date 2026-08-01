"use server";

import { authenticatedHomeDestination } from "@/lib/auth/navigation";
import { isMissingSessionError } from "@/lib/auth/navigation";
import { logServerError } from "@/lib/server/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clampText, makeClubHashtag } from "@/lib/text";

export type CreateClubState = {
  error?: string;
  next?: string;
};

async function uniqueHashtag(base: string, supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const cleanBase = base || "#clube";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = attempt === 0 ? cleanBase : `${cleanBase}${attempt + 1}`;
    const { data } = await supabase.from("public_club_profiles").select("id").eq("hashtag", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${cleanBase}${Date.now().toString(36)}`;
}

export async function createClubAction(_previous: CreateClubState, formData: FormData): Promise<CreateClubState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase nao configurado. Preencha as variaveis antes de criar clubes reais." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    if (userError && !isMissingSessionError(userError)) {
      logServerError("auth", "club_creation_session_lookup_failed", userError);
      return { error: "Nao foi possivel validar sua sessao agora. Tente novamente." };
    }
    return { error: "Sessao expirada. Entre novamente para criar o clube." };
  }

  const name = clampText(formData.get("name"), 120);
  const shortName = clampText(formData.get("shortName"), 60);
  const abbreviation = clampText(formData.get("abbreviation"), 4).toUpperCase();
  const city = clampText(formData.get("city"), 80);
  const state = clampText(formData.get("state"), 2).toUpperCase();
  const mascot = clampText(formData.get("mascot"), 60);
  const legalModel = formData.get("legalModel") === "saf" ? "saf" : "association";
  const primaryColor = clampText(formData.get("primaryColor"), 16) || "#0b7a53";
  const secondaryColor = clampText(formData.get("secondaryColor"), 16) || "#ffffff";
  const accentColor = clampText(formData.get("accentColor"), 16) || "#d8a21a";

  if (!name || !shortName || !abbreviation || !city || state.length !== 2) {
    return { error: "Preencha nome, nome curto, sigla, cidade e UF." };
  }

  const { data: existingClub, error: existingClubError } = await supabase.from("clubs").select("id").eq("owner_id", user.id).maybeSingle();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("whatsapp_game_verified")
    .eq("id", user.id)
    .maybeSingle<{ whatsapp_game_verified: boolean }>();
  if (existingClubError || profileError) {
    logServerError("navigation", "club_creation_context_failed", existingClubError || profileError);
    return { error: "Nao foi possivel carregar seu cadastro agora. Tente novamente." };
  }
  const destination = authenticatedHomeDestination({
    hasClub: true,
    whatsappVerified: Boolean(profile?.whatsapp_game_verified),
  });
  if (existingClub) return { next: destination };

  let clubId: string | null = null;
  for (let attempt = 0; attempt < 3 && !clubId; attempt += 1) {
    const hashtag = await uniqueHashtag(makeClubHashtag(shortName), supabase);
    const { data, error } = await supabase.rpc("create_club_with_foundation", {
      p_name: name,
      p_short_name: shortName,
      p_abbreviation: abbreviation,
      p_hashtag: hashtag,
      p_city: city,
      p_state: state,
      p_legal_model: legalModel,
      p_primary_color: primaryColor,
      p_secondary_color: secondaryColor,
      p_accent_color: accentColor,
      p_mascot: mascot || null,
    });

    if (!error && typeof data === "string") {
      clubId = data;
      break;
    }
    if (error?.code !== "23505") return { error: "Nao foi possivel criar o clube." };
  }

  if (!clubId) return { error: "Nao foi possivel reservar a identificacao publica do clube." };

  return { next: destination };
}
