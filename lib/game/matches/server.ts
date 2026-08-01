import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { deterministicUuid, createSeededRandom, clamp } from "@/lib/game/random";
import { simulateMatch } from "@/lib/game/matches/engine";
import { applyPostMatchConsequences, buildAnalystReport, buildCoachReport } from "@/lib/game/matches/reports";
import type { MatchCommand, MatchInput, MatchPlayer, MatchSimulation, PlayerStats, TeamSide } from "@/lib/game/matches/types";
import { buildTacticalSetup } from "@/lib/game/tactics/server";

type AdminClient = SupabaseClient;

function mean(record: Record<string, number>, keys: string[]) {
  return keys.reduce((sum, key) => sum + Number(record[key] || 0), 0) / Math.max(1, keys.length);
}

function playerModel(player: Record<string, unknown>, assignment: Record<string, unknown>, attributes: Record<string, unknown>, status: Record<string, unknown> | undefined): MatchPlayer {
  const technical = (attributes.technical || {}) as Record<string, number>;
  const mental = (attributes.mental || {}) as Record<string, number>;
  const physical = (attributes.physical || {}) as Record<string, number>;
  const goalkeeping = (attributes.goalkeeping || {}) as Record<string, number>;
  return {
    id: String(player.id), name: String(player.known_as), position: String(assignment.position || player.main_position), role: String(assignment.role || "support"),
    overall: Number(player.current_overall),
    attack: mean(technical, ["finishing", "control", "dribbling", "first_touch", "heading", "long_shots"]),
    creation: mean(technical, ["short_passing", "long_passing", "crossing", "control"]) * 0.58 + mean(mental, ["decisions", "vision", "creativity", "teamwork"]) * 0.42,
    defense: mean(technical, ["tackling", "marking"]) * 0.46 + mean(mental, ["positioning", "anticipation", "concentration", "tactical_discipline"]) * 0.54,
    physical: mean(physical, ["acceleration", "pace", "strength", "stamina", "agility", "recovery"]),
    discipline: mean(mental, ["decisions", "tactical_discipline", "emotional_control", "composure"]),
    goalkeeper: mean(goalkeeping, Object.keys(goalkeeping)),
    condition: Number(status?.physical_condition || 90), fatigue: Number(status?.fatigue || 8), isStarter: assignment.is_starter !== false,
  };
}

function buildTechnicalOpponent(seed: string, strength: number): MatchPlayer[] {
  const positions = ["GK", "LB", "CB", "CB", "RB", "DM", "CM", "CM", "LW", "RW", "ST", "GK", "CB", "LB", "RB", "CM", "AM", "ST"];
  return positions.map((position, index) => {
    const random = createSeededRandom(`${seed}:opponent:${index}`);
    const overall = clamp(strength + random.int(-10, 9), 42, 82);
    return { id: `qa-opponent-${index + 1}`, name: `Adversario ${index + 1}`, position, role: position === "GK" ? "defensive_goalkeeper" : "balanced", overall, attack: clamp(overall + random.int(-8, 8)), creation: clamp(overall + random.int(-8, 8)), defense: clamp(overall + random.int(-8, 8)), physical: clamp(overall + random.int(-8, 8)), discipline: clamp(overall + random.int(-12, 8)), goalkeeper: position === "GK" ? clamp(overall + random.int(-5, 8)) : 5, condition: random.int(87, 100), fatigue: random.int(2, 12), isStarter: index < 11 };
  });
}

