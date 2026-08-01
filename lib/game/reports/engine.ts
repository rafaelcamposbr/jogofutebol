import { clamp, createSeededRandom } from "../random.ts";

export type ReportInputs = {
  authorId: string;
  playerId: string;
  version: number;
  date: string;
  functionalAptitude: number;
  familiarity: number;
  observationQuality: number;
  dataQuality: number;
  relationshipBias?: number;
  modifiers?: number;
};

export function reportPrecision(input: ReportInputs) {
  return Math.round(clamp(20 + 0.5 * input.functionalAptitude + 0.15 * input.familiarity + 0.1 * input.observationQuality + 0.1 * input.dataQuality + (input.modifiers || 0), 10, 95));
}

export function reportUncertainty(precision: number) {
  return Math.max(3, Math.round((100 - clamp(precision)) * 0.3));
}

export function estimateHiddenCategory(realValue: number, category: string, input: ReportInputs) {
  const precision = reportPrecision(input);
  const uncertainty = reportUncertainty(precision);
  const random = createSeededRandom(`${input.authorId}:${input.playerId}:${category}:${input.version}:${input.date.slice(0, 10)}`);
  const bias = clamp(input.relationshipBias || 0, -3, 3);
  const central = Math.round(clamp(realValue + (random.next() * 2 - 1) * uncertainty + bias));
  const lower = Math.max(0, central - uncertainty);
  const upper = Math.min(100, central + uncertainty);
  return { category, central, lower, upper, label: reportBand(central), precision, uncertainty };
}

export function reportAgeStatus(createdAt: string, precision: number, now = new Date()) {
  if (precision < 30) return "unreliable" as const;
  const ageDays = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000);
  if (ageDays > 90) return "outdated" as const;
  if (ageDays > 30) return "update_needed" as const;
  return "current" as const;
}

export function buildConsensus(estimates: Array<{ central: number; precision: number }>) {
  if (!estimates.length) return null;
  const totalWeight = estimates.reduce((sum, item) => sum + item.precision, 0);
  const central = Math.round(estimates.reduce((sum, item) => sum + item.central * item.precision, 0) / Math.max(1, totalWeight));
  const divergence = Math.round(clamp(Math.max(...estimates.map((item) => item.central)) - Math.min(...estimates.map((item) => item.central))));
  const confidence = Math.round(clamp(totalWeight / estimates.length - divergence * 0.8));
  const margin = reportUncertainty(confidence);
  return { central, lower: Math.max(0, central - margin), upper: Math.min(100, central + margin), confidence, divergence, label: reportBand(central) };
}

export function reportBand(value: number) {
  if (value >= 80) return "Excepcional";
  if (value >= 68) return "Muito bom";
  if (value >= 56) return "Competitivo";
  if (value >= 44) return "Regular";
  if (value >= 32) return "Em desenvolvimento";
  return "Limitado";
}
