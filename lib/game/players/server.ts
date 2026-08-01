import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, getApiAuthContext } from "@/lib/auth/api";
import { logServerError } from "@/lib/server/log";
import { generateFreeAgentMarket, generateInitialSquad } from "@/lib/game/players/engine";

type AdminClient = SupabaseClient;

export async function getPlayerGameContext() {
  const context = await getApiAuthContext();
  if (context.error) return { ok: false as const, error: context.error };
  const authenticated = context as Extract<typeof context, { user: unknown }>;
  const { data: club, error } = await authenticated.admin.from("clubs")
    .select("id,name,short_name,abbreviation,primary_color,secondary_color,accent_color,cash_balance,created_at")
    .eq("owner_id", authenticated.user.id).maybeSingle();
  if (error) {
    logServerError("players", "player_club_lookup_failed", error);
    return { ok: false as const, error: apiError("Nao foi possivel carregar o clube agora.", 503) };
  }
  return { ok: true as const, ...authenticated, club: club || null };
}

function flattenSeeds(seeds: ReturnType<typeof generateInitialSquad>) {
  return {
    players: seeds.map((seed) => seed.player),
    attributes: seeds.map((seed) => seed.attributes),
    hidden: seeds.map((seed) => seed.hidden),
    positions: seeds.flatMap((seed) => seed.positions),
    roles: seeds.flatMap((seed) => seed.roles),
    personality: seeds.flatMap((seed) => seed.personality),
    statuses: seeds.map((seed) => seed.status),
    contracts: seeds.flatMap((seed) => seed.contract ? [seed.contract] : []),
  };
}

