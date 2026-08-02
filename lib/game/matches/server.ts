import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { clamp, createSeededRandom, deterministicUuid } from "@/lib/game/random";
import { simulateMatch } from "@/lib/game/matches/engine";
import {
  applyPostMatchConsequences,
  buildPostMatchPresentation,
  buildPreMatchAdvice,
  type MatchPresentation,
  type MatchStaffProfile,
} from "@/lib/game/matches/reports";
import type {
  CoachingProfile,
  MatchInput,
  MatchPlayer,
  MatchPublicView,
  MatchReportView,
  MatchSimulation,
  MatchStaffOption,
  MatchStatus,
  PlayerStats,
  PreMatchPlan,
  StaffAssignmentArea,
  StaffAssignments,
  TeamSide,
} from "@/lib/game/matches/types";
import { buildTacticalSetup } from "@/lib/game/tactics/server";

type AdminClient = SupabaseClient;
type JsonRecord = Record<string, unknown>;
type StoredSnapshot = {
  input: MatchInput;
  sealedSimulation?: MatchSimulation;
  presentation?: MatchPresentation;
  staff?: MatchStaffProfile[];
  preparedAt?: string;
};

const MATCH_DURATION_MINUTES = 105;
const STAFF_ASSIGNMENT_AREAS: StaffAssignmentArea[] = ["technical", "physical", "medical", "psychological", "goalkeeping"];

export const DEFAULT_PRE_MATCH_PLAN: PreMatchPlan = {
  decisionMode: "shared",
  initialMentality: "balanced",
  offensiveWhenTrailingAfter: 60,
  protectLeadAfter: 75,
  protectBelowReadiness: 55,
  withdrawBookedAggressive: true,
  prioritizeYoungWhenComfortable: true,
  unavailablePlayerIds: [],
};

const ROLE_AREAS: Record<string, StaffAssignmentArea[]> = {
  "head-coach": ["technical"],
  "assistant-coach": ["technical"],
  "performance-analysis-coordinator": ["technical"],
  "performance-analyst": ["technical"],
  "fitness-coach": ["physical"],
  physiologist: ["physical"],
  doctor: ["medical"],
  "physiotherapy-coordinator": ["medical"],
  physiotherapist: ["medical"],
  psychologist: ["psychological"],
  "goalkeeper-coach": ["goalkeeping"],
};

const APTITUDE_KEYS: Record<string, string[]> = {
  "head-coach": ["tactics", "coaching", "leadership", "match_management", "technical"],
  "assistant-coach": ["tactics", "coaching", "leadership", "analysis"],
  "performance-analysis-coordinator": ["analysis", "performance_analysis", "data", "scouting"],
  "performance-analyst": ["analysis", "performance_analysis", "data", "scouting"],
  "fitness-coach": ["physical", "fitness", "conditioning"],
  physiologist: ["physiology", "physical", "fitness"],
  doctor: ["medical", "medicine", "diagnosis"],
  "physiotherapy-coordinator": ["physiotherapy", "medical", "recovery"],
  physiotherapist: ["physiotherapy", "medical", "recovery"],
  psychologist: ["psychology", "morale", "communication"],
  "goalkeeper-coach": ["goalkeeping", "technical", "coaching"],
};

function mean(record: Record<string, number>, keys: string[]) {
  return keys.reduce((sum, key) => sum + Number(record[key] || 0), 0) / Math.max(1, keys.length);
}

function yearsOld(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.max(15, Math.floor((Date.now() - date.getTime()) / 31_556_952_000));
}

function playerModel(player: JsonRecord, assignment: JsonRecord, attributes: JsonRecord, status?: JsonRecord): MatchPlayer {
  const technical = (attributes.technical || {}) as Record<string, number>;
  const mental = (attributes.mental || {}) as Record<string, number>;
  const physical = (attributes.physical || {}) as Record<string, number>;
  const goalkeeping = (attributes.goalkeeping || {}) as Record<string, number>;
  return {
    id: String(player.id),
    name: String(player.known_as),
    position: String(assignment.position || player.main_position),
    role: String(assignment.role || "support"),
    overall: Number(player.current_overall || 45),
    attack: mean(technical, ["finishing", "control", "dribbling", "first_touch", "heading", "long_shots"]),
    creation: mean(technical, ["short_passing", "long_passing", "crossing", "control"]) * 0.58 + mean(mental, ["decisions", "vision", "creativity", "teamwork"]) * 0.42,
    defense: mean(technical, ["tackling", "marking"]) * 0.46 + mean(mental, ["positioning", "anticipation", "concentration", "tactical_discipline"]) * 0.54,
    physical: mean(physical, ["acceleration", "pace", "strength", "stamina", "agility", "recovery"]),
    discipline: mean(mental, ["decisions", "tactical_discipline", "emotional_control", "composure"]),
    goalkeeper: mean(goalkeeping, Object.keys(goalkeeping)),
    condition: Number(status?.physical_condition || 90),
    fatigue: Number(status?.fatigue || 8),
    age: yearsOld(player.date_of_birth),
    isStarter: assignment.is_starter !== false,
  };
}

