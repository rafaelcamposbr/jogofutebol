import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, getApiAuthContext } from "@/lib/auth/api";
import { getPlayerGameContext, insertGeneratedPlayers } from "@/lib/game/players/server";
import { generateTryoutCandidates, type TryoutPreferences } from "@/lib/game/scouting/engine";
import { createAdvisorMessage } from "@/lib/staff/server";

type AdminClient = SupabaseClient;

export async function getScoutingContext() {
  return getPlayerGameContext();
}

export async function listScouts(admin: AdminClient, clubId: string) {
  const { data, error } = await admin.from("employees")
    .select("id,name,role_id,role_label,status,aptitudes,natural_talents,temporary_modifiers")
    .eq("club_id", clubId).eq("role_id", "scout").eq("status", "active").order("name");
  if (error) throw error;
  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    roleLabel: item.role_label,
    quality: scoutQuality(item),
  }));
}

export async function listTryouts(admin: AdminClient, ownerId: string, clubId: string) {
  await processDueTryouts(admin, ownerId, clubId);
  const { data, error } = await admin.from("tryouts")
    .select("id,scout_employee_id,preparation_days,cost_cents,focus,status,scout_quality,preparation_quality,selection_quality,candidate_count,started_at,completes_at,completed_at")
    .eq("club_id", clubId).order("created_at", { ascending: false }).limit(40);
  if (error) throw error;
  const scouts = await listScouts(admin, clubId);
  return (data || []).map((item) => ({ ...item, scoutName: scouts.find((scout) => scout.id === item.scout_employee_id)?.name || "Olheiro desligado" }));
}

export async function getTryoutDetail(admin: AdminClient, ownerId: string, clubId: string, tryoutId: string) {
  await processDueTryouts(admin, ownerId, clubId, tryoutId);
  const { data: tryout, error } = await admin.from("tryouts")
    .select("id,scout_employee_id,preparation_days,cost_cents,focus,status,scout_quality,preparation_quality,selection_quality,candidate_count,started_at,completes_at,completed_at")
    .eq("id", tryoutId).eq("club_id", clubId).maybeSingle();
  if (error) throw error;
  if (!tryout) return null;
  const [{ data: preferences }, { data: candidates }, scouts] = await Promise.all([
    admin.from("tryout_preferences").select("age_min,age_max,positions,region,max_per_position,focus,scout_comments").eq("tryout_id", tryoutId).maybeSingle(),
    admin.from("tryout_candidates").select("id,player_id,estimated_position,observed_profile,confidence,recommendation,status,trial_available_until,created_at").eq("tryout_id", tryoutId).order("confidence", { ascending: false }),
    listScouts(admin, clubId),
  ]);
  const playerIds = (candidates || []).map((item) => item.player_id);
  const { data: players } = playerIds.length
    ? await admin.from("players").select("id,known_as,birth_date,nationality,height_cm,weight_kg,preferred_foot").in("id", playerIds)
    : { data: [] as Array<Record<string, unknown>> };
  return {
    ...tryout,
    scoutName: scouts.find((scout) => scout.id === tryout.scout_employee_id)?.name || "Olheiro desligado",
    preferences,
    candidates: (candidates || []).map((candidate) => ({
      ...candidate,
      player: players?.find((player) => player.id === candidate.player_id) || null,
    })),
  };
}

export async function startTryout(input: { scoutId: string; days: number; preferences: TryoutPreferences }) {
  const context = await getApiAuthContext();
  if (context.error) return { ok: false as const, error: context.error };
  const { data: club, error: clubError } = await context.admin.from("clubs").select("id").eq("owner_id", context.user.id).maybeSingle();
  if (clubError || !club) return { ok: false as const, error: apiError("Clube nao encontrado.", 409) };
  const { data, error } = await context.admin.rpc("start_club_tryout", {
    p_user_id: context.user.id,
    p_scout_id: input.scoutId,
    p_days: input.days,
    p_preferences: input.preferences,
  });
  if (error) return { ok: false as const, error: mapTryoutError(error.message) };
  return { ok: true as const, id: String(data), context, clubId: club.id };
}