export async function createQaMatch(admin: AdminClient, ownerId: string, club: { id: string; name: string }) {
  const setup = await buildTacticalSetup(admin, ownerId, club.id);
  if (!setup.lineup) throw new Error("lineup_missing");
  const playerIds = setup.assignments.map((item) => item.player_id);
  const [attributeResult, statusResult] = await Promise.all([
    admin.from("player_attributes").select("*").in("player_id", playerIds),
    admin.from("player_status").select("*").in("player_id", playerIds),
  ]);
  if (attributeResult.error || statusResult.error) throw attributeResult.error || statusResult.error;
  const homePlayers = setup.assignments.map((assignment) => {
    const player = setup.players.find((item) => item.id === assignment.player_id) as unknown as Record<string, unknown>;
    const attributes = attributeResult.data?.find((item) => item.player_id === assignment.player_id) as Record<string, unknown>;
    const status = statusResult.data?.find((item) => item.player_id === assignment.player_id) as Record<string, unknown> | undefined;
    return playerModel(player, assignment, attributes, status);
  });
  const seed = `qa-${randomUUID()}`;
  const averageOverall = homePlayers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, homePlayers.length);
  const input: MatchInput = {
    seed, version: "v1", commands: [],
    home: { side: "home", name: club.name, formation: setup.tactic.formation, mentality: setup.tactic.mentality, players: homePlayers },
    away: { side: "away", name: "Selecao Tecnica QA", formation: "4-3-3", mentality: "balanced", players: buildTechnicalOpponent(seed, averageOverall) },
  };
  const matchId = randomUUID();
  const { error } = await admin.from("matches").insert({
    id: matchId, owner_id: ownerId, club_id: club.id, match_type: "qa", competition: "Laboratorio Beta",
    seed, simulation_version: "v1", status: "ready", home_club_id: club.id, home_tactic_id: setup.tactic.id,
    home_lineup_id: setup.lineup.id, opponent_name: input.away.name,
    opponent_context: { temporary: true, formation: input.away.formation, generatedPlayers: input.away.players.length }, speed: 1,
  });
  if (error) throw error;
  const stateResult = await admin.from("match_states").insert({ match_id: matchId, owner_id: ownerId, snapshot: { input }, version: 0 });
  if (stateResult.error) throw stateResult.error;
  await persistReports(admin, ownerId, matchId, input, "pre_match");
  return matchId;
}

export async function startMatch(admin: AdminClient, ownerId: string, matchId: string) {
  const { data: match } = await admin.from("matches").select("id,status,lock_version").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (!match || match.status !== "ready") return false;
  const { data, error } = await admin.rpc("commit_match_snapshot", {
    p_match_id: matchId, p_owner_id: ownerId, p_expected_version: match.lock_version, p_status: "in_progress",
    p_current_minute: 0, p_home_score: 0, p_away_score: 0, p_snapshot: await snapshotFor(admin, matchId), p_events: [],
  });
  if (error) throw error;
  return Boolean(data);
}

async function snapshotFor(admin: AdminClient, matchId: string) {
  const { data, error } = await admin.from("match_states").select("snapshot").eq("match_id", matchId).single();
  if (error) throw error;
  return data.snapshot;
}

async function loadSimulationInput(admin: AdminClient, matchId: string) {
  const { data: state, error } = await admin.from("match_states").select("snapshot").eq("match_id", matchId).single();
  if (error) throw error;
  const input = (state.snapshot as { input: MatchInput }).input;
  const { data: commandRows } = await admin.from("match_commands").select("id,command_type,applies_from_minute,payload").eq("match_id", matchId).in("command_type", ["substitution", "mentality", "instruction"]).order("created_at");
  input.commands = (commandRows || []).map((command) => ({ id: command.id, commandType: command.command_type, appliesFromMinute: command.applies_from_minute, payload: command.payload })) as MatchCommand[];
  return { input, snapshot: state.snapshot as Record<string, unknown> };
}

