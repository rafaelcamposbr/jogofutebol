import { clamp, createSeededRandom, deterministicUuid } from "../random.ts";
import {
  GOALKEEPING_ATTRIBUTES, INITIAL_SQUAD_POSITIONS, MENTAL_ATTRIBUTES, PERSONALITY_CONCEPTS,
  PHYSICAL_ATTRIBUTES, POSITIONS, ROLE_BY_POSITION, SALARY_MODEL, TECHNICAL_ATTRIBUTES,
  type PlayerPersonalityConcept, type PlayerPosition,
} from "./config.ts";

const FIRST_NAMES = ["Arthur", "Bruno", "Caio", "Diego", "Enzo", "Felipe", "Gabriel", "Hugo", "Igor", "Joao", "Kaique", "Lucas", "Mateus", "Nicolas", "Otavio", "Pedro", "Rafael", "Samuel", "Thiago", "Vinicius"];
const LAST_NAMES = ["Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves", "Ferreira", "Gomes", "Henrique", "Lima", "Martins", "Nascimento", "Oliveira", "Pereira", "Queiroz", "Rocha", "Santos", "Teixeira", "Vieira"];

export type GeneratedPlayer = ReturnType<typeof generatePlayer>;
type AttributeGroups = { technical: Record<string, number>; mental: Record<string, number>; physical: Record<string, number>; goalkeeping: Record<string, number> };

function attributeMap(keys: readonly string[], base: number, variance: number, seed: string) {
  const random = createSeededRandom(seed);
  return Object.fromEntries(keys.map((key) => [key, clamp(base + random.int(-variance, variance))]));
}

function positionBias(position: PlayerPosition) {
  if (position === "GK") return { technical: 32, mental: 54, physical: 52, goalkeeping: 62 };
  if (["CB", "RB", "LB", "RWB", "LWB"].includes(position)) return { technical: 51, mental: 57, physical: 60, goalkeeping: 6 };
  if (["DM", "CM", "AM", "RM", "LM"].includes(position)) return { technical: 59, mental: 59, physical: 55, goalkeeping: 5 };
  return { technical: 62, mental: 55, physical: 61, goalkeeping: 4 };
}

export function calculatePlayerOverall(groups: AttributeGroups, position: PlayerPosition) {
  const mean = (record: Record<string, number>) => Object.values(record).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(record).length);
  if (position === "GK") return clamp(mean(groups.goalkeeping) * 0.62 + mean(groups.mental) * 0.23 + mean(groups.physical) * 0.15);
  const weights = ["CB", "RB", "LB", "RWB", "LWB"].includes(position) ? [0.34, 0.34, 0.32] : [0.43, 0.34, 0.23];
  return clamp(mean(groups.technical) * weights[0] + mean(groups.mental) * weights[1] + mean(groups.physical) * weights[2]);
}

export function calculateRoleFit(positionAptitude: number, roleAptitude: number, tacticalFamiliarity: number) {
  return clamp(positionAptitude * 0.48 + roleAptitude * 0.37 + tacticalFamiliarity * 0.15);
}

export function calculateDailyDevelopment(input: {
  current: number; naturalTalent: number; age: number; professionalism: number; morale: number;
  physicalAvailability: number; trainingQuality?: number; isGoalkeeper?: boolean;
}) {
  const agePeak = input.isGoalkeeper ? 29 : 26;
  const ageFactor = input.age <= 21 ? 1.25 : input.age <= agePeak ? 0.72 : input.age <= 32 ? 0.18 : -0.32;
  const headroom = Math.max(0.05, (100 - input.current) / 100);
  const positive = (input.trainingQuality ?? 0.58) * (input.naturalTalent / 100) * (input.professionalism / 100)
    * (0.65 + input.morale / 285) * (input.physicalAvailability / 100) * headroom * 0.055;
  return Math.max(-0.028, Math.min(0.035, positive * ageFactor));
}

export function calculateMoraleEvent(baseDelta: number, personality: Partial<Record<PlayerPersonalityConcept, number>>) {
  const resilience = personality.resilience || 0;
  const contention = personality.contention || 0;
  const loyalty = personality.loyalty || 0;
  const multiplier = baseDelta < 0 ? 1 + contention * 0.07 - resilience * 0.06 - loyalty * 0.02 : 1 + resilience * 0.035;
  return Math.max(-12, Math.min(10, Number((baseDelta * multiplier).toFixed(2))));
}

