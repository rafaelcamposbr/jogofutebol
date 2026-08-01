import { clamp } from "../random.ts";

export type Personality = Record<string, number>;
export type RelationshipState = {
  familiarity: number;
  affinity: number;
  trust: number;
  respect: number;
  tension: number;
  professionalAlignment: number;
  influence: number;
  compatibilityBase: number;
};

const COMPLEMENTS: Array<[string, string]> = [["leadership", "discipline"], ["innovation", "learning"], ["ambition", "professionalism"], ["sociability", "emotional_control"]];
const CONFLICTS: Array<[string, string]> = [["contention", "leadership"], ["autonomy", "discipline"], ["financial_interest", "loyalty"], ["recognition", "stability"]];

export function personalityCompatibility(source: Personality, target: Personality) {
  const keys = [...new Set([...Object.keys(source), ...Object.keys(target)])];
  const similarity = keys.length ? keys.reduce((sum, key) => sum + (5 - Math.min(5, Math.abs((source[key] || 0) - (target[key] || 0)))), 0) / keys.length : 2.5;
  const complement = COMPLEMENTS.reduce((sum, [a, b]) => sum + Math.min(source[a] || 0, target[b] || 0) + Math.min(source[b] || 0, target[a] || 0), 0);
  const conflict = CONFLICTS.reduce((sum, [a, b]) => sum + Math.min(source[a] || 0, target[b] || 0) + Math.min(source[b] || 0, target[a] || 0), 0);
  return Math.round(clamp(35 + similarity * 8 + complement * 0.8 - conflict * 1.15));
}

export function initialRelationship(compatibilityBase: number): RelationshipState {
  return {
    familiarity: 0,
    affinity: clamp(35 + compatibilityBase * 0.3),
    trust: 45,
    respect: 45,
    tension: clamp(35 - compatibilityBase * 0.3),
    professionalAlignment: clamp(30 + compatibilityBase * 0.4),
    influence: 10,
    compatibilityBase: clamp(compatibilityBase),
  };
}

export function applyRelationshipEvent(state: RelationshipState, deltas: Partial<Record<keyof RelationshipState, number>>, severe = false) {
  const cap = severe ? 18 : 5;
  return Object.fromEntries(Object.entries(state).map(([key, value]) => {
    if (key === "compatibilityBase") return [key, value];
    const delta = clamp(Number(deltas[key as keyof RelationshipState] || 0), -cap, cap);
    return [key, clamp(Number(value) + delta)];
  })) as RelationshipState;
}

export function propagatedDelta(delta: number, sourceInfluence: number) {
  return Math.round(clamp(delta * (clamp(sourceInfluence) / 100) * 0.25, -2, 2) * 100) / 100;
}