export async function processMatch(admin: AdminClient, ownerId: string, matchId: string) {
  const { data: match, error } = await admin.from("matches").select("*").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match) return null;
  if (!["in_progress"].includes(match.status)) return getMatchView(admin, ownerId, matchId);
  const loaded = await loadSimulationInput(admin, matchId);
  const maxTarget = match.current_minute < 45 ? 45 : 90;
  const target = Math.min(maxTarget, Number(match.current_minute) + (match.match_type === "qa" ? Number(match.speed) : 1));
  const simulation = simulateMatch(loaded.input, target);
  const previousSimulation = simulateMatch(loaded.input, Number(match.current_minute));
  const previousEventCount = previousSimulation.events.length;
  const newEvents = simulation.events.slice(previousEventCount).map((event) => ({
    event_index: event.eventIndex, minute: event.minute, stoppage: event.stoppage, team_side: event.teamSide,
    player_id: event.playerId?.startsWith("qa-opponent-") ? null : event.playerId,
    secondary_player_id: event.secondaryPlayerId?.startsWith("qa-opponent-") ? null : event.secondaryPlayerId,
    event_type: event.eventType, zone: event.zone, narrative: event.narrative, displayed_xg: event.displayedXg,
    goal_probability: event.goalProbability,
    details: { ...event.details, technicalPlayerId: event.playerId?.startsWith("qa-opponent-") ? event.playerId : null, technicalSecondaryPlayerId: event.secondaryPlayerId?.startsWith("qa-opponent-") ? event.secondaryPlayerId : null },
  }));
  const status = target === 90 ? "finished" : target === 45 ? "halftime" : "in_progress";
  const nextSnapshot = { ...loaded.snapshot, lastSimulation: { throughMinute: target, activePlayerIds: simulation.activePlayerIds, fatigue: Object.fromEntries(Object.values(simulation.playerStats).map((item) => [item.playerId, item.fatigue])) } };
  const { data: committed, error: commitError } = await admin.rpc("commit_match_snapshot", {
    p_match_id: matchId, p_owner_id: ownerId, p_expected_version: Number(match.lock_version), p_status: status,
    p_current_minute: target, p_home_score: simulation.homeScore, p_away_score: simulation.awayScore,
    p_snapshot: nextSnapshot, p_events: newEvents,
  });
  if (commitError) throw commitError;
  if (!committed) return getMatchView(admin, ownerId, matchId);
  await Promise.all([
    persistTeamStats(admin, ownerId, matchId, simulation),
    persistPlayerStats(admin, ownerId, matchId, simulation),
    persistIncidents(admin, ownerId, matchId, simulation),
    admin.from("match_commands").update({ status: "applied", applied_at: new Date().toISOString() }).eq("match_id", matchId).eq("status", "pending").lte("applies_from_minute", target),
  ]);
  if (target === 45) await persistReports(admin, ownerId, matchId, loaded.input, "halftime", simulation);
  if (target === 90) {
    await persistReports(admin, ownerId, matchId, loaded.input, "post_match", simulation);
    applyPostMatchConsequences(match.match_type);
  }
  return getMatchView(admin, ownerId, matchId);
}

async function persistTeamStats(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const rows = (["home", "away"] as TeamSide[]).map((side) => {
    const stats = simulation.teamStats[side];
    return { id: deterministicUuid(`team-stats:${matchId}:${side}`), match_id: matchId, owner_id: ownerId, team_side: side,
      possession: stats.possession, shots: stats.shots, shots_on_target: stats.shotsOnTarget, xg: stats.xg, big_chances: stats.bigChances,
      corners: stats.corners, fouls: stats.fouls, offsides: stats.offsides, pass_attempts: stats.passAttempts,
      passes_completed: stats.passesCompleted, chances_created: stats.chancesCreated, tackles_won: stats.tacklesWon,
      interceptions: stats.interceptions, recoveries: stats.recoveries, aerial_duels_won: stats.aerialDuelsWon,
      saves: stats.saves, yellow_cards: stats.yellowCards, red_cards: stats.redCards, injuries: stats.injuries,
      extended_stats: stats };
  });
  const result = await admin.from("match_team_stats").upsert(rows, { onConflict: "id" }); if (result.error) throw result.error;
}

async function persistPlayerStats(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const rows = Object.values(simulation.playerStats).map((stats: PlayerStats) => {
    const technical = stats.playerId.startsWith("qa-opponent-");
    return { id: deterministicUuid(`player-stats:${matchId}:${stats.playerId}`), match_id: matchId, owner_id: ownerId,
      player_id: technical ? null : stats.playerId, technical_player_id: technical ? stats.playerId : null,
      player_name: stats.playerName, team_side: stats.teamSide, position: stats.position, minutes_played: stats.minutesPlayed,
      rating: stats.rating, goals: stats.goals, assists: stats.assists, shots: stats.shots, shots_on_target: stats.shotsOnTarget,
      pass_attempts: stats.passAttempts, passes_completed: stats.passesCompleted, key_passes: stats.keyPasses, tackles: stats.tackles,
      interceptions: stats.interceptions, recoveries: stats.recoveries, fouls: stats.fouls, fouls_suffered: stats.foulsSuffered,
      offsides: stats.offsides, yellow_cards: stats.yellowCards, red_cards: stats.redCards,
      goalkeeper_stats: stats.goalkeeper, extended_stats: stats };
  });
  const result = await admin.from("match_player_stats").upsert(rows, { onConflict: "id" }); if (result.error) throw result.error;
}

