"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clampText, makeClubHashtag } from "@/lib/text";

export type CreateClubState = {
  error?: string;
};

async function uniqueHashtag(base: string, supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const cleanBase = base || "#clube";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = attempt === 0 ? cleanBase : `${cleanBase}${attempt + 1}`;
    const { data } = await supabase.from("clubs").select("id").eq("hashtag", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${cleanBase}${Date.now().toString(36)}`;
}

export async function createClubAction(_previous: CreateClubState, formData: FormData): Promise<CreateClubState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase nao configurado. Preencha as variaveis antes de criar clubes reais." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { error: "Sessao expirada. Entre novamente para criar o clube." };

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

  const { data: existingClub } = await supabase.from("clubs").select("id").eq("owner_id", user.id).maybeSingle();
  if (existingClub) redirect("/central");

  const hashtag = await uniqueHashtag(makeClubHashtag(shortName), supabase);
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      owner_id: user.id,
      name,
      short_name: shortName,
      abbreviation,
      hashtag,
      city,
      state,
      legal_model: legalModel,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      mascot,
      cash_balance: 0,
      institutional_reputation: 1,
      financial_reputation: 1,
      sporting_reputation: 0.5,
    })
    .select("id")
    .single();

  if (clubError || !club) return { error: clubError?.message || "Nao foi possivel criar o clube." };

  await Promise.all([
    supabase.from("club_members").insert({ club_id: club.id, user_id: user.id, role: "owner" }),
    supabase.from("events").insert({
      club_id: club.id,
      type: "foundation",
      title: "Clube fundado",
      description: `${name} foi fundado na beta online.`,
      starts_at: new Date().toISOString(),
      status: "completed",
      financial_impact: 0,
    }),
  ]);

  redirect("/central");
}