function buildTechnicalOpponent(seed: string, strength: number): MatchPlayer[] {
  const positions = ["GK", "LB", "CB", "CB", "RB", "DM", "CM", "CM", "LW", "RW", "ST", "GK", "CB", "LB", "RB", "CM", "AM", "ST"];
  return positions.map((position, index) => {
    const random = createSeededRandom(`${seed}:opponent:${index}`);
    const overall = clamp(strength + random.int(-10, 9), 42, 82);
    return { id: `qa-opponent-${index + 1}`, name: `Adversario ${index + 1}`, position, role: position === "GK" ? "defensive_goalkeeper" : "balanced", overall, attack: clamp(overall + random.int(-8, 8)), creation: clamp(overall + random.int(-8, 8)), defense: clamp(overall + random.int(-8, 8)), physical: clamp(overall + random.int(-8, 8)), discipline: clamp(overall + random.int(-12, 8)), goalkeeper: position === "GK" ? clamp(overall + random.int(-5, 8)) : 5, condition: random.int(87, 100), fatigue: random.int(2, 12), age: random.int(19, 32), isStarter: index < 11 };
  });
}

async function captureHomeTeam(admin: AdminClient, ownerId: string, club: { id: string; name: string }) {
  const setup = await buildTacticalSetup(admin, ownerId, club.id);
  if (!setup.lineup) throw new Error("lineup_missing");
  const playerIds = setup.assignments.map((item) => item.player_id);
  const [playersResult, attributeResult, statusResult] = await Promise.all([
    admin.from("players").select("id,known_as,main_position,current_overall,date_of_birth").in("id", playerIds),
    admin.from("player_attributes").select("*").in("player_id", playerIds),
    admin.from("player_status").select("*").in("player_id", playerIds),
  ]);
  const firstError = playersResult.error || attributeResult.error || statusResult.error;
  if (firstError) throw firstError;
  const players = setup.assignments.map((assignment) => {
    const player = playersResult.data?.find((item) => item.id === assignment.player_id) as JsonRecord;
    const attributes = attributeResult.data?.find((item) => item.player_id === assignment.player_id) as JsonRecord;
    const status = statusResult.data?.find((item) => item.player_id === assignment.player_id) as JsonRecord | undefined;
    return playerModel(player, assignment, attributes, status);
  });
  return { setup, players };
}

export async function createQaMatch(admin: AdminClient, ownerId: string, club: { id: string; name: string }) {
  const { setup, players } = await captureHomeTeam(admin, ownerId, club);
  const seed = `qa-${randomUUID()}`;
  const averageOverall = players.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, players.length);
  const input: MatchInput = {
    seed,
    version: "v1",
    commands: [],
    home: { side: "home", name: club.name, formation: setup.tactic.formation, mentality: setup.tactic.mentality, players },
    away: { side: "away", name: "Selecao Tecnica QA", formation: "4-3-3", mentality: "balanced", players: buildTechnicalOpponent(seed, averageOverall) },
  };
  const matchId = randomUUID();
  const { error } = await admin.from("matches").insert({
    id: matchId,
    owner_id: ownerId,
    club_id: club.id,
    match_type: "qa",
    competition: "Laboratorio Beta",
    seed,
    simulation_version: "v1",
    status: "ready",
    home_club_id: club.id,
    home_tactic_id: setup.tactic.id,
    home_lineup_id: setup.lineup.id,
    opponent_name: input.away.name,
    opponent_context: { temporary: true, formation: input.away.formation, generatedPlayers: input.away.players.length },
    speed: 1,
    venue: "Centro de simulacao do clube",
    round_label: "Teste isolado",
    pre_match_plan: DEFAULT_PRE_MATCH_PLAN,
    staff_assignments: {},
  });
  if (error) throw error;
  const stateResult = await admin.from("match_states").insert({ match_id: matchId, owner_id: ownerId, snapshot: { input }, version: 0 });
  if (stateResult.error) throw stateResult.error;
  return matchId;
}