async function insertGeneratedPlayers(admin: AdminClient, seeds: ReturnType<typeof generateInitialSquad>) {
  const rows = flattenSeeds(seeds);
  const operations = [
    admin.from("players").upsert(rows.players, { onConflict: "id", ignoreDuplicates: true }),
    admin.from("player_attributes").upsert(rows.attributes, { onConflict: "player_id", ignoreDuplicates: true }),
    admin.from("player_hidden_traits").upsert(rows.hidden, { onConflict: "player_id", ignoreDuplicates: true }),
    admin.from("player_position_aptitudes").upsert(rows.positions, { onConflict: "player_id,position", ignoreDuplicates: true }),
    admin.from("player_role_aptitudes").upsert(rows.roles, { onConflict: "player_id,role", ignoreDuplicates: true }),
    admin.from("player_personality_concepts").upsert(rows.personality, { onConflict: "player_id,concept", ignoreDuplicates: true }),
    admin.from("player_status").upsert(rows.statuses, { onConflict: "player_id", ignoreDuplicates: true }),
    ...(rows.contracts.length ? [admin.from("player_contracts").upsert(rows.contracts, { onConflict: "id", ignoreDuplicates: true })] : []),
  ];
  const [playerResult] = await Promise.all([operations[0]]);
  if (playerResult.error) throw playerResult.error;
  const results = await Promise.all(operations.slice(1));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function ensurePlayerWorld(admin: AdminClient, clubId: string) {
  try {
    await insertGeneratedPlayers(admin, generateInitialSquad(clubId));
    await insertGeneratedPlayers(admin, generateFreeAgentMarket());
  } catch (error) {
    logServerError("players", "player_world_generation_failed", error, { clubId });
    throw error;
  }
}

export async function buildSquadOverview(admin: AdminClient, clubId: string) {
  await ensurePlayerWorld(admin, clubId);
  const { data: players, error } = await admin.from("players")
    .select("id,first_name,last_name,known_as,birth_date,nationality,height_cm,weight_kg,preferred_foot,weak_foot_level,squad_number,main_position,status,squad_role,current_overall,public_potential_band,captain_rank,created_at")
    .eq("club_id", clubId).not("status", "in", "(retired,loaned_out)").order("squad_number");
  if (error) throw error;
  const ids = (players || []).map((player) => player.id);
  if (!ids.length) return { players: [], positionAptitudes: [], roleAptitudes: [] };
  const [statuses, contracts, positions, roles] = await Promise.all([
    admin.from("player_status").select("*").in("player_id", ids),
    admin.from("player_contracts").select("player_id,contract_start,contract_end,monthly_salary,squad_role_promised,status").in("player_id", ids).eq("status", "active"),
    admin.from("player_position_aptitudes").select("player_id,position,aptitude").in("player_id", ids),
    admin.from("player_role_aptitudes").select("player_id,role,aptitude").in("player_id", ids),
  ]);
  [statuses, contracts, positions, roles].forEach((result) => { if (result.error) throw result.error; });
  return {
    players: (players || []).map((player) => ({
      ...player,
      dynamic: statuses.data?.find((status) => status.player_id === player.id) || null,
      contract: contracts.data?.find((contract) => contract.player_id === player.id) || null,
      age: calculateAge(player.birth_date),
    })),
    positionAptitudes: positions.data || [],
    roleAptitudes: roles.data || [],
  };
}

export async function buildFreeAgentMarket(admin: AdminClient) {
  const { data, error } = await admin.from("players")
    .select("id,known_as,birth_date,nationality,preferred_foot,main_position,current_overall,public_potential_band")
    .eq("status", "free_agent").is("club_id", null).order("current_overall", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map((player) => ({ ...player, age: calculateAge(player.birth_date) }));
}

export async function buildPlayerProfile(admin: AdminClient, clubId: string, playerId: string) {
  await ensurePlayerWorld(admin, clubId);
  const { data: player, error } = await admin.from("players").select("*").eq("id", playerId).eq("club_id", clubId).maybeSingle();
  if (error || !player) return null;
  const [attributes, hidden, positions, roles, concepts, status, contracts, stats, history, training, injuries, suspensions, meetings, memories, relationships] = await Promise.all([
    admin.from("player_attributes").select("*").eq("player_id", playerId).maybeSingle(),
    admin.from("player_hidden_traits").select("*").eq("player_id", playerId).maybeSingle(),
    admin.from("player_position_aptitudes").select("position,aptitude,minutes_played,training_minutes").eq("player_id", playerId).order("aptitude", { ascending: false }),
    admin.from("player_role_aptitudes").select("role,aptitude,minutes_played,training_minutes").eq("player_id", playerId).order("aptitude", { ascending: false }),
    admin.from("player_personality_concepts").select("concept,level,is_core").eq("player_id", playerId),
    admin.from("player_status").select("*").eq("player_id", playerId).maybeSingle(),
    admin.from("player_contracts").select("*").eq("player_id", playerId).order("created_at", { ascending: false }),
    admin.from("player_season_stats").select("*").eq("player_id", playerId).order("season", { ascending: false }),
    admin.from("player_career_history").select("*").eq("player_id", playerId).order("season_start", { ascending: false }),
    admin.from("player_training_history").select("*").eq("player_id", playerId).order("training_date", { ascending: false }).limit(40),
    admin.from("player_injuries").select("id,injury_type,severity,occurred_at,estimated_return_at,actual_return_at,status,source").eq("player_id", playerId).order("occurred_at", { ascending: false }),
    admin.from("player_suspensions").select("*").eq("player_id", playerId).order("created_at", { ascending: false }),
    admin.from("player_meeting_results").select("classification,structured_reaction,created_at,meeting_id").eq("player_id", playerId).order("created_at", { ascending: false }).limit(20),
    admin.from("player_memories").select("memory_type,importance,emotional_weight,summary,status,deadline,created_at,expires_at").eq("player_id", playerId).order("created_at", { ascending: false }).limit(30),
    admin.from("player_relationships").select("target_type,target_id,affinity,trust,respect,conflict,influence").eq("player_id", playerId),
  ]);
  const hiddenData = hidden.data;
  const evidence = Math.min(100, 18 + (meetings.data?.length || 0) * 13 + (training.data?.length || 0) * 2);
  return {
    player: { ...player, age: calculateAge(player.birth_date) },
    attributes: attributes.data || null,
    positions: positions.data || [], roles: roles.data || [], status: status.data || null,
    contracts: contracts.data || [], stats: stats.data || [], history: history.data || [], training: training.data || [],
    injuries: injuries.data || [], suspensions: suspensions.data || [], meetings: meetings.data || [], memories: memories.data || [],
    relationships: relationships.data || [],
    personality: describePersonality(concepts.data || [], evidence),
    potentialEstimate: estimatePotential(player.current_overall, hiddenData?.potential_ceiling, evidence),
    developmentAssessment: developmentAssessment(Number(player.current_overall), hiddenData?.potential_ceiling, hiddenData?.development_consistency, evidence),
  };
}

function calculateAge(birthDate: string) {
  const birth = new Date(`${birthDate}T12:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

const PERSONALITY_LABELS: Record<string, string> = {
  ambition: "Ambicioso", loyalty: "Leal ao clube", stability: "Prefere estabilidade", recognition: "Busca reconhecimento",
  contention: "Questiona decisoes com facilidade", competitiveness: "Muito competitivo", professionalism: "Profissional",
  resilience: "Resiliente", discipline: "Disciplinado", sociability: "Sociavel", leadership: "Influencia o grupo",
  emotional_control: "Emocionalmente controlado", financial_interest: "Atento as condicoes financeiras", learning: "Aberto ao aprendizado",
};

function describePersonality(rows: Array<{ concept: string; level: number; is_core: boolean }>, evidence: number) {
  const visibleCount = evidence >= 65 ? 5 : evidence >= 35 ? 3 : 2;
  return rows.filter((row) => row.is_core || row.level >= 4).sort((a, b) => b.level - a.level).slice(0, visibleCount)
    .map((row) => PERSONALITY_LABELS[row.concept] || "Perfil ainda em observacao");
}

function estimatePotential(overall: number, ceiling: number | undefined, evidence: number) {
  if (ceiling == null) return "Ainda sem estimativa confiavel";
  const uncertainty = evidence < 35 ? 14 : evidence < 70 ? 9 : 5;
  const midpoint = Math.round((Number(ceiling) + Number(overall)) / 2);
  return `Estimativa da comissao: ${Math.max(0, midpoint - uncertainty)} a ${Math.min(100, midpoint + uncertainty)}`;
}

function developmentAssessment(overall: number, ceiling: number | undefined, consistency: number | undefined, evidence: number) {
  if (ceiling == null || consistency == null) return "A comissao ainda precisa observar o jogador.";
  const room = Number(ceiling) - overall;
  const trend = room > 16 ? "ha margem relevante de evolucao" : room > 7 ? "ha margem moderada de evolucao" : "o rendimento atual parece proximo do patamar esperado";
  const confidence = evidence >= 65 ? "A leitura possui boa confiabilidade." : "A leitura ainda possui margem de erro.";
  return `${trend.charAt(0).toUpperCase()}${trend.slice(1)}. ${confidence}`;
}