async function persistIncidents(admin: AdminClient, ownerId: string, matchId: string, simulation: MatchSimulation) {
  const substitutions = simulation.substitutions.map((item) => ({
    id: deterministicUuid(`match-sub:${matchId}:${item.side}:${item.minute}:${item.playerOutId}:${item.playerInId}`), match_id: matchId, owner_id: ownerId,
    team_side: item.side, minute: item.minute, player_out_id: item.playerOutId.startsWith("qa-") ? null : item.playerOutId,
    player_in_id: item.playerInId.startsWith("qa-") ? null : item.playerInId, technical_player_out_id: item.playerOutId.startsWith("qa-") ? item.playerOutId : null,
    technical_player_in_id: item.playerInId.startsWith("qa-") ? item.playerInId : null, reason: item.reason,
  }));
  const injuries = simulation.injuries.map((item) => ({
    id: deterministicUuid(`match-injury:${matchId}:${item.side}:${item.minute}:${item.playerId}`), match_id: matchId, owner_id: ownerId,
    player_id: item.playerId.startsWith("qa-") ? null : item.playerId, technical_player_id: item.playerId.startsWith("qa-") ? item.playerId : null,
    minute: item.minute, severity: item.severity, forced_substitution: item.forcedSubstitution, details: { qa: true },
  }));
  if (substitutions.length) { const result = await admin.from("match_substitutions").upsert(substitutions, { onConflict: "id" }); if (result.error) throw result.error; }
  if (injuries.length) { const result = await admin.from("match_injuries").upsert(injuries, { onConflict: "id" }); if (result.error) throw result.error; }
}

async function persistReports(admin: AdminClient, ownerId: string, matchId: string, input: MatchInput, type: "pre_match" | "halftime" | "post_match", simulation?: MatchSimulation) {
  const rows = [
    { id: deterministicUuid(`report:${matchId}:${type}:coach`), match_id: matchId, owner_id: ownerId, report_type: type, author_role: "coach", content: buildCoachReport(type, input, simulation) },
    { id: deterministicUuid(`report:${matchId}:${type}:analyst`), match_id: matchId, owner_id: ownerId, report_type: type, author_role: "analyst", content: buildAnalystReport(type, input, simulation) },
  ];
  const result = await admin.from("match_reports").upsert(rows, { onConflict: "id" }); if (result.error) throw result.error;
}

export async function getMatchView(admin: AdminClient, ownerId: string, matchId: string) {
  const { data: match, error } = await admin.from("matches").select("id,club_id,match_type,competition,status,current_minute,opponent_name,home_score,away_score,speed,scheduled_at,started_at,halftime_at,finished_at,simulation_version").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (error || !match) return null;
  const [events, teamStats, playerStats, reports, state, commands, substitutions, injuries] = await Promise.all([
    admin.from("match_events").select("event_index,minute,stoppage,team_side,player_id,secondary_player_id,event_type,zone,narrative,displayed_xg,details").eq("match_id", matchId).order("event_index"),
    admin.from("match_team_stats").select("*").eq("match_id", matchId).order("team_side"),
    admin.from("match_player_stats").select("*").eq("match_id", matchId).order("team_side").order("rating", { ascending: false }),
    admin.from("match_reports").select("report_type,author_role,content,created_at").eq("match_id", matchId).order("created_at"),
    admin.from("match_states").select("snapshot").eq("match_id", matchId).maybeSingle(),
    admin.from("match_commands").select("id,command_type,requested_minute,applies_from_minute,payload,status,created_at").eq("match_id", matchId).order("created_at"),
    admin.from("match_substitutions").select("*").eq("match_id", matchId).order("minute"),
    admin.from("match_injuries").select("*").eq("match_id", matchId).order("minute"),
  ]);
  const input = (state.data?.snapshot as { input?: MatchInput } | undefined)?.input;
  return { match, events: events.data || [], teamStats: teamStats.data || [], playerStats: playerStats.data || [], reports: reports.data || [], commands: commands.data || [], substitutions: substitutions.data || [], injuries: injuries.data || [], teams: input ? { home: { name: input.home.name, formation: input.home.formation, players: input.home.players.map(publicPlayer) }, away: { name: input.away.name, formation: input.away.formation, players: input.away.players.map(publicPlayer) } } : null };
}