function sanitizePlan(value: unknown): PreMatchPlan {
  const input = value && typeof value === "object" ? value as JsonRecord : {};
  const mode = ["manager", "shared", "delegated"].includes(String(input.decisionMode)) ? String(input.decisionMode) as PreMatchPlan["decisionMode"] : DEFAULT_PRE_MATCH_PLAN.decisionMode;
  const mentality = ["very_defensive", "defensive", "balanced", "attacking", "very_attacking"].includes(String(input.initialMentality)) ? String(input.initialMentality) as PreMatchPlan["initialMentality"] : DEFAULT_PRE_MATCH_PLAN.initialMentality;
  const integer = (key: string, fallback: number, minimum: number, maximum: number) => Math.round(clamp(Number(input[key] ?? fallback), minimum, maximum));
  return {
    decisionMode: mode,
    initialMentality: mentality,
    offensiveWhenTrailingAfter: integer("offensiveWhenTrailingAfter", 60, 45, 85),
    protectLeadAfter: integer("protectLeadAfter", 75, 55, 88),
    protectBelowReadiness: integer("protectBelowReadiness", 55, 35, 75),
    withdrawBookedAggressive: input.withdrawBookedAggressive !== false,
    prioritizeYoungWhenComfortable: input.prioritizeYoungWhenComfortable !== false,
    unavailablePlayerIds: Array.isArray(input.unavailablePlayerIds) ? input.unavailablePlayerIds.slice(0, 10).map(String) : [],
  };
}

function sanitizeAssignments(value: unknown): StaffAssignments {
  const input = value && typeof value === "object" ? value as JsonRecord : {};
  return Object.fromEntries(STAFF_ASSIGNMENT_AREAS.map((area) => {
    const ids = Array.isArray(input[area]) ? [...new Set((input[area] as unknown[]).map(String))].slice(0, 4) : [];
    return [area, ids];
  })) as StaffAssignments;
}

async function staffOptions(admin: AdminClient, clubId: string): Promise<MatchStaffOption[]> {
  const { data, error } = await admin.from("employees").select("id,name,role_id,role_label,status").eq("club_id", clubId).eq("status", "active").order("name");
  if (error) throw error;
  return (data || []).flatMap((employee) => {
    const areas = ROLE_AREAS[employee.role_id] || [];
    return areas.length ? [{ id: employee.id, name: employee.name, roleId: employee.role_id, roleLabel: employee.role_label, areas }] : [];
  });
}

export async function saveMatchPreparation(admin: AdminClient, ownerId: string, matchId: string, value: { plan?: unknown; assignments?: unknown }) {
  const { data: match, error } = await admin.from("matches").select("id,club_id,status").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match) return { ok: false, message: "Partida nao encontrada." };
  if (!["draft", "ready"].includes(match.status)) return { ok: false, message: "As decisoes foram bloqueadas quando a partida comecou." };
  const plan = sanitizePlan(value.plan);
  const assignments = sanitizeAssignments(value.assignments);
  const options = await staffOptions(admin, match.club_id);
  const optionMap = new Map(options.map((option) => [option.id, option]));
  for (const [area, ids] of Object.entries(assignments)) {
    for (const id of ids || []) {
      if (!optionMap.get(id)?.areas.includes(area as StaffAssignmentArea)) return { ok: false, message: "Um profissional foi designado fora de sua competencia." };
    }
  }
  const result = await admin.from("matches").update({ pre_match_plan: plan, staff_assignments: assignments }).eq("id", matchId).eq("owner_id", ownerId).in("status", ["draft", "ready"]);
  return result.error ? { ok: false, message: "Nao foi possivel salvar a preparacao." } : { ok: true };
}

async function loadSnapshot(admin: AdminClient, matchId: string): Promise<StoredSnapshot> {
  const { data, error } = await admin.from("match_states").select("snapshot").eq("match_id", matchId).single();
  if (error) throw error;
  return data.snapshot as StoredSnapshot;
}

function aptitudeFor(employee: JsonRecord) {
  const aptitudes = (employee.aptitudes || {}) as Record<string, number>;
  const talents = (employee.natural_talents || {}) as Record<string, number>;
  const modifiers = (employee.temporary_modifiers || {}) as Record<string, number>;
  const keys = APTITUDE_KEYS[String(employee.role_id)] || Object.keys(aptitudes);
  const values = keys.map((key) => Number(aptitudes[key] || 0) + Number(talents[key] || 0) + Number(modifiers[key] || 0)).filter((value) => value > 0);
  const fallback = Object.values(aptitudes).map(Number).filter(Number.isFinite);
  return clamp((values.length ? values : fallback).reduce((sum, value) => sum + value, 0) / Math.max(1, (values.length ? values : fallback).length) || 35, 0, 100);
}

