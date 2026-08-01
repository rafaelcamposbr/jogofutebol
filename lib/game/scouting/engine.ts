import { clamp, createSeededRandom } from "../random.ts";
import { POSITIONS, type PlayerPosition } from "../players/config.ts";
import { generatePlayer, type GeneratedPlayer } from "../players/engine.ts";

export const TRYOUT_COST_CENTS = 145_688;
export const TRYOUT_FOCUSES = ["broad", "technical", "physical", "tactical", "goalkeeper", "offensive", "defensive"] as const;
export type TryoutFocus = (typeof TRYOUT_FOCUSES)[number];

export type TryoutPreferences = {
  ageMin: number;
  ageMax: number;
  positions: PlayerPosition[];
  maxPerPosition: number;
  focus: TryoutFocus;
  region?: string;
  comments?: string;
};

export function preparationQuality(days: number) {
  return clamp(18 * Math.sqrt(Math.max(1, Math.min(30, days))));
}

export function selectionQuality(scoutQuality: number, days: number) {
  return clamp(0.65 * clamp(scoutQuality) + 0.35 * preparationQuality(days));
}

export function candidateCount(days: number, scoutQuality: number, seed: string) {
  const boundedDays = Math.max(1, Math.min(30, Math.round(days)));
  const quality = clamp(scoutQuality);
  const base = 3 + 0.9 * boundedDays + 0.07 * quality + 0.015 * boundedDays * quality;
  const variance = 0.9 + createSeededRandom(`${seed}:candidate-count`).next() * 0.2;
  return Math.max(4, Math.min(50, Math.round(base * variance)));
}

export function generateTryoutCandidates(input: {
  tryoutId: string;
  days: number;
  scoutQuality: number;
  preferences: TryoutPreferences;
  today?: string;
}) {
  const count = candidateCount(input.days, input.scoutQuality, input.tryoutId);
  const quality = selectionQuality(input.scoutQuality, input.days);
  const positions = input.preferences.positions.length ? input.preferences.positions : [...POSITIONS];
  const poolSize = Math.max(count * 4, 60);
  const random = createSeededRandom(`${input.tryoutId}:selection`);
  const perPosition = new Map<string, number>();
  const pool = Array.from({ length: poolSize }, (_, index) => {
    const position = positions[index % positions.length];
    const generated = generatePlayer({
      scopeId: input.tryoutId,
      clubId: null,
      index,
      position,
      source: "tryout",
      today: input.today,
    });
    const age = ageFromBirthDate(generated.player.birth_date, input.today);
    const focusScore = focusFit(generated, input.preferences.focus);
    const scoutingNoise = (random.next() - 0.5) * (115 - quality);
    const ageFit = age >= input.preferences.ageMin && age <= input.preferences.ageMax ? 12 : -35;
    return { generated, score: focusScore * 0.48 + generated.player.current_overall * 0.52 + scoutingNoise + ageFit, age };
  }).sort((a, b) => b.score - a.score || a.generated.player.id.localeCompare(b.generated.player.id));

  const selected: Array<{ generated: GeneratedPlayer; candidate: ReturnType<typeof safeCandidateReport> }> = [];
  for (const item of pool) {
    if (selected.length >= count) break;
    if (item.age < input.preferences.ageMin || item.age > input.preferences.ageMax) continue;
    const position = item.generated.player.main_position;
    const used = perPosition.get(position) || 0;
    if (used >= input.preferences.maxPerPosition) continue;
    perPosition.set(position, used + 1);
    selected.push({
      generated: item.generated,
      candidate: safeCandidateReport(item.generated, input.tryoutId, quality, input.preferences.focus),
    });
  }
  return selected;
}

function focusFit(player: GeneratedPlayer, focus: TryoutFocus) {
  const values = (group: Record<string, number>) => Object.values(group);
  const mean = (items: number[]) => items.reduce((sum, value) => sum + value, 0) / Math.max(1, items.length);
  if (focus === "technical") return mean(values(player.attributes.technical));
  if (focus === "physical") return mean(values(player.attributes.physical));
  if (focus === "tactical") return mean([player.attributes.mental.decisions, player.attributes.mental.positioning, player.attributes.mental.tactical_discipline]);
  if (focus === "goalkeeper") return player.player.main_position === "GK" ? mean(values(player.attributes.goalkeeping)) + 20 : 0;
  if (focus === "offensive") return mean([player.attributes.technical.finishing, player.attributes.technical.control, player.attributes.mental.off_ball]);
  if (focus === "defensive") return mean([player.attributes.technical.tackling, player.attributes.technical.marking, player.attributes.mental.positioning]);
  return player.player.current_overall;
}

function safeCandidateReport(player: GeneratedPlayer, seed: string, quality: number, focus: TryoutFocus) {
  const random = createSeededRandom(`${seed}:${player.player.id}:observed`);
  const confidence = Math.round(clamp(24 + quality * 0.62 + random.int(-6, 6), 10, 95));
  const uncertainty = Math.max(3, Math.round((100 - confidence) * 0.3));
  const estimate = Math.round(clamp(player.player.current_overall + random.int(-uncertainty, uncertainty)));
  const lower = Math.max(1, estimate - uncertainty);
  const upper = Math.min(100, estimate + uncertainty);
  const recommendation = estimate >= 63 ? "trial" : estimate >= 49 ? "observe" : "release";
  return {
    playerId: player.player.id,
    estimatedPosition: player.player.main_position,
    confidence,
    recommendation,
    observedProfile: {
      level: `${band(lower)} a ${band(upper)}`,
      estimateRange: `${lower}-${upper}`,
      focus: focusLabel(focus),
      heightCm: player.player.height_cm,
      weightKg: player.player.weight_kg,
      preferredFoot: player.player.preferred_foot,
      caveat: confidence < 50 ? "Leitura inicial ampla; o contrato de teste e recomendado antes de qualquer conclusao." : "Leitura consistente para esta etapa, ainda sujeita a observacao no clube.",
    },
  };
}

function band(value: number) {
  if (value >= 76) return "destaque";
  if (value >= 64) return "forte";
  if (value >= 52) return "competitivo";
  if (value >= 40) return "em desenvolvimento";
  return "limitado";
}

function focusLabel(focus: TryoutFocus) {
  return ({ broad: "ampla", technical: "tecnica", physical: "fisica", tactical: "tatica", goalkeeper: "goleiros", offensive: "ofensiva", defensive: "defensiva" } as const)[focus];
}

function ageFromBirthDate(birthDate: string, today = new Date().toISOString()) {
  const birth = new Date(`${birthDate}T12:00:00Z`);
  const date = new Date(today);
  let age = date.getUTCFullYear() - birth.getUTCFullYear();
  if (date.getUTCMonth() < birth.getUTCMonth() || (date.getUTCMonth() === birth.getUTCMonth() && date.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}
