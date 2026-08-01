import { calculateRoleFit } from "../players/engine.ts";
import type { PlayerPosition } from "../players/config.ts";

export const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "4-1-4-1", "3-4-3", "3-5-2", "5-3-2", "4-3-1-2"] as const;
export type Formation = (typeof FORMATIONS)[number];
export type Mentality = "very_defensive" | "defensive" | "balanced" | "attacking" | "very_attacking";
export type TacticSlot = { key: string; position: PlayerPosition; role: string; zone: string; x: number; y: number };

const slot = (key: string, position: PlayerPosition, role: string, x: number, y: number): TacticSlot => ({ key, position, role, zone: y < 34 ? "attacking_third" : y < 67 ? "middle_third" : "defensive_third", x, y });
const GK = slot("GK", "GK", "defensive_goalkeeper", 50, 92);

export const FORMATION_SLOTS: Record<Formation, TacticSlot[]> = {
  "4-4-2": [GK, slot("LB", "LB", "support_fullback", 15, 72), slot("LCB", "CB", "cover_defender", 38, 76), slot("RCB", "CB", "ball_playing_defender", 62, 76), slot("RB", "RB", "support_fullback", 85, 72), slot("LM", "LM", "wide_winger", 14, 48), slot("LCM", "CM", "box_to_box", 39, 52), slot("RCM", "CM", "deep_playmaker", 61, 52), slot("RM", "RM", "wide_winger", 86, 48), slot("LST", "ST", "mobile_forward", 39, 22), slot("RST", "ST", "target_forward", 61, 22)],
  "4-3-3": [GK, slot("LB", "LB", "support_fullback", 15, 72), slot("LCB", "CB", "cover_defender", 38, 76), slot("RCB", "CB", "ball_playing_defender", 62, 76), slot("RB", "RB", "support_fullback", 85, 72), slot("DM", "DM", "holding_midfielder", 50, 59), slot("LCM", "CM", "box_to_box", 34, 45), slot("RCM", "CM", "advanced_playmaker", 66, 45), slot("LW", "LW", "inverted_winger", 18, 22), slot("ST", "ST", "mobile_forward", 50, 16), slot("RW", "RW", "wide_winger", 82, 22)],
  "4-2-3-1": [GK, slot("LB", "LB", "support_fullback", 15, 72), slot("LCB", "CB", "cover_defender", 38, 76), slot("RCB", "CB", "ball_playing_defender", 62, 76), slot("RB", "RB", "support_fullback", 85, 72), slot("LDM", "DM", "holding_midfielder", 37, 58), slot("RDM", "DM", "deep_playmaker", 63, 58), slot("LW", "LW", "inverted_winger", 18, 34), slot("AM", "AM", "advanced_playmaker", 50, 34), slot("RW", "RW", "wide_winger", 82, 34), slot("ST", "ST", "mobile_forward", 50, 14)],
  "4-1-4-1": [GK, slot("LB", "LB", "defensive_fullback", 15, 72), slot("LCB", "CB", "cover_defender", 38, 76), slot("RCB", "CB", "ball_playing_defender", 62, 76), slot("RB", "RB", "defensive_fullback", 85, 72), slot("DM", "DM", "holding_midfielder", 50, 60), slot("LM", "LM", "wide_winger", 14, 42), slot("LCM", "CM", "box_to_box", 38, 44), slot("RCM", "CM", "advanced_playmaker", 62, 44), slot("RM", "RM", "wide_winger", 86, 42), slot("ST", "ST", "target_forward", 50, 15)],
  "3-4-3": [GK, slot("LCB", "CB", "cover_defender", 29, 75), slot("CB", "CB", "ball_playing_defender", 50, 79), slot("RCB", "CB", "cover_defender", 71, 75), slot("LWB", "LWB", "wingback", 12, 51), slot("LCM", "CM", "box_to_box", 38, 52), slot("RCM", "CM", "deep_playmaker", 62, 52), slot("RWB", "RWB", "wingback", 88, 51), slot("LW", "LW", "inverted_winger", 19, 22), slot("ST", "ST", "mobile_forward", 50, 15), slot("RW", "RW", "wide_winger", 81, 22)],
  "3-5-2": [GK, slot("LCB", "CB", "cover_defender", 29, 75), slot("CB", "CB", "ball_playing_defender", 50, 79), slot("RCB", "CB", "cover_defender", 71, 75), slot("LWB", "LWB", "wingback", 12, 50), slot("LCM", "CM", "box_to_box", 35, 51), slot("DM", "DM", "holding_midfielder", 50, 60), slot("RCM", "CM", "advanced_playmaker", 65, 51), slot("RWB", "RWB", "wingback", 88, 50), slot("LST", "ST", "mobile_forward", 39, 20), slot("RST", "ST", "target_forward", 61, 20)],
  "5-3-2": [GK, slot("LWB", "LWB", "wingback", 10, 57), slot("LCB", "CB", "cover_defender", 31, 75), slot("CB", "CB", "ball_playing_defender", 50, 80), slot("RCB", "CB", "cover_defender", 69, 75), slot("RWB", "RWB", "wingback", 90, 57), slot("LCM", "CM", "box_to_box", 32, 49), slot("DM", "DM", "holding_midfielder", 50, 57), slot("RCM", "CM", "advanced_playmaker", 68, 49), slot("LST", "ST", "mobile_forward", 39, 20), slot("RST", "ST", "target_forward", 61, 20)],
  "4-3-1-2": [GK, slot("LB", "LB", "support_fullback", 15, 72), slot("LCB", "CB", "cover_defender", 38, 76), slot("RCB", "CB", "ball_playing_defender", 62, 76), slot("RB", "RB", "support_fullback", 85, 72), slot("LCM", "CM", "box_to_box", 31, 52), slot("DM", "DM", "holding_midfielder", 50, 59), slot("RCM", "CM", "deep_playmaker", 69, 52), slot("AM", "AM", "advanced_playmaker", 50, 34), slot("LST", "ST", "mobile_forward", 39, 17), slot("RST", "ST", "target_forward", 61, 17)],
};