async function buildStaffProfiles(admin: AdminClient, clubId: string, assignments: StaffAssignments): Promise<MatchStaffProfile[]> {
  const areaByEmployee = new Map<string, StaffAssignmentArea>();
  Object.entries(assignments).forEach(([area, ids]) => (ids || []).forEach((id) => areaByEmployee.set(id, area as StaffAssignmentArea)));
  const ids = [...areaByEmployee.keys()];
  if (!ids.length) return [];
  const [employeesResult, statusResult, coursesResult, roomsResult] = await Promise.all([
    admin.from("employees").select("id,name,role_id,role_label,status,experience_years,aptitudes,natural_talents,temporary_modifiers,autonomy_level,hired_at").eq("club_id", clubId).eq("status", "active").in("id", ids),
    admin.from("employee_status").select("employee_id,satisfaction_score,trust_in_leadership,professional_morale,workload").in("employee_id", ids),
    admin.from("employee_courses").select("employee_id,status").in("employee_id", ids).eq("status", "completed"),
    admin.from("room_operations").select("id,status").eq("club_id", clubId).eq("status", "completed"),
  ]);
  const firstError = employeesResult.error || statusResult.error || coursesResult.error || roomsResult.error;
  if (firstError) throw firstError;
  const facilityQuality = clamp(45 + (roomsResult.data?.length || 0) * 5, 35, 80);
  const analyst = (employeesResult.data || []).filter((item) => ["performance-analyst", "performance-analysis-coordinator"].includes(item.role_id)).sort((first, second) => aptitudeFor(second) - aptitudeFor(first))[0];
  const sharedDataQuality = analyst ? clamp(45 + aptitudeFor(analyst) * 0.45, 45, 90) : 42;
  return (employeesResult.data || []).flatMap((employee) => {
    const area = areaByEmployee.get(employee.id);
    if (!area || !(ROLE_AREAS[employee.role_id] || []).includes(area)) return [];
    const status = statusResult.data?.find((item) => item.employee_id === employee.id);
    const hiredAt = new Date(employee.hired_at || Date.now()).getTime();
    const daysAtClub = Math.max(0, (Date.now() - hiredAt) / 86_400_000);
    const familiarity = clamp(25 + Number(employee.experience_years || 0) * 1.2 + Math.min(35, daysAtClub / 10), 10, 95);
    return [{
      id: employee.id,
      name: employee.name,
      roleId: employee.role_id,
      roleLabel: employee.role_label,
      area,
      functionalAptitude: aptitudeFor(employee),
      experience: Number(employee.experience_years || 0),
      familiarity,
      facilitiesQuality: facilityQuality,
      dataQuality: sharedDataQuality,
      satisfaction: Number(status?.satisfaction_score || 60),
      workload: Number(status?.workload || 50),
      relationship: Number(status?.trust_in_leadership || 55),
      relevantCourses: coursesResult.data?.filter((course) => course.employee_id === employee.id).length || 0,
    }];
  });
}

function coachingProfile(staff: MatchStaffProfile[]): CoachingProfile {
  const coach = staff.filter((item) => ["head-coach", "assistant-coach"].includes(item.roleId)).sort((first, second) => second.functionalAptitude - first.functionalAptitude)[0];
  const assistant = staff.find((item) => item.roleId === "assistant-coach");
  return {
    aptitude: coach?.functionalAptitude || 35,
    assistantAptitude: assistant?.functionalAptitude || 30,
    autonomy: coach ? clamp(40 + coach.experience * 2, 30, 90) : 45,
    relationship: coach?.relationship || 50,
    tacticalFamiliarity: coach?.familiarity || 35,
    adaptability: coach ? clamp(coach.functionalAptitude * 0.7 + coach.experience, 20, 95) : 35,
    caution: coach ? clamp(65 - coach.functionalAptitude * 0.15, 25, 75) : 55,
  };
}

