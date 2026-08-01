export const POSITIONS = ["GK", "RB", "RWB", "CB", "LB", "LWB", "DM", "CM", "AM", "RM", "LM", "RW", "LW", "SS", "ST"] as const;
export type PlayerPosition = (typeof POSITIONS)[number];

export const INITIAL_SQUAD_POSITIONS: PlayerPosition[] = [
  "GK", "GK", "GK",
  "RB", "LB", "RB", "LB",
  "CB", "CB", "CB", "CB", "CB",
  "DM", "CM", "CM", "AM", "CM",
  "RW", "LW", "AM", "RW", "LW",
  "ST", "ST", "ST",
];

export const TECHNICAL_ATTRIBUTES = [
  "finishing", "short_passing", "long_passing", "crossing", "control", "dribbling", "first_touch",
  "heading", "long_shots", "free_kicks", "penalties", "corners", "tackling", "marking",
] as const;
export const MENTAL_ATTRIBUTES = [
  "decisions", "anticipation", "vision", "concentration", "positioning", "off_ball", "aggression",
  "bravery", "composure", "teamwork", "leadership", "creativity", "tactical_discipline",
] as const;
export const PHYSICAL_ATTRIBUTES = [
  "acceleration", "pace", "strength", "stamina", "agility", "balance", "jumping", "coordination", "recovery",
] as const;
export const GOALKEEPING_ATTRIBUTES = [
  "reflexes", "handling", "goalkeeper_positioning", "rushing_out", "aerial_reach", "one_on_one",
  "throwing", "kicking", "command_of_area", "penalty_saving",
] as const;

export const PERSONALITY_CONCEPTS = [
  "diligence", "ambition", "learning", "autonomy", "loyalty", "stability", "sociability", "recognition",
  "discipline", "contention", "innovation", "resilience", "integrity", "competitiveness", "professionalism",
  "leadership", "emotional_control", "club_attachment", "financial_interest",
] as const;
export type PlayerPersonalityConcept = (typeof PERSONALITY_CONCEPTS)[number];

export const ROLE_BY_POSITION: Record<PlayerPosition, readonly string[]> = {
  GK: ["defensive_goalkeeper", "sweeper_keeper"],
  RB: ["defensive_fullback", "support_fullback"], RWB: ["wingback", "support_fullback"],
  LB: ["defensive_fullback", "support_fullback"], LWB: ["wingback", "support_fullback"],
  CB: ["cover_defender", "ball_playing_defender"],
  DM: ["holding_midfielder", "deep_playmaker"], CM: ["box_to_box", "deep_playmaker"],
  AM: ["advanced_playmaker", "attacking_midfielder"], RM: ["wide_winger", "inverted_winger"],
  LM: ["wide_winger", "inverted_winger"], RW: ["wide_winger", "inverted_winger"],
  LW: ["wide_winger", "inverted_winger"], SS: ["second_striker", "mobile_forward"],
  ST: ["target_forward", "mobile_forward"],
};

export const SALARY_MODEL = {
  baseMonthly: 4_500,
  overallExponent: 1.85,
  roleMultiplier: { franchise: 1.75, starter: 1.35, rotation: 1, reserve: 0.72, development: 0.55, surplus: 0.62 },
} as const;