export type LineupAssignment = { slotKey: string; playerId: string; position: PlayerPosition; role: string; isStarter?: boolean; benchOrder?: number | null };

export function validateLineup(formation: Formation, assignments: LineupAssignment[]) {
  const errors: string[] = [];
  const starters = assignments.filter((item) => item.isStarter !== false);
  if (starters.length !== 11) errors.push("A escalacao precisa ter exatamente 11 titulares.");
  if (new Set(assignments.map((item) => item.playerId)).size !== assignments.length) errors.push("Um jogador nao pode ocupar duas vagas.");
  const expectedSlots = new Set(FORMATION_SLOTS[formation].map((item) => item.key));
  if (starters.some((item) => !expectedSlots.has(item.slotKey))) errors.push("A escalacao possui uma posicao incompativel com a formacao.");
  if (starters.filter((item) => item.position === "GK").length !== 1) errors.push("A escalacao precisa ter exatamente um goleiro.");
  return { valid: errors.length === 0, errors };
}

function positionCompatibility(playerPosition: PlayerPosition, slotPosition: PlayerPosition) {
  if (playerPosition === slotPosition) return 100;
  const groups = [["RB", "RWB", "LB", "LWB"], ["CB"], ["DM", "CM"], ["AM", "RM", "LM", "RW", "LW", "SS"], ["ST", "SS"]];
  return groups.some((group) => group.includes(playerPosition) && group.includes(slotPosition)) ? 72 : playerPosition === "GK" || slotPosition === "GK" ? 0 : 28;
}

export function suggestLineup(formation: Formation, players: Array<{ id: string; main_position: PlayerPosition; current_overall: number; tactical_familiarity?: number; status?: string }>) {
  const available = [...players];
  const assignments = FORMATION_SLOTS[formation].map((target) => {
    const ranked = available.map((player) => ({
      player,
      score: calculateRoleFit(positionCompatibility(player.main_position, target.position), Number(player.current_overall), player.tactical_familiarity || 45),
    })).sort((a, b) => b.score - a.score || a.player.id.localeCompare(b.player.id));
    const selected = ranked[0]?.player;
    if (!selected) throw new Error("insufficient_players");
    available.splice(available.findIndex((player) => player.id === selected.id), 1);
    return { slotKey: target.key, playerId: selected.id, position: target.position, role: target.role, isStarter: true };
  });
  const bench = available.sort((a, b) => Number(b.current_overall) - Number(a.current_overall)).slice(0, 7).map((player, index) => ({ slotKey: `B${index + 1}`, playerId: player.id, position: player.main_position, role: "reserve", isStarter: false, benchOrder: index + 1 }));
  return [...assignments, ...bench];
}

export function buildCoachRecommendation(formation: Formation, mentality: Mentality, assignments: LineupAssignment[]) {
  const defensiveCount = assignments.filter((item) => ["GK", "CB", "LB", "RB", "LWB", "RWB", "DM"].includes(item.position)).length;
  return {
    plan: mentality === "attacking" || mentality === "very_attacking" ? "Circular com ritmo alto e atacar os corredores quando o adversario perder compactacao." : "Controlar o centro e acelerar apenas quando houver superioridade clara.",
    strength: defensiveCount >= 6 ? "Boa cobertura para proteger perdas de bola." : "Presenca numerica no ultimo terco.",
    risk: formation.startsWith("3-") ? "Os corredores exigem cobertura dos alas durante a transicao." : "Laterais simultaneamente altos podem expor as costas.",
  };
}