export async function startMatch(admin: AdminClient, ownerId: string, matchId: string) {
  const { data: match, error } = await admin.from("matches").select("id,club_id,status,lock_version,pre_match_plan,staff_assignments").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match || !["draft", "ready"].includes(match.status)) return false;
  const { data: club } = await admin.from("clubs").select("id,name").eq("id", match.club_id).eq("owner_id", ownerId).maybeSingle();
  if (!club) return false;
  const stored = await loadSnapshot(admin, matchId);
  const captured = await captureHomeTeam(admin, ownerId, club);
  const plan = sanitizePlan(match.pre_match_plan);
  const assignments = sanitizeAssignments(match.staff_assignments);
  const staff = await buildStaffProfiles(admin, match.club_id, assignments);
  const input: MatchInput = {
    ...stored.input,
    commands: [],
    home: { ...stored.input.home, formation: captured.setup.tactic.formation, mentality: plan.initialMentality, players: captured.players },
    management: {
      home: { plan, coach: coachingProfile(staff) },
      away: { plan: { ...DEFAULT_PRE_MATCH_PLAN, decisionMode: "delegated" }, coach: { aptitude: 62, assistantAptitude: 55, autonomy: 65, relationship: 60, tacticalFamiliarity: 58, adaptability: 62, caution: 50 } },
    },
  };
  const simulation = simulateMatch(input, 90);
  const presentation = buildPostMatchPresentation(input, simulation, staff);
  const startedAt = new Date();
  const expectedEndAt = new Date(startedAt.getTime() + MATCH_DURATION_MINUTES * 60_000);
  const snapshot: StoredSnapshot = { input, sealedSimulation: simulation, presentation, staff, preparedAt: startedAt.toISOString() };
  const { data, error: startError } = await admin.rpc("start_managed_match", {
    p_match_id: matchId,
    p_owner_id: ownerId,
    p_expected_version: Number(match.lock_version),
    p_started_at: startedAt.toISOString(),
    p_expected_end_at: expectedEndAt.toISOString(),
    p_snapshot: snapshot,
  });
  if (startError) throw startError;
  return Boolean(data);
}

export async function processMatch(admin: AdminClient, ownerId: string, matchId: string) {
  await releaseManagedMatch(admin, ownerId, matchId);
  return getMatchView(admin, ownerId, matchId, { skipRelease: true });
}

async function releaseManagedMatch(admin: AdminClient, ownerId: string, matchId: string) {
  const { data: match, error } = await admin.from("matches").select("*").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match || match.status === "finished") return false;
  if (!["in_progress", "awaiting_processing"].includes(match.status)) return false;
  const due = match.expected_end_at && Date.now() >= new Date(match.expected_end_at).getTime();
  if (!due) return false;
  await admin.from("matches").update({ status: "awaiting_processing" }).eq("id", matchId).eq("owner_id", ownerId).in("status", ["in_progress", "awaiting_processing"]);
  const stored = await loadSnapshot(admin, matchId);
  if (!stored.sealedSimulation || !stored.presentation) throw new Error("sealed_match_result_missing");
  const simulation = stored.sealedSimulation;
  await Promise.all([
    persistEvents(admin, ownerId, matchId, simulation),
    persistTeamStats(admin, ownerId, matchId, simulation),
    persistPlayerStats(admin, ownerId, matchId, simulation),
    persistIncidents(admin, ownerId, matchId, simulation),
    persistReports(admin, ownerId, matchId, stored.presentation.reports),
  ]);
  const consequence = applyPostMatchConsequences(match.match_type);
  if (consequence.applied && !match.consequences_processed_at) await persistConsequences(admin, match, stored.input, simulation);
  const completedAt = new Date().toISOString();
  const result = await admin.from("matches").update({
    status: "finished",
    current_minute: 90,
    home_score: simulation.homeScore,
    away_score: simulation.awayScore,
    finished_at: completedAt,
    result_released_at: completedAt,
    consequences_processed_at: consequence.applied ? completedAt : null,
    lock_version: Number(match.lock_version) + 1,
  }).eq("id", matchId).eq("owner_id", ownerId).in("status", ["in_progress", "awaiting_processing"]);
  if (result.error) throw result.error;
  return true;
}

async function persistEvents(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const rows = simulation.events.map((event) => ({
    id: deterministicUuid(`match-event:${matchId}:${event.eventIndex}`),
    match_id: matchId,
    owner_id: ownerId,
    event_index: event.eventIndex,
    minute: event.minute,
    stoppage: event.stoppage,
    team_side: event.teamSide,
    player_id: event.playerId?.startsWith("qa-opponent-") ? null : event.playerId,
    secondary_player_id: event.secondaryPlayerId?.startsWith("qa-opponent-") ? null : event.secondaryPlayerId,
    event_type: event.eventType,
    zone: event.zone,
    narrative: event.narrative,
    displayed_xg: event.displayedXg,
    goal_probability: event.goalProbability,
    details: { ...event.details, technicalPlayerId: event.playerId?.startsWith("qa-opponent-") ? event.playerId : null, technicalSecondaryPlayerId: event.secondaryPlayerId?.startsWith("qa-opponent-") ? event.secondaryPlayerId : null },
  }));
  if (!rows.length) return;
  const result = await admin.from("match_events").upsert(rows, { onConflict: "id" });
  if (result.error) throw result.error;
}

