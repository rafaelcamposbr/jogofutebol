import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { applyAutomaticDecisions } from "../lib/game/matches/decisions.ts";
import { simulateMatch } from "../lib/game/matches/engine.ts";
import { buildPostMatchPresentation, reportAccuracy, type MatchStaffProfile } from "../lib/game/matches/reports.ts";
import type { MatchInput, MatchPlayer, PreMatchPlan, TeamSide } from "../lib/game/matches/types.ts";

function player(side: string, index: number, starter = true): MatchPlayer {
  const positions = ["GK", "LB", "CB", "CB", "RB", "DM", "CM", "AM", "LW", "RW", "ST", "GK", "CB", "LB", "RB", "CM", "AM", "ST"];
  const position = positions[index];
  return { id: `${side}-${index}`, name: `${side} ${index}`, position, role: "balanced", overall: 62, attack: position === "ST" ? 72 : 57, creation: 62, defense: ["CB", "DM", "LB", "RB"].includes(position) ? 70 : 50, physical: 64, discipline: index === 10 ? 42 : 62, goalkeeper: position === "GK" ? 68 : 5, condition: 94, fatigue: 7, age: index > 14 ? 20 : 27, isStarter: starter };
}

const plan: PreMatchPlan = { decisionMode: "shared", initialMentality: "balanced", offensiveWhenTrailingAfter: 60, protectLeadAfter: 75, protectBelowReadiness: 55, withdrawBookedAggressive: true, prioritizeYoungWhenComfortable: true, unavailablePlayerIds: [] };

function input(seed = "managed-match"): MatchInput {
  return {
    seed,
    version: "v1",
    commands: [],
    home: { side: "home", name: "Casa", formation: "4-3-3", mentality: "balanced", players: Array.from({ length: 18 }, (_, index) => player("h", index, index < 11)) },
    away: { side: "away", name: "Fora", formation: "4-3-3", mentality: "balanced", players: Array.from({ length: 18 }, (_, index) => player("a", index, index < 11)) },
    management: { home: { plan, coach: { aptitude: 100, assistantAptitude: 90, autonomy: 60, relationship: 100, tacticalFamiliarity: 100, adaptability: 90, caution: 40 } } },
  };
}

function profile(overrides: Partial<MatchStaffProfile>): MatchStaffProfile {
  return { id: "staff", name: "Profissional", roleId: "performance-analyst", roleLabel: "Analista", area: "technical", functionalAptitude: 50, experience: 5, familiarity: 50, facilitiesQuality: 50, dataQuality: 50, satisfaction: 60, workload: 50, relationship: 55, relevantCourses: 0, ...overrides };
}

test("resultado selado permanece deterministico com decisoes automaticas", () => {
  const first = simulateMatch(input("automatic-decisions"), 90);
  const second = simulateMatch(input("automatic-decisions"), 90);
  assert.deepEqual(first, second);
  assert.ok(first.decisions.every((decision) => decision.minute >= 1 && decision.minute <= 90));
});

test("comissao reage ao placar e protege jogador cansado sem comando ao vivo", () => {
  const matchInput = input("coach-response");
  const minuteOne = simulateMatch({ ...matchInput, management: undefined }, 1);
  minuteOne.playerStats["h-10"].fatigue = 60;
  const state: Parameters<typeof applyAutomaticDecisions>[1] = {
    active: { home: matchInput.home.players.filter((item) => item.isStarter), away: matchInput.away.players.filter((item) => item.isStarter) } as Record<TeamSide, MatchPlayer[]>,
    removed: { home: new Set<string>(), away: new Set<string>() },
    added: { home: new Set<string>(), away: new Set<string>() },
    mentalities: { home: "balanced", away: "balanced" } as Record<TeamSide, string>,
    events: [], substitutions: [], decisions: [], playerStats: minuteOne.playerStats, yellowCounts: {},
  };
  for (const minute of [60, 65, 70]) applyAutomaticDecisions(matchInput, state, minute, { home: 0, away: 1 });
  assert.ok(state.decisions.some((decision) => decision.reason === "chasing_result"));
  assert.ok(state.substitutions.some((substitution) => substitution.playerOutId === "h-10" && substitution.reason === "fatigue_protection"));
});

test("aptidao limita profundidade, nota numerica e confianca do relatorio", () => {
  const matchInput = input("report-quality");
  const simulation = simulateMatch(matchInput, 90);
  const low = profile({ id: "low", name: "Analista inicial", functionalAptitude: 18, familiarity: 15, facilitiesQuality: 35, dataQuality: 30, satisfaction: 35, workload: 90 });
  const high = profile({ id: "high", name: "Analista experiente", functionalAptitude: 96, familiarity: 92, facilitiesQuality: 88, dataQuality: 94, satisfaction: 90, workload: 35, relationship: 88, relevantCourses: 3 });
  const lowView = buildPostMatchPresentation(matchInput, simulation, [low]);
  const highView = buildPostMatchPresentation(matchInput, simulation, [high]);
  assert.ok(reportAccuracy(low) >= 10 && reportAccuracy(high) <= 95);
  assert.equal(lowView.reports[0].confidence, "Baixa");
  assert.equal(highView.reports[0].confidence, "Alta");
  assert.ok(lowView.advancedStats.length < highView.advancedStats.length);
  assert.equal(lowView.players.every((item) => item.rating === null), true);
  assert.equal(highView.players.some((item) => typeof item.rating === "number"), true);
});

test("sem analista exibe apenas fatos basicos e comissao preserva divergencias", () => {
  const matchInput = input("commission-view");
  const simulation = simulateMatch(matchInput, 90);
  const coach = profile({ id: "coach", name: "Tecnico", roleId: "head-coach", roleLabel: "Tecnico", functionalAptitude: 80 });
  const physical = profile({ id: "fitness", name: "Preparador", roleId: "fitness-coach", roleLabel: "Preparador Fisico", area: "physical", functionalAptitude: 80 });
  const withoutAnalyst = buildPostMatchPresentation(matchInput, simulation, [coach, physical]);
  assert.equal(withoutAnalyst.advancedStats.length, 0);
  assert.ok(withoutAnalyst.basicStats.length >= 7);
  const analyst = profile({ id: "analyst", name: "Analista", functionalAptitude: 85, familiarity: 85, dataQuality: 90 });
  const full = buildPostMatchPresentation(matchInput, simulation, [coach, physical, analyst]);
  assert.ok(full.commission.divergences.length >= 2);
  assert.equal(full.commission.contributors.length, 3);
});

test("UI nao contem polling, placar parcial ou controles de transmissao", () => {
  const component = readFileSync("components/MatchCenter.tsx", "utf8");
  for (const forbidden of ["setTimeout", "setInterval", '"/process"', "Pausar", "Velocidade", "Ao vivo", "Fazer substituicao", "current_minute", "home_score", "away_score"]) {
    assert.equal(component.includes(forbidden), false, `controle ao vivo encontrado: ${forbidden}`);
  }
});

test("migration torna a verdade da partida privada e registra ciclo gerenciado", () => {
  const sql = readFileSync("supabase/migrations/20260802013045_managed_match_lifecycle_and_private_truth.sql", "utf8");
  assert.match(sql, /revoke select on public\.match_states, public\.match_commands, public\.match_events/i);
  assert.match(sql, /expected_end_at timestamptz/i);
  assert.match(sql, /create or replace function public\.start_managed_match/i);
  assert.match(sql, /from public, anon, authenticated/i);
});
