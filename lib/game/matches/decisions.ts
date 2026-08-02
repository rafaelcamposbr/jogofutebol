import { clamp, createSeededRandom } from "../random.ts";
import type { MatchDecision, MatchEvent, MatchInput, MatchPlayer, MatchSimulation, PlayerStats, TeamSide } from "./types.ts";

type DecisionState = {
  active: Record<TeamSide, MatchPlayer[]>;
  removed: Record<TeamSide, Set<string>>;
  added: Record<TeamSide, Set<string>>;
  mentalities: Record<TeamSide, string>;
  events: MatchEvent[];
  substitutions: MatchSimulation["substitutions"];
  decisions: MatchDecision[];
  playerStats: Record<string, PlayerStats>;
  yellowCounts: Record<string, number>;
};

function teamFor(input: MatchInput, side: TeamSide) {
  return side === "home" ? input.home : input.away;
}

function decisionDelay(aptitude: number) {
  return Math.round(clamp((78 - aptitude) / 16, 0, 4));
}

function mayInterpretPlan(input: MatchInput, side: TeamSide, minute: number, reason: string) {
  const management = input.management?.[side];
  if (!management) return false;
  const { coach, plan } = management;
  const adherence = clamp(
    35 + coach.aptitude * 0.3 + coach.relationship * 0.2 + coach.tacticalFamiliarity * 0.15
      + (plan.decisionMode === "delegated" ? coach.autonomy * 0.15 : (100 - coach.autonomy) * 0.08),
    25,
    96,
  );
  return createSeededRandom(`${input.seed}:coach:${side}:${minute}:${reason}`).chance(adherence / 100);
}

function setMentality(input: MatchInput, state: DecisionState, minute: number, side: TeamSide, mentality: string, reason: string, followedPlan: boolean) {
  if (state.mentalities[side] === mentality) return;
  state.mentalities[side] = mentality;
  state.decisions.push({ minute, side, decisionType: "mentality", reason, followedPlan, payload: { mentality } });
  state.events.push({
    eventIndex: 0,
    minute,
    stoppage: 0,
    teamSide: side,
    playerId: null,
    secondaryPlayerId: null,
    eventType: "tactical_change",
    zone: "technical_area",
    narrative: `${teamFor(input, side).name} ajusta a estrategia sob orientacao da comissao.`,
    displayedXg: null,
    goalProbability: null,
    details: { reason, automatic: true },
  });
}

function benchCandidate(input: MatchInput, state: DecisionState, side: TeamSide, out: MatchPlayer) {
  const plan = input.management?.[side]?.plan;
  const unavailable = new Set(plan?.unavailablePlayerIds || []);
  const team = teamFor(input, side);
  return team.players
    .filter((player) => !player.isStarter && !unavailable.has(player.id) && !state.added[side].has(player.id) && !state.removed[side].has(player.id))
    .sort((first, second) => {
      const firstFit = first.position === out.position ? 20 : first.position === "GK" || out.position === "GK" ? -30 : 0;
      const secondFit = second.position === out.position ? 20 : second.position === "GK" || out.position === "GK" ? -30 : 0;
      return (second.overall + secondFit) - (first.overall + firstFit);
    })[0];
}

export function makeAutomaticSubstitution(input: MatchInput, state: DecisionState, minute: number, side: TeamSide, out: MatchPlayer, reason: string, followedPlan: boolean) {
  if (state.substitutions.filter((item) => item.side === side).length >= 5) return false;
  const incoming = benchCandidate(input, state, side, out);
  if (!incoming) return false;
  state.removed[side].add(out.id);
  state.added[side].add(incoming.id);
  state.active[side] = teamFor(input, side).players.filter((player) => (player.isStarter && !state.removed[side].has(player.id)) || state.added[side].has(player.id));
  state.substitutions.push({ minute, side, playerOutId: out.id, playerInId: incoming.id, reason });
  state.decisions.push({ minute, side, decisionType: "substitution", reason, followedPlan, payload: { playerOutId: out.id, playerInId: incoming.id } });
  state.events.push({
    eventIndex: 0,
    minute,
    stoppage: 0,
    teamSide: side,
    playerId: incoming.id,
    secondaryPlayerId: out.id,
    eventType: "substitution",
    zone: "technical_area",
    narrative: `${incoming.name} entra no lugar de ${out.name}.`,
    displayedXg: null,
    goalProbability: null,
    details: { reason, automatic: true },
  });
  return true;
}

export function applyAutomaticDecisions(input: MatchInput, state: DecisionState, minute: number, score: Record<TeamSide, number>) {
  (["home", "away"] as TeamSide[]).forEach((side) => {
    const management = input.management?.[side];
    if (!management) return;
    const other: TeamSide = side === "home" ? "away" : "home";
    const { plan, coach } = management;
    const delay = decisionDelay((coach.aptitude + coach.assistantAptitude * 0.35) / 1.35);
    if (score[side] < score[other] && minute >= plan.offensiveWhenTrailingAfter + delay
      && mayInterpretPlan(input, side, minute, "chasing_result")) {
      setMentality(input, state, minute, side, minute >= 78 ? "very_attacking" : "attacking", "chasing_result", true);
    }
    if (score[side] > score[other] && minute >= plan.protectLeadAfter + delay
      && mayInterpretPlan(input, side, minute, "protecting_lead")) {
      setMentality(input, state, minute, side, score[side] - score[other] >= 2 ? "balanced" : "defensive", "protecting_lead", true);
    }
    if (state.active[side].length < 11 && minute >= 2 && state.mentalities[side] === "very_attacking") {
      setMentality(input, state, minute, side, "balanced", "reaction_to_dismissal", false);
    }
    if (minute < 50 || minute % 5 !== 0) return;
    const candidates = state.active[side]
      .filter((player) => player.position !== "GK")
      .map((player) => ({ player, readiness: player.condition - state.playerStats[player.id].fatigue }))
      .sort((first, second) => first.readiness - second.readiness);
    const tired = candidates.find((item) => item.readiness < plan.protectBelowReadiness);
    if (tired && mayInterpretPlan(input, side, minute, `fatigue:${tired.player.id}`)) {
      makeAutomaticSubstitution(input, state, minute, side, tired.player, "fatigue_protection", true);
      return;
    }
    if (plan.withdrawBookedAggressive) {
      const booked = candidates.find((item) => (state.yellowCounts[item.player.id] || 0) > 0 && item.player.discipline < 55);
      if (booked && mayInterpretPlan(input, side, minute, `discipline:${booked.player.id}`)) {
        makeAutomaticSubstitution(input, state, minute, side, booked.player, "disciplinary_risk", true);
        return;
      }
    }
    if (plan.prioritizeYoungWhenComfortable && score[side] - score[other] >= 2 && minute >= 70) {
      const veteran = [...candidates].reverse().find((item) => (item.player.age || 24) > 23);
      if (veteran) makeAutomaticSubstitution(input, state, minute, side, veteran.player, "youth_opportunity", true);
    }
  });
}