async function persistTeamStats(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const rows = (["home", "away"] as TeamSide[]).map((side) => {
    const stats = simulation.teamStats[side];
    return { id: deterministicUuid(`team-stats:${matchId}:${side}`), match_id: matchId, owner_id: ownerId, team_side: side, possession: stats.possession, shots: stats.shots, shots_on_target: stats.shotsOnTarget, xg: stats.xg, big_chances: stats.bigChances, corners: stats.corners, fouls: stats.fouls, offsides: stats.offsides, pass_attempts: stats.passAttempts, passes_completed: stats.passesCompleted, chances_created: stats.chancesCreated, tackles_won: stats.tacklesWon, interceptions: stats.interceptions, recoveries: stats.recoveries, aerial_duels_won: stats.aerialDuelsWon, saves: stats.saves, yellow_cards: stats.yellowCards, red_cards: stats.redCards, injuries: stats.injuries, extended_stats: stats };
  });
  const result = await admin.from("match_team_stats").upsert(rows, { onConflict: "id" });
  if (result.error) throw result.error;
}

async function persistPlayerStats(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const rows = Object.values(simulation.playerStats).map((stats: PlayerStats) => {
    const technical = stats.playerId.startsWith("qa-opponent-");
    return { id: deterministicUuid(`player-stats:${matchId}:${stats.playerId}`), match_id: matchId, owner_id: ownerId, player_id: technical ? null : stats.playerId, technical_player_id: technical ? stats.playerId : null, player_name: stats.playerName, team_side: stats.teamSide, position: stats.position, minutes_played: stats.minutesPlayed, rating: stats.rating, goals: stats.goals, assists: stats.assists, shots: stats.shots, shots_on_target: stats.shotsOnTarget, pass_attempts: stats.passAttempts, passes_completed: stats.passesCompleted, key_passes: stats.keyPasses, tackles: stats.tackles, interceptions: stats.interceptions, recoveries: stats.recoveries, fouls: stats.fouls, fouls_suffered: stats.foulsSuffered, offsides: stats.offsides, yellow_cards: stats.yellowCards, red_cards: stats.redCards, goalkeeper_stats: stats.goalkeeper, extended_stats: stats };
  });
  const result = await admin.from("match_player_stats").upsert(rows, { onConflict: "id" });
  if (result.error) throw result.error;
}

async function persistIncidents(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const substitutions = simulation.substitutions.map((item) => ({ id: deterministicUuid(`match-sub:${matchId}:${item.side}:${item.minute}:${item.playerOutId}:${item.playerInId}`), match_id: matchId, owner_id: ownerId, team_side: item.side, minute: item.minute, player_out_id: item.playerOutId.startsWith("qa-") ? null : item.playerOutId, player_in_id: item.playerInId.startsWith("qa-") ? null : item.playerInId, technical_player_out_id: item.playerOutId.startsWith("qa-") ? item.playerOutId : null, technical_player_in_id: item.playerInId.startsWith("qa-") ? item.playerInId : null, reason: item.reason }));
  const injuries = simulation.injuries.map((item) => ({ id: deterministicUuid(`match-injury:${matchId}:${item.side}:${item.minute}:${item.playerId}`), match_id: matchId, owner_id: ownerId, player_id: item.playerId.startsWith("qa-") ? null : item.playerId, technical_player_id: item.playerId.startsWith("qa-") ? item.playerId : null, minute: item.minute, severity: item.severity, forced_substitution: item.forcedSubstitution, details: { source: "deterministic_engine" } }));
  if (substitutions.length) { const result = await admin.from("match_substitutions").upsert(substitutions, { onConflict: "id" }); if (result.error) throw result.error; }
  if (injuries.length) { const result = await admin.from("match_injuries").upsert(injuries, { onConflict: "id" }); if (result.error) throw result.error; }
}

function reportAuthorRole(role: string) {
  if (role === "head-coach") return "coach";
  if (role === "assistant-coach") return "assistant";
  if (["performance-analyst", "performance-analysis-coordinator"].includes(role)) return "analyst";
  if (role === "fitness-coach") return "fitness_coach";
  if (role === "physiologist") return "physiologist";
  if (["doctor", "physiotherapy-coordinator", "physiotherapist"].includes(role)) return "doctor";
  if (role === "psychologist") return "psychologist";
  if (role === "goalkeeper-coach") return "goalkeeper_coach";
  return "commission";
}