export function calculatePlayerReaction(input: { text: string; personality: Partial<Record<PlayerPersonalityConcept, number>>; morale: number; satisfaction: number }) {
  const normalized = input.text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const classification = /promet|garant/.test(normalized) ? "promise" : /parab|elog|excelente/.test(normalized) ? "praise" : /contrat|salario/.test(normalized) ? "contract" : /transfer/.test(normalized) ? "transfer" : /titular|minut|banco/.test(normalized) ? "playing_time" : /cobr|precisa|melhor/.test(normalized) ? "accountability" : "motivation";
  const base = classification === "praise" ? 4 : classification === "motivation" ? 2 : classification === "promise" ? 2.5 : classification === "accountability" ? -2 : -0.5;
  const moraleDelta = calculateMoraleEvent(base, input.personality);
  const trustDelta = calculateMoraleEvent(classification === "promise" ? 2 : base * 0.65, input.personality);
  const satisfactionDelta = calculateMoraleEvent(classification === "playing_time" ? (input.satisfaction < 50 ? 1 : -0.5) : base * 0.45, input.personality);
  const tone = moraleDelta >= 2 ? "receptive" : moraleDelta <= -2 ? "resistant" : "measured";
  return {
    classification, tone, moraleDelta, confidenceDelta: Number((moraleDelta * 0.55).toFixed(2)), satisfactionDelta,
    coachTrustDelta: Number((trustDelta * 0.7).toFixed(2)), leadershipTrustDelta: trustDelta,
    transferIntentDelta: classification === "transfer" ? Math.max(2, 8 - (input.personality.loyalty || 0)) : moraleDelta < -3 ? 2 : 0,
    promiseCreated: classification === "promise",
    narrative: tone === "receptive" ? "O jogador recebeu a conversa de forma positiva e demonstrou disposicao para responder em campo." : tone === "resistant" ? "O jogador ouviu, mas deixou claro que espera atitudes concretas antes de mudar sua posicao." : "O jogador respondeu com cautela e pediu que o assunto seja acompanhado nas proximas semanas.",
  };
}

function roleForOverall(overall: number, age: number) {
  if (overall >= 72) return "franchise";
  if (overall >= 64) return "starter";
  if (overall >= 56) return "rotation";
  if (age <= 20) return "development";
  return overall < 47 ? "surplus" : "reserve";
}

export function calculateMonthlySalary(overall: number, role: keyof typeof SALARY_MODEL.roleMultiplier) {
  return Math.round((SALARY_MODEL.baseMonthly * Math.pow(Math.max(0.35, overall / 55), SALARY_MODEL.overallExponent) * SALARY_MODEL.roleMultiplier[role]) / 100) * 100;
}