function publicPlayer(player: MatchPlayer) {
  return { id: player.id, name: player.name, position: player.position, role: player.role, overall: player.overall, condition: player.condition, initialFatigue: player.fatigue, isStarter: player.isStarter };
}

export async function createMatchCommand(admin: AdminClient, ownerId: string, matchId: string, input: { type: string; payload?: Record<string, unknown> }) {
  const { data: match } = await admin.from("matches").select("id,status,current_minute,match_type,speed").eq("id", matchId).eq("owner_id", ownerId).maybeSingle();
  if (!match) return { ok: false, message: "Partida nao encontrada." };
  if (input.type === "speed") {
    const speed = Number(input.payload?.speed);
    if (match.match_type !== "qa" || ![1, 10, 30, 90].includes(speed)) return { ok: false, message: "Velocidade indisponivel." };
    await admin.from("matches").update({ speed }).eq("id", matchId);
    await admin.from("match_commands").insert({ match_id: matchId, owner_id: ownerId, command_type: "speed", requested_minute: match.current_minute, applies_from_minute: match.current_minute, payload: { speed }, status: "applied", applied_at: new Date().toISOString() });
    return { ok: true };
  }
  if (input.type === "pause" || input.type === "resume") {
    const nextStatus = input.type === "pause" ? "paused" : "in_progress";
    if (match.current_minute >= 90) return { ok: false, message: "A partida ja terminou." };
    await admin.from("matches").update({ status: nextStatus }).eq("id", matchId);
    await admin.from("match_commands").insert({ match_id: matchId, owner_id: ownerId, command_type: input.type, requested_minute: match.current_minute, applies_from_minute: match.current_minute, payload: {}, status: "applied", applied_at: new Date().toISOString() });
    return { ok: true };
  }
  if (!['in_progress', 'halftime'].includes(match.status)) return { ok: false, message: "A partida nao aceita este comando agora." };
  if (input.type === "mentality") {
    const mentality = String(input.payload?.mentality || "");
    if (!["very_defensive", "defensive", "balanced", "attacking", "very_attacking"].includes(mentality)) return { ok: false, message: "Mentalidade invalida." };
  } else if (input.type === "substitution") {
    const outId = String(input.payload?.playerOutId || ""); const inId = String(input.payload?.playerInId || "");
    if (!outId || !inId || outId === inId) return { ok: false, message: "Substituicao invalida." };
    const { count } = await admin.from("match_commands").select("id", { count: "exact", head: true }).eq("match_id", matchId).eq("command_type", "substitution");
    if ((count || 0) >= 5) return { ok: false, message: "Limite de cinco substituicoes atingido." };
    const loaded = await loadSimulationInput(admin, matchId);
    const current = simulateMatch(loaded.input, Number(match.current_minute));
    const homeIds = new Set(loaded.input.home.players.map((player) => player.id));
    const activeIds = new Set(current.activePlayerIds.home);
    const alreadyUsed = new Set(current.substitutions.flatMap((item) => [item.playerOutId, item.playerInId]));
    if (!activeIds.has(outId) || !homeIds.has(inId) || activeIds.has(inId) || alreadyUsed.has(inId)) {
      return { ok: false, message: "A troca precisa usar um jogador em campo e uma reserva ainda disponivel." };
    }
  } else if (input.type === "instruction") {
    const text = String(input.payload?.text || "").trim();
    if (text.length < 3 || text.length > 1000) return { ok: false, message: "Instrucao invalida." };
  } else return { ok: false, message: "Comando invalido." };
  const applies = Math.min(90, Number(match.current_minute) + 1);
  const result = await admin.from("match_commands").insert({ match_id: matchId, owner_id: ownerId, command_type: input.type, requested_minute: match.current_minute, applies_from_minute: applies, payload: { side: "home", ...(input.payload || {}) }, status: "pending" });
  return result.error ? { ok: false, message: "Nao foi possivel salvar o comando." } : { ok: true, appliesFromMinute: applies };
}