async function persistReports(admin: AdminClient, ownerId: string, matchId: string, reports: MatchReportView[]) {
  const unique = new Map<string, MatchReportView>();
  reports.forEach((report) => unique.set(reportAuthorRole(report.role), report));
  const rows = [...unique].map(([authorRole, report]) => ({ id: deterministicUuid(`report:${matchId}:post_match:${authorRole}`), match_id: matchId, owner_id: ownerId, report_type: "post_match", author_role: authorRole, content: report }));
  if (!rows.length) return;
  const result = await admin.from("match_reports").upsert(rows, { onConflict: "id" });
  if (result.error) throw result.error;
}

async function persistConsequences(admin: AdminClient, match: JsonRecord, input: MatchInput, simulation: MatchSimulation) {
  const playerIds = input.home.players.map((player) => player.id).filter((id) => !id.startsWith("qa-"));
  const { data: statuses } = await admin.from("player_status").select("*").in("player_id", playerIds);
  const resultDelta = simulation.homeScore > simulation.awayScore ? 4 : simulation.homeScore < simulation.awayScore ? -3 : 1;
  await Promise.all((statuses || []).map((status) => {
    const stats = simulation.playerStats[status.player_id];
    if (!stats) return Promise.resolve();
    const injury = simulation.injuries.find((item) => item.playerId === status.player_id);
    return admin.from("player_status").update({
      morale: clamp(Number(status.morale) + resultDelta + (stats.rating - 6.5) * 0.8, 0, 100),
      confidence: clamp(Number(status.confidence) + resultDelta * 0.7 + (stats.rating - 6.5), 0, 100),
      fatigue: clamp(Math.max(Number(status.fatigue), stats.fatigue), 0, 100),
      physical_condition: clamp(Number(status.physical_condition) - stats.minutesPlayed / 18, 0, 100),
      form_rating: clamp(stats.rating, 0, 10),
      injury_status: injury ? (injury.severity === "minor" ? "limited" : "injured") : status.injury_status,
      suspension_status: stats.redCards ? "suspended" : stats.yellowCards ? "at_risk" : status.suspension_status,
    }).eq("player_id", status.player_id);
  }));
  void match;
}

function publicTeams(input?: MatchInput): MatchPublicView["teams"] {
  if (!input) return null;
  return {
    home: { name: input.home.name, formation: input.home.formation, players: input.home.players.map((player) => ({ id: player.id, name: player.name, position: player.position, role: player.role, condition: Math.round(player.condition), isStarter: player.isStarter })) },
    away: { name: input.away.name, formation: input.away.formation, players: input.away.players.map((player) => ({ id: player.id, name: player.name, position: player.position, role: player.role, isStarter: player.isStarter })) },
  };
}

function publicStatus(value: string): MatchStatus {
  if (["draft", "ready", "in_progress", "awaiting_processing", "finished", "postponed", "cancelled", "failed"].includes(value)) return value as MatchStatus;
  if (["halftime", "paused"].includes(value)) return "in_progress";
  return "failed";
}

function objectiveFacts(simulation: MatchSimulation) {
  const allowed = new Set(["goal", "yellow_card", "red_card", "injury", "substitution"]);
  return simulation.events.filter((event) => allowed.has(event.eventType)).map((event) => ({ index: event.eventIndex, minute: event.minute, type: event.eventType, label: eventLabel(event.eventType), narrative: event.narrative }));
}

function eventLabel(value: string) {
  return ({ goal: "Gol", yellow_card: "Cartao amarelo", red_card: "Expulsao", injury: "Lesao", substitution: "Substituicao" } as Record<string, string>)[value] || value;
}

function summaryFromStored(stored: StoredSnapshot) {
  if (!stored.sealedSimulation || !stored.presentation) return null;
  const firstHalfGoals = stored.sealedSimulation.events.filter((event) => event.eventType === "goal" && event.minute <= 45);
  return {
    score: { home: stored.sealedSimulation.homeScore, away: stored.sealedSimulation.awayScore, halftimeHome: firstHalfGoals.filter((event) => event.teamSide === "home").length, halftimeAway: firstHalfGoals.filter((event) => event.teamSide === "away").length },
    facts: objectiveFacts(stored.sealedSimulation),
    ...stored.presentation,
  };
}