export function generatePlayer(input: { scopeId: string; clubId: string | null; index: number; position: PlayerPosition; source: "initial_squad" | "free_agent_market" | "tryout"; today?: string }) {
  const seed = `${input.scopeId}:${input.source}:${input.index}:${input.position}`;
  const random = createSeededRandom(seed);
  const bias = positionBias(input.position);
  const qualitySwing = random.int(-14, 15);
  const groups = {
    technical: attributeMap(TECHNICAL_ATTRIBUTES, bias.technical + qualitySwing, 15, `${seed}:technical`),
    mental: attributeMap(MENTAL_ATTRIBUTES, bias.mental + Math.round(qualitySwing * 0.55), 14, `${seed}:mental`),
    physical: attributeMap(PHYSICAL_ATTRIBUTES, bias.physical + Math.round(qualitySwing * 0.45), 13, `${seed}:physical`),
    goalkeeping: attributeMap(GOALKEEPING_ATTRIBUTES, bias.goalkeeping + (input.position === "GK" ? qualitySwing : 0), input.position === "GK" ? 14 : 4, `${seed}:goalkeeping`),
  };
  const overall = Number(calculatePlayerOverall(groups, input.position).toFixed(2));
  const age = random.int(17, 35);
  const today = new Date(input.today || "2026-07-31T12:00:00Z");
  const birthMonth = random.int(0, 11);
  const birthDay = random.int(1, 27);
  const birthDate = new Date(Date.UTC(today.getUTCFullYear() - age, birthMonth, birthDay)).toISOString().slice(0, 10);
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const role = roleForOverall(overall, age) as keyof typeof SALARY_MODEL.roleMultiplier;
  const playerId = deterministicUuid(`player:${seed}`);
  const concepts = [...PERSONALITY_CONCEPTS]
    .map((concept) => ({ concept, level: random.int(0, 5) }))
    .sort((a, b) => b.level - a.level || a.concept.localeCompare(b.concept))
    .slice(0, random.int(3, 5));
  const mainPositionAptitude = random.int(72, 98);
  const secondaryPosition = input.position === "GK" ? null : random.pick(POSITIONS.filter((position) => position !== input.position && position !== "GK"));
  const roles = ROLE_BY_POSITION[input.position];
  const salary = calculateMonthlySalary(overall, role);
  const contractYears = random.int(2, 5);
  return {
    player: {
      id: playerId, club_id: input.clubId, first_name: firstName, last_name: lastName, known_as: `${firstName} ${lastName}`,
      birth_date: birthDate, nationality: "Brasil", secondary_nationality: null, height_cm: input.position === "GK" ? random.int(184, 201) : random.int(166, 193),
      weight_kg: input.position === "GK" ? random.int(78, 96) : random.int(62, 89), preferred_foot: random.chance(0.22) ? "left" : "right",
      weak_foot_level: random.int(1, 4), squad_number: input.clubId ? input.index + 1 : null, main_position: input.position,
      status: input.clubId ? "contracted" : input.source === "tryout" ? "tryout_candidate" : "free_agent", squad_role: input.source === "tryout" ? "development" : role, current_overall: overall,
      public_potential_band: age <= 21 && overall >= 57 ? "promising" : age <= 23 ? "uncertain" : overall >= 64 ? "stable" : "limited",
      captain_rank: concepts.some((item) => item.concept === "leadership" && item.level >= 4) ? random.int(2, 5) : random.int(0, 2),
      generated_source: input.source, generation_index: input.index,
    },
    attributes: { player_id: playerId, ...groups },
    hidden: {
      player_id: playerId, technical_talent: random.int(35, 94), mental_talent: random.int(35, 94), physical_talent: random.int(35, 94),
      tactical_talent: random.int(35, 94), goalkeeping_talent: input.position === "GK" ? random.int(45, 96) : random.int(0, 20),
      potential_ceiling: clamp(overall + random.int(3, 24)), development_consistency: random.int(30, 94), professionalism_hidden: random.int(28, 96),
      adaptability_hidden: random.int(25, 95), injury_proneness_hidden: random.int(8, 74), big_match_temperament_hidden: random.int(20, 95), pressure_resistance_hidden: random.int(20, 95),
    },
    positions: [
      { player_id: playerId, position: input.position, aptitude: mainPositionAptitude },
      ...(secondaryPosition ? [{ player_id: playerId, position: secondaryPosition, aptitude: random.int(38, 71) }] : []),
    ],
    roles: roles.map((tacticalRole, index) => ({ player_id: playerId, role: tacticalRole, aptitude: clamp(mainPositionAptitude - index * random.int(5, 13)) })),
    personality: concepts.map((item, index) => ({ player_id: playerId, concept: item.concept, level: Math.max(1, item.level), is_core: index < 3 })),
    status: {
      player_id: playerId, morale: random.int(48, 78), confidence: random.int(45, 74), club_satisfaction: input.clubId ? random.int(50, 80) : 50,
      coach_trust: random.int(44, 72), leadership_trust: random.int(48, 76), match_fitness: random.int(58, 88), sharpness: random.int(48, 79),
      fatigue: random.int(3, 22), physical_condition: random.int(78, 100), tactical_familiarity: random.int(30, 64), training_load: random.int(35, 62),
    },
    contract: input.clubId ? {
      id: deterministicUuid(`contract:${seed}`), player_id: playerId, club_id: input.clubId, contract_start: today.toISOString().slice(0, 10),
      contract_end: `${today.getUTCFullYear() + contractYears}-${String(birthMonth + 1).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      monthly_salary: salary, signing_bonus: salary * random.int(1, 4), release_clause: salary * random.int(36, 96), squad_role_promised: role,
      appearance_bonus: Math.round(salary * 0.08), goal_bonus: Math.round(salary * 0.12), assist_bonus: Math.round(salary * 0.09),
      clean_sheet_bonus: Math.round(salary * 0.1), promotion_bonus: salary * 3, title_bonus: salary * 4,
      agent_expectation: { renewalMonthsBeforeEnd: 8, desiredIncreasePercent: random.int(8, 30) },
    } : null,
  };
}

export function generateInitialSquad(clubId: string, today?: string) {
  return INITIAL_SQUAD_POSITIONS.map((position, index) => generatePlayer({ scopeId: clubId, clubId, index, position, source: "initial_squad", today }));
}

export function generateFreeAgentMarket(today?: string, size = 36) {
  return Array.from({ length: size }, (_, index) => generatePlayer({ scopeId: "global-beta-market-v1", clubId: null, index, position: POSITIONS[index % POSITIONS.length], source: "free_agent_market", today }));
}
