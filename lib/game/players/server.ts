import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, getApiAuthContext } from "@/lib/auth/api";
import { logServerError } from "@/lib/server/log";
import { generateFreeAgentMarket, generateInitialSquad } from "@/lib/game/players/engine";
import { ensurePlayerRelationships } from "@/lib/game/relationships/server";

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

export async function insertGeneratedPlayers(admin: AdminClient, seeds: ReturnType<typeof generateInitialSquad>) {
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

export async function buildSquadOverview(admin: AdminClient, clubId: string, options: { internalEvaluation?: boolean } = {}) {
  await ensurePlayerWorld(admin, clubId);
  const { data: players, error } = await admin.from("players")
    .select("id,first_name,last_name,known_as,birth_date,nationality,height_cm,weight_kg,preferred_foot,weak_foot_level,squad_number,main_position,status,squad_role,current_overall,public_potential_band,captain_rank,created_at")
    .eq("club_id", clubId).not("status", "in", "(retired,loaned_out)").order("squad_number");
  if (error) throw error;
  const ids = (players || []).map((player) => player.id);
  if (!ids.length) return { players: [], positionAptitudes: [], roleAptitudes: [] };
  const [statuses, contracts, positions, roles, consensus] = await Promise.all([
    admin.from("player_status").select("*").in("player_id", ids),
    admin.from("player_contracts").select("player_id,contract_start,contract_end,monthly_salary,squad_role_promised,status").in("player_id", ids).eq("status", "active"),
    admin.from("player_position_aptitudes").select("player_id,position,aptitude").in("player_id", ids),
    admin.from("player_role_aptitudes").select("player_id,role,aptitude").in("player_id", ids),
    admin.from("player_report_consensus").select("player_id,category,consensus_label,confidence").eq("club_id", clubId).in("player_id", ids),
  ]);
  [statuses, contracts, positions, roles, consensus].forEach((result) => { if (result.error) throw result.error; });
  return {
    players: (players || []).map((player) => {
      const { current_overall, weak_foot_level, ...safePlayer } = player;
      return {
        ...safePlayer,
        ...(options.internalEvaluation ? { current_overall, weak_foot_level } : {}),
        observed_level: consensus.data?.find((item) => item.player_id === player.id && item.category === "technical")?.consensus_label || "Sem relatorio",
        dynamic: statuses.data?.find((status) => status.player_id === player.id) || null,
        contract: contracts.data?.find((contract) => contract.player_id === player.id) || null,
        age: calculateAge(player.birth_date),
      };
    }),
    positionAptitudes: options.internalEvaluation ? positions.data || [] : [],
    roleAptitudes: options.internalEvaluation ? roles.data || [] : [],
  };
}

export async function buildFreeAgentMarket(admin: AdminClient) {
  const { data, error } = await admin.from("players")
    .select("id,known_as,birth_date,nationality,preferred_foot,main_position,current_overall,public_potential_band")
    .eq("status", "free_agent").is("club_id", null).order("current_overall", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map((player) => {
    const { current_overall, ...safePlayer } = player;
    void current_overall;
    return { ...safePlayer, age: calculateAge(player.birth_date), observed_level: "Sem relatorio do clube" };
  });
}

export async function buildPlayerProfile(admin: AdminClient, clubId: string, playerId: string) {
  await ensurePlayerWorld(admin, clubId);
  const { data: player, error } = await admin.from("players").select("*").eq("id", playerId).eq("club_id", clubId).maybeSingle();
  if (error || !player) return null;
  await ensurePlayerRelationships(admin, clubId, playerId);
  const [positions, roles, concepts, status, contracts, stats, history, training, injuries, suspensions, meetings, memories, relationships, reports, consensus, authors] = await Promise.all([
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
    admin.from("character_relationships").select("source_type,source_id,affinity,trust,respect,tension,professional_alignment,influence").eq("club_id", clubId).eq("target_type", "player").eq("target_id", playerId),
    admin.from("player_reports").select("id,author_name,author_role,report_version,precision,uncertainty,confidence_label,age_status,summary,caveats,recommendation,created_at,valid_until").eq("club_id", clubId).eq("player_id", playerId).order("created_at", { ascending: false }),
    admin.from("player_report_consensus").select("category,consensus_label,lower_bound,upper_bound,confidence,divergence,updated_at").eq("club_id", clubId).eq("player_id", playerId),
    admin.from("employees").select("id,name,role_label,role_id").eq("club_id", clubId).eq("status", "active").in("role_id", ["scout","performance-analyst","performance-analysis-coordinator","head-coach"]),
  ]);
  const evidence = Math.min(100, 18 + (meetings.data?.length || 0) * 13 + (training.data?.length || 0) * 2);
  const reportIds = (reports.data || []).map((item) => item.id);
  const { data: reportEstimates } = reportIds.length
    ? await admin.from("player_report_estimates").select("report_id,category,estimate_label,lower_bound,upper_bound").in("report_id", reportIds)
    : { data: [] as Array<Record<string, unknown>> };
  const { current_overall, weak_foot_level, ...safePlayer } = player;
  void current_overall; void weak_foot_level;
  return {
    player: { ...safePlayer, age: calculateAge(player.birth_date) },
    positions: (positions.data || []).map((item) => ({ position: item.position, assessment: aptitudeBand(Number(item.aptitude)) })),
    roles: (roles.data || []).map((item) => ({ role: item.role, assessment: aptitudeBand(Number(item.aptitude)) })), status: status.data || null,
    contracts: contracts.data || [], stats: stats.data || [], history: history.data || [], training: training.data || [],
    injuries: injuries.data || [], suspensions: suspensions.data || [], meetings: meetings.data || [], memories: memories.data || [],
    relationships: (relationships.data || []).map((item) => ({ target_type: item.source_type, target_id: item.source_id, affinity: relationshipBand(Number(item.affinity)), trust: relationshipBand(Number(item.trust)), respect: relationshipBand(Number(item.respect)), tension: relationshipBand(Number(item.tension)) })),
    personality: describePersonality(concepts.data || [], evidence),
    reports: (reports.data || []).map((report) => ({ ...report, estimates: (reportEstimates || []).filter((item) => item.report_id === report.id) })), consensus: consensus.data || [], reportAuthors: authors.data || [],
    potentialEstimate: consensus.data?.find((item) => item.category === "potential") ? "Consulte o consenso dos relatorios." : "Ainda sem estimativa documentada.",
    developmentAssessment: reports.data?.[0]?.recommendation || "A comissao ainda precisa observar o jogador.",
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

function aptitudeBand(value: number) { return value >= 80 ? "Muito natural" : value >= 65 ? "Confortavel" : value >= 50 ? "Funcional" : value >= 35 ? "Em adaptacao" : "Pouco indicado"; }
function relationshipBand(value: number) { return value >= 75 ? "Muito alta" : value >= 60 ? "Boa" : value >= 40 ? "Estavel" : value >= 25 ? "Baixa" : "Critica"; }