async function legacyFinishedSummary(admin: AdminClient, matchId: string) {
  const [eventsResult, teamResult, playersResult] = await Promise.all([
    admin.from("match_events").select("event_index,minute,event_type,narrative,team_side").eq("match_id", matchId).order("event_index"),
    admin.from("match_team_stats").select("team_side,possession,shots,shots_on_target,corners,fouls,yellow_cards,red_cards,offsides").eq("match_id", matchId),
    admin.from("match_player_stats").select("id,player_id,player_name,team_side,position,minutes_played,rating,goals,assists,yellow_cards,red_cards").eq("match_id", matchId).eq("team_side", "home").order("rating", { ascending: false }),
  ]);
  const events = eventsResult.data || [];
  const home = teamResult.data?.find((item) => item.team_side === "home");
  const away = teamResult.data?.find((item) => item.team_side === "away");
  if (!home || !away) return null;
  const goals = events.filter((event) => event.event_type === "goal");
  return {
    score: { home: goals.filter((event) => event.team_side === "home").length, away: goals.filter((event) => event.team_side === "away").length, halftimeHome: goals.filter((event) => event.team_side === "home" && event.minute <= 45).length, halftimeAway: goals.filter((event) => event.team_side === "away" && event.minute <= 45).length },
    facts: events.filter((event) => ["goal", "yellow_card", "red_card", "injury", "substitution"].includes(event.event_type)).map((event) => ({ index: event.event_index, minute: event.minute, type: event.event_type, label: eventLabel(event.event_type), narrative: event.narrative })),
    basicStats: [
      { label: "Posse aproximada", home: `${Math.round(Number(home.possession))}%`, away: `${Math.round(Number(away.possession))}%` },
      { label: "Finalizacoes", home: home.shots, away: away.shots },
      { label: "No alvo", home: home.shots_on_target, away: away.shots_on_target },
      { label: "Escanteios", home: home.corners, away: away.corners },
      { label: "Faltas", home: home.fouls, away: away.fouls },
      { label: "Cartoes", home: Number(home.yellow_cards) + Number(home.red_cards), away: Number(away.yellow_cards) + Number(away.red_cards) },
      { label: "Impedimentos", home: home.offsides, away: away.offsides },
    ],
    advancedStats: [],
    players: (playersResult.data || []).map((player) => ({ id: player.player_id || player.id, name: player.player_name, position: player.position, minutes: player.minutes_played, rating: null, classification: Number(player.rating) >= 8 ? "Excelente" : Number(player.rating) >= 7 ? "Boa" : Number(player.rating) >= 6 ? "Regular" : "Abaixo do esperado", goals: player.goals, assists: player.assists, keyActions: [player.goals ? `${player.goals} gol(s)` : "", player.assists ? `${player.assists} assistencia(s)` : ""].filter(Boolean) })),
    reports: [],
    commission: { consensus: [], divergences: [], recommendation: "Esta partida foi processada pela versao anterior; novos jogos incluem relatorios por aptidao.", contributors: [] },
  };
}

export async function getMatchView(admin: AdminClient, ownerId: string, matchId: string, options: { skipRelease?: boolean } = {}): Promise<MatchPublicView | null> {
  const { data: match, error } = await admin.from("matches").select("id,club_id,match_type,competition,status,opponent_name,scheduled_at,started_at,expected_end_at,finished_at,venue,round_label,pre_match_plan,staff_assignments").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match) return null;
  if (!options.skipRelease && match.status === "in_progress" && match.expected_end_at && Date.now() >= new Date(match.expected_end_at).getTime()) {
    await releaseManagedMatch(admin, ownerId, matchId);
    return getMatchView(admin, ownerId, matchId, { skipRelease: true });
  }
  const stored = await loadSnapshot(admin, matchId);
  const state = publicStatus(match.status);
  const plan = sanitizePlan(match.pre_match_plan);
  const assignments = sanitizeAssignments(match.staff_assignments);
  let preparation: MatchPublicView["preparation"] = null;
  if (["draft", "ready"].includes(state)) {
    const optionsList = await staffOptions(admin, match.club_id);
    const profiles = await buildStaffProfiles(admin, match.club_id, assignments);
    preparation = { locked: false, plan, assignments, staff: optionsList, advice: buildPreMatchAdvice(stored.input, profiles) };
  }
  const isProgress = state === "in_progress" || state === "awaiting_processing";
  const progress = isProgress ? { message: state === "awaiting_processing" ? "A partida terminou e os relatórios estão sendo consolidados." : "A equipe está disputando a partida neste momento. O resultado e os relatórios serão disponibilizados após o encerramento.", submittedFormation: stored.input.home.formation, submittedMentality: stored.input.home.mentality } : null;
  const summary = state === "finished" ? summaryFromStored(stored) || await legacyFinishedSummary(admin, matchId) : null;
  return {
    match: { id: match.id, matchType: match.match_type, competition: match.competition, state, opponentName: match.opponent_name, scheduledAt: match.scheduled_at, startedAt: match.started_at, expectedEndAt: match.expected_end_at, finishedAt: match.finished_at, venue: match.venue, roundLabel: match.round_label },
    teams: publicTeams(stored.input),
    preparation,
    progress,
    summary,
  };
}
