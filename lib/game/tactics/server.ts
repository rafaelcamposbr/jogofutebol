import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deterministicUuid } from "@/lib/game/random";
import { buildSquadOverview } from "@/lib/game/players/server";
import { FORMATION_SLOTS, suggestLineup, validateLineup, type Formation, type LineupAssignment, type Mentality } from "@/lib/game/tactics/engine";

type AdminClient = SupabaseClient;

const DEFAULT_IN_POSSESSION = { width: 52, tempo: 52, passing: "mixed", shortBuildUp: true, directPlay: false, focus: "center", crossing: "mixed", creativeFreedom: 48, runs: 52, longShots: 38 };
const DEFAULT_TRANSITIONS = { counterPress: true, regroup: false, counterAttack: true, holdShape: false, quickDistribution: true, safeDistribution: false };
const DEFAULT_OUT_OF_POSSESSION = { defensiveLine: 50, blockHeight: 52, pressing: 54, marking: "zonal", compactness: 58, preventShortBuildUp: false, offsideTrap: false, protectBox: true };

export async function ensureDefaultTactic(admin: AdminClient, ownerId: string, clubId: string) {
  const overview = await buildSquadOverview(admin, clubId);
  const tacticId = deterministicUuid(`default-tactic:${clubId}`);
  const lineupId = deterministicUuid(`default-lineup:${clubId}`);
  const formation: Formation = "4-3-3";
  const tacticResult = await admin.from("tactics").upsert({
    id: tacticId, owner_id: ownerId, club_id: clubId, name: "Plano principal", formation, mentality: "balanced",
    in_possession: DEFAULT_IN_POSSESSION, transitions: DEFAULT_TRANSITIONS, out_of_possession: DEFAULT_OUT_OF_POSSESSION,
    set_pieces: { corners: "mixed", penalties: "best_taker", marking: "mixed" }, is_active: true,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (tacticResult.error) throw tacticResult.error;
  const positions = FORMATION_SLOTS[formation].map((item) => ({
    id: deterministicUuid(`tactic-position:${tacticId}:${item.key}`), owner_id: ownerId, tactic_id: tacticId,
    slot_key: item.key, position: item.position, role: item.role, zone: item.zone, x: item.x, y: item.y,
  }));
  const { count: positionCount, error: positionCountError } = await admin.from("tactic_positions")
    .select("id", { count: "exact", head: true }).eq("tactic_id", tacticId);
  if (positionCountError) throw positionCountError;
  if (!positionCount) {
    const positionResult = await admin.from("tactic_positions").insert(positions);
    if (positionResult.error) throw positionResult.error;
  }
  const lineupResult = await admin.from("lineups").upsert({
    id: lineupId, owner_id: ownerId, club_id: clubId, tactic_id: tacticId, name: "Escalacao principal", status: "active", is_default: true,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (lineupResult.error) throw lineupResult.error;
  const players = overview.players.map((player) => ({
    id: player.id,
    main_position: player.main_position,
    current_overall: Number(player.current_overall),
    tactical_familiarity: Number(player.dynamic?.tactical_familiarity || 45),
  }));
  const assignments = suggestLineup(formation, players);
  const assignmentRows = assignments.map((item, index) => ({
    id: deterministicUuid(`lineup-player:${lineupId}:${item.slotKey}`), owner_id: ownerId, lineup_id: lineupId,
    player_id: item.playerId, slot_key: item.slotKey, position: item.position, role: item.role,
    is_starter: item.isStarter !== false, bench_order: "benchOrder" in item ? item.benchOrder || null : null, is_captain: index === 0,
  }));
  const { count: assignmentCount, error: assignmentCountError } = await admin.from("lineup_players")
    .select("id", { count: "exact", head: true }).eq("lineup_id", lineupId);
  if (assignmentCountError) throw assignmentCountError;
  if (!assignmentCount) {
    const playerResult = await admin.from("lineup_players").insert(assignmentRows);
    if (playerResult.error) throw playerResult.error;
  }
  return { tacticId, lineupId };
}

export async function buildTacticalSetup(admin: AdminClient, ownerId: string, clubId: string) {
  await ensureDefaultTactic(admin, ownerId, clubId);
  const overview = await buildSquadOverview(admin, clubId);
  const { data: tactic, error } = await admin.from("tactics").select("*").eq("club_id", clubId).eq("is_active", true).maybeSingle();
  if (error || !tactic) throw error || new Error("active_tactic_missing");
  const { data: lineup } = await admin.from("lineups").select("*").eq("club_id", clubId).eq("is_default", true).maybeSingle();
  const [positions, assignments, familiarity] = await Promise.all([
    admin.from("tactic_positions").select("*").eq("tactic_id", tactic.id).order("y", { ascending: false }),
    lineup ? admin.from("lineup_players").select("*").eq("lineup_id", lineup.id).order("is_starter", { ascending: false }).order("bench_order") : Promise.resolve({ data: [], error: null }),
    admin.from("player_tactic_familiarity").select("*").eq("tactic_id", tactic.id),
  ]);
  return { tactic, lineup, positions: positions.data || [], assignments: assignments.data || [], familiarity: familiarity.data || [], players: overview.players };
}

export async function saveTacticalSetup(admin: AdminClient, input: {
  ownerId: string; clubId: string; tacticId: string; lineupId: string; formation: Formation; mentality: Mentality;
  assignments: LineupAssignment[]; inPossession: Record<string, unknown>; transitions: Record<string, unknown>; outOfPossession: Record<string, unknown>;
}) {
  const validation = validateLineup(input.formation, input.assignments);
  if (!validation.valid) return validation;
  const playerIds = input.assignments.map((item) => item.playerId);
  const { data: ownedPlayers } = await admin.from("players").select("id").eq("club_id", input.clubId).in("id", playerIds);
  if ((ownedPlayers || []).length !== playerIds.length) return { valid: false, errors: ["A escalacao contem um jogador indisponivel para este clube."] };
  const { data: tactic } = await admin.from("tactics").select("id").eq("id", input.tacticId).eq("club_id", input.clubId).eq("owner_id", input.ownerId).maybeSingle();
  const { data: lineup } = await admin.from("lineups").select("id").eq("id", input.lineupId).eq("club_id", input.clubId).eq("owner_id", input.ownerId).maybeSingle();
  if (!tactic || !lineup) return { valid: false, errors: ["Plano tatico nao encontrado."] };
  const tacticUpdate = await admin.from("tactics").update({
    formation: input.formation, mentality: input.mentality, in_possession: input.inPossession,
    transitions: input.transitions, out_of_possession: input.outOfPossession,
  }).eq("id", input.tacticId);
  if (tacticUpdate.error) throw tacticUpdate.error;
  const newPositions = FORMATION_SLOTS[input.formation].map((item) => ({
    owner_id: input.ownerId, tactic_id: input.tacticId, slot_key: item.key, position: item.position,
    role: item.role, zone: item.zone, x: item.x, y: item.y,
  }));
  await admin.from("tactic_positions").delete().eq("tactic_id", input.tacticId);
  const positionsInsert = await admin.from("tactic_positions").insert(newPositions);
  if (positionsInsert.error) throw positionsInsert.error;
  await admin.from("lineup_players").delete().eq("lineup_id", input.lineupId);
  const lineupInsert = await admin.from("lineup_players").insert(input.assignments.map((item, index) => ({
    owner_id: input.ownerId, lineup_id: input.lineupId, player_id: item.playerId, slot_key: item.slotKey,
    position: item.position, role: item.role, is_starter: item.isStarter !== false,
    bench_order: item.benchOrder || null, is_captain: index === 0,
  })));
  if (lineupInsert.error) throw lineupInsert.error;
  return { valid: true, errors: [] };
}
