import assert from "node:assert/strict";
import test from "node:test";
import { createSeededRandom } from "../lib/game/random.ts";
import { resolveFoul, resolveInjury, resolveShot } from "../lib/game/matches/actions.ts";
import { simulateMatch } from "../lib/game/matches/engine.ts";
import { applyPostMatchConsequences } from "../lib/game/matches/reports.ts";
import type { MatchInput, MatchPlayer } from "../lib/game/matches/types.ts";

function player(side: string, index: number, starter = true): MatchPlayer {
  const positions = ["GK", "LB", "CB", "CB", "RB", "DM", "CM", "AM", "LW", "RW", "ST", "GK", "CB", "LB", "RB", "CM", "AM", "ST"];
  const position = positions[index];
  return { id: `${side}-${index}`, name: `${side} ${index}`, position, role: "balanced", overall: 62, attack: position === "ST" ? 72 : 57, creation: 62, defense: ["CB", "DM", "LB", "RB"].includes(position) ? 70 : 50, physical: 64, discipline: 62, goalkeeper: position === "GK" ? 68 : 5, condition: 94, fatigue: 7, isStarter: starter };
}

function input(seed: string, commands: MatchInput["commands"] = []): MatchInput {
  return { seed, version: "v1", commands, home: { side: "home", name: "Casa", formation: "4-3-3", mentality: "balanced", players: Array.from({ length: 18 }, (_, index) => player("h", index, index < 11)) }, away: { side: "away", name: "QA", formation: "4-3-3", mentality: "balanced", players: Array.from({ length: 18 }, (_, index) => player("a", index, index < 11)) } };
}

test("mesma semente, escalacao, tatica e comandos produzem resultado identico", () => {
  const commands = [{ id: "m1", commandType: "mentality" as const, appliesFromMinute: 31, payload: { side: "home", mentality: "attacking" } }];
  const first = simulateMatch(input("determinismo", commands), 90);
  const second = simulateMatch(input("determinismo", commands), 90);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.events, simulateMatch(input("outra-semente", commands), 90).events);
});

test("placar e estatisticas mantem consistencia", () => {
  const result = simulateMatch(input("consistencia"), 90);
  assert.equal(result.events.filter((event) => event.eventType === "goal" && event.teamSide === "home").length, result.homeScore);
  assert.equal(result.events.filter((event) => event.eventType === "goal" && event.teamSide === "away").length, result.awayScore);
  assert.ok(result.teamStats.home.shotsOnTarget <= result.teamStats.home.shots);
  assert.ok(result.homeScore <= result.teamStats.home.shotsOnTarget);
  assert.equal(Number((result.teamStats.home.possession + result.teamStats.away.possession).toFixed(2)), 100);
  assert.ok(result.events.every((event) => event.minute >= 0 && event.minute <= 90));
});

test("substituicao vale apenas para minutos futuros e respeita participacao", () => {
  const result = simulateMatch(input("substituicao", [{ id: "s1", commandType: "substitution", appliesFromMinute: 10, payload: { side: "home", playerOutId: "h-10", playerInId: "h-17" } }]), 90);
  assert.equal(result.substitutions.length, 1);
  assert.equal(result.playerStats["h-10"].minutesPlayed, 9);
  assert.equal(result.playerStats["h-17"].minutesPlayed, 81);
  assert.equal(result.events.filter((event) => event.minute > 10 && event.playerId === "h-10").length, 0);
});

test("xG, cartoes e lesoes respeitam limites", () => {
  const random = createSeededRandom("acoes");
  const shooter = player("h", 10); const goalkeeper = player("a", 0);
  const shot = resolveShot({ random, shooter, goalkeeper, zone: "box_center", pressure: 0.55 });
  assert.ok(shot.displayedXg > 0 && shot.displayedXg <= 0.72);
  assert.ok(shot.goalProbability > 0 && shot.goalProbability <= 0.64);
  const foul = resolveFoul(random, { ...shooter, discipline: 5, fatigue: 95 });
  assert.equal(typeof foul.yellow, "boolean");
  let injuryFound = false;
  for (let index = 0; index < 20_000; index += 1) if (resolveInjury(createSeededRandom(`injury-${index}`), { ...shooter, fatigue: 100, condition: 40 }, 70)) { injuryFound = true; break; }
  assert.equal(injuryFound, true);
});

test("partida QA nao aplica consequencias permanentes", () => {
  assert.deepEqual(applyPostMatchConsequences("qa"), { applied: false, reason: "qa_isolated" });
});
