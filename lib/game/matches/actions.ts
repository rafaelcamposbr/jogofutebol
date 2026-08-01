import { clamp, type SeededRandom } from "../random.ts";
import type { MatchPlayer, TeamSide } from "./types.ts";

export function calculateXg(zone: string, pressure: number, shooter: MatchPlayer) {
  const base = zone === "six_yard" ? 0.42 : zone === "box_center" ? 0.23 : zone === "box_wide" ? 0.11 : zone === "edge" ? 0.075 : 0.025;
  return Number(clamp(base * (0.72 + shooter.attack / 190) * (1 - pressure * 0.28), 0.01, 0.72).toFixed(3));
}

export function resolveShot(input: { random: SeededRandom; shooter: MatchPlayer; goalkeeper: MatchPlayer; zone: string; pressure: number }) {
  const displayedXg = calculateXg(input.zone, input.pressure, input.shooter);
  const finishingFactor = 0.72 + input.shooter.attack / 230;
  const goalkeeperFactor = 1.18 - input.goalkeeper.goalkeeper / 250;
  const goalProbability = Number(clamp(displayedXg * finishingFactor * goalkeeperFactor, 0.006, 0.64).toFixed(3));
  const onTargetProbability = clamp(0.3 + input.shooter.attack / 230 - input.pressure * 0.12, 0.18, 0.74);
  const onTarget = input.random.chance(onTargetProbability);
  const goal = onTarget && input.random.chance(goalProbability / onTargetProbability);
  return { displayedXg, goalProbability, onTarget, goal };
}

export function resolveFoul(random: SeededRandom, defender: MatchPlayer) {
  const severity = clamp(0.16 + (100 - defender.discipline) / 210 + defender.fatigue / 330, 0.12, 0.62);
  const yellow = random.chance(severity * 0.34);
  const directRed = yellow ? false : random.chance(severity * 0.018);
  return { yellow, directRed };
}

export function resolveInjury(random: SeededRandom, player: MatchPlayer, minute: number) {
  const probability = clamp(0.00032 + player.fatigue / 190_000 + (100 - player.condition) / 150_000, 0.0002, 0.0028);
  if (!random.chance(probability)) return null;
  const severity = random.chance(0.08) ? "serious" : random.chance(0.28) ? "moderate" : "minor";
  return { minute, playerId: player.id, severity, forcedSubstitution: severity !== "minor" };
}

export function mentalityModifier(mentality: string, side: TeamSide) {
  const value = mentality === "very_attacking" ? 0.11 : mentality === "attacking" ? 0.06 : mentality === "defensive" ? -0.05 : mentality === "very_defensive" ? -0.09 : 0;
  return side === "home" ? value : -value;
}