export async function processDueTryouts(admin: AdminClient, ownerId: string, clubId: string, requestedId?: string) {
  const now = new Date().toISOString();
  let query = admin.from("tryouts").select("*").eq("club_id", clubId).in("status", ["preparing", "processing"]);
  if (requestedId) query = query.eq("id", requestedId);
  const { data: rows, error } = await query;
  if (error) throw error;
  for (const initial of rows || []) {
    if (initial.status === "preparing" && new Date(initial.completes_at).getTime() > Date.now()) continue;
    let tryout = initial;
    if (initial.status === "preparing") {
      const claimed = await admin.rpc("claim_due_tryout", { p_user_id: ownerId, p_tryout_id: initial.id, p_now: now });
      if (claimed.error || !claimed.data) continue;
      tryout = claimed.data;
    }
    const { data: preference } = await admin.from("tryout_preferences").select("*").eq("tryout_id", tryout.id).maybeSingle();
    if (!preference) {
      await admin.from("tryouts").update({ status: "failed", updated_at: now }).eq("id", tryout.id);
      continue;
    }
    const preferences: TryoutPreferences = {
      ageMin: Number(preference.age_min), ageMax: Number(preference.age_max),
      positions: preference.positions || [], maxPerPosition: Number(preference.max_per_position),
      focus: preference.focus, region: preference.region || undefined, comments: preference.scout_comments || undefined,
    };
    const generated = generateTryoutCandidates({
      tryoutId: tryout.id,
      days: Number(tryout.preparation_days),
      scoutQuality: Number(tryout.scout_quality),
      preferences,
      today: now,
    });
    await insertGeneratedPlayers(admin, generated.map((item) => item.generated));
    const candidateRows = generated.map((item) => ({
      tryout_id: tryout.id,
      player_id: item.generated.player.id,
      estimated_position: item.candidate.estimatedPosition,
      observed_profile: item.candidate.observedProfile,
      confidence: item.candidate.confidence,
      recommendation: item.candidate.recommendation,
      trial_available_until: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    }));
    const candidateResult = await admin.from("tryout_candidates").upsert(candidateRows, { onConflict: "player_id", ignoreDuplicates: true });
    if (candidateResult.error) throw candidateResult.error;
    await admin.from("tryouts").update({ status: "completed", candidate_count: generated.length, completed_at: now, updated_at: now }).eq("id", tryout.id).eq("status", "processing");
    await createAdvisorMessage(admin, {
      clubId, employeeId: tryout.scout_employee_id, eventType: "tryout_completed", relatedEntityType: "tryout", relatedEntityId: tryout.id,
      priority: "high", tone: "information", title: "Peneira concluida", message: `${generated.length} candidatos estao disponiveis para avaliacao.`,
      recommendation: "Revise os relatorios e use contrato de teste antes de negociar um vinculo profissional.",
    });
  }
}

export async function startTrial(candidateId: string) {
  const context = await getApiAuthContext();
  if (context.error) return { ok: false as const, error: context.error };
  const { data, error } = await context.admin.rpc("start_player_trial", { p_user_id: context.user.id, p_candidate_id: candidateId });
  if (error) return { ok: false as const, error: apiError(error.message.includes("unavailable") ? "Este candidato nao esta mais disponivel para teste." : "Nao foi possivel iniciar o contrato de teste.", 409) };
  return { ok: true as const, contractId: String(data) };
}

function scoutQuality(employee: Record<string, any>) {
  return Math.round(Math.max(0, Math.min(100, Number(employee.aptitudes?.scouting || 50) + Number(employee.natural_talents?.scouting || 0) + Number(employee.temporary_modifiers?.scouting || 0))));
}

function mapTryoutError(message: string) {
  if (message.includes("active_scout_required")) return apiError("Contrate um olheiro ativo para organizar a peneira.", 409);
  if (message.includes("scout_already_assigned")) return apiError("Este olheiro ja esta preparando outra peneira.", 409);
  if (message.includes("insufficient_funds")) return apiError("O clube nao possui saldo para o custo fixo da peneira.", 409);
  if (message.includes("club_unavailable")) return apiError("Novas obrigacoes financeiras estao bloqueadas para este clube.", 409);
  return apiError("Nao foi possivel iniciar a peneira.", 422);
}
