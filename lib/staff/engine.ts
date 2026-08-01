export const PERSONALITY_CONCEPTS = [
  "diligence",
  "ambition",
  "learning",
  "autonomy",
  "loyalty",
  "stability",
  "sociability",
  "recognition",
  "discipline",
  "contention",
  "innovation",
  "resilience",
  "integrity",
] as const;

export type PersonalityConcept = (typeof PERSONALITY_CONCEPTS)[number];
export type PersonalityLevels = Record<PersonalityConcept, number>;

export type EmployeeState = {
  satisfaction: number;
  trust: number;
  morale: number;
  workload: number;
  meetingFatigue: number;
  trainingFatigue: number;
};

export type MeetingType =
  | "planning"
  | "evaluation"
  | "accountability"
  | "praise"
  | "feedback"
  | "training"
  | "crisis"
  | "negotiation"
  | "promotion"
  | "contract"
  | "alignment"
  | "debate"
  | "warning"
  | "technical"
  | "collective"
  | "private";

export type MeetingTone = "respectful" | "neutral" | "direct" | "critical" | "hostile" | "supportive";

export type MeetingInterpretation = {
  meetingClassification: MeetingType;
  tone: MeetingTone;
  topics: string[];
  instructions: string[];
  promises: Array<{ description: string; deadline: string | null; importance: number }>;
  complaints: string[];
  praise: string[];
  hasDebateSpace: boolean;
  isCollective: boolean;
  isClear: boolean;
  isRepetitive: boolean;
  suggestedNarrative: string;
};

export type MeetingEvaluation = {
  satisfactionDelta: number;
  trustDelta: number;
  moraleDelta: number;
  fatigueDelta: number;
  aptitudeDelta: number;
  aptitudeTarget: string;
  playerMoraleDelta: number;
  relationshipDeltas: Array<{
    targetType: "user";
    targetId: string;
    relationshipDelta: number;
    trustDelta: number;
    conflictDelta: number;
  }>;
  commitments: string[];
  tasks: string[];
  warnings: string[];
  promises: MeetingInterpretation["promises"];
  importance: number;
  tolerance: number;
  recentMeetingCount: number;
  qualityScore: number;
  reportTone: "positive" | "neutral" | "concern" | "critical";
  narrative: string;
};

export type CourseType = "ead" | "weekend" | "immersion";

export const COURSE_CATALOG: Record<CourseType, { gain: number; cost: number; durationDays: number; label: string }> = {
  ead: { gain: 3.27, cost: 12598.8, durationDays: 4, label: "EAD" },
  weekend: { gain: 6.41, cost: 19638.32, durationDays: 1, label: "Treinamento de fim de semana" },
  immersion: { gain: 9.62, cost: 26104.71, durationDays: 7, label: "Imersao com especialista" },
};

export const TUTORIAL_STEPS = [
  { id: 1, title: "Boas-vindas", target: "body", route: "/mercado", actionLabel: "Explorar o jogo" },
  { id: 2, title: "Visao geral do Escritorio", target: '[data-view="overview"]', route: "/escritorio", actionLabel: "Abrir Escritorio" },
  { id: 3, title: "Departamento de futebol", target: '[data-view="staff"]', route: "/escritorio/funcionarios", actionLabel: "Ver funcionarios" },
  { id: 4, title: "Busca e contratacao", target: '[data-staff-tab="search"]', route: "/escritorio/funcionarios/busca", actionLabel: "Buscar profissionais" },
  { id: 5, title: "Gestao do Escritorio", target: '[data-view="administration"]', route: "/escritorio/administracao", actionLabel: "Abrir administracao" },
  { id: 6, title: "Sala de Reuniao", target: '[data-people-hub="meetings"]', route: "/escritorio/inteligencia?tab=meetings", actionLabel: "Abrir reunioes" },
  { id: 7, title: "Cursos", target: '[data-people-hub="courses"]', route: "/escritorio/inteligencia?tab=courses", actionLabel: "Abrir cursos" },
  { id: 8, title: "Instalacoes", target: '[data-view="installations"]', route: "/escritorio/instalacoes", actionLabel: "Ver instalacoes" },
  { id: 9, title: "Areas principais", target: ".sidebar", route: "/mercado", actionLabel: "Abrir Mercado" },
  { id: 10, title: "Primeiras decisoes", target: "main", route: "/escritorio", actionLabel: "Voltar ao Escritorio" },
] as const;

const CONCEPT_LABELS: Record<PersonalityConcept, { low: string; hint: string; high: string }> = {
  diligence: { low: "Prefere um ritmo flexivel", hint: "Ha indicios de diligencia", high: "Muito diligente" },
  ambition: { low: "Pouco orientado a status", hint: "Parece buscar crescimento", high: "Ambicioso" },
  learning: { low: "Prefere metodos conhecidos", hint: "Demonstra interesse em aprender", high: "Valoriza aprendizado" },
  autonomy: { low: "Aceita supervisao proxima", hint: "Parece valorizar autonomia", high: "Prefere autonomia" },
  loyalty: { low: "Mantem vinculos pragmaticos", hint: "Demonstra lealdade", high: "Fortemente leal" },
  stability: { low: "Tolera mudancas", hint: "Parece valorizar estabilidade", high: "Valoriza estabilidade" },
  sociability: { low: "Pouco sociavel", hint: "Ha sinais de sociabilidade", high: "Muito sociavel" },
  recognition: { low: "Dispensa visibilidade", hint: "Aprecia reconhecimento", high: "Busca reconhecimento" },
  discipline: { low: "Flexivel com processos", hint: "Valoriza processos", high: "Muito disciplinado" },
  contention: { low: "Raramente confronta", hint: "Pode questionar decisoes", high: "Fortemente contestador" },
  innovation: { low: "Prefere metodos consolidados", hint: "Mostra curiosidade por mudancas", high: "Muito inovador" },
  resilience: { low: "Sente mais a pressao", hint: "Parece resiliente", high: "Muito resiliente" },
  integrity: { low: "Age de forma pragmatica", hint: "Demonstra integridade", high: "Integridade definidora" },
};

const MEETING_KEYWORDS: Array<{ type: MeetingType; words: string[] }> = [
  { type: "promotion", words: ["promocao", "promover", "novo cargo"] },
  { type: "contract", words: ["contrato", "renovar", "salario"] },
  { type: "praise", words: ["parabens", "excelente", "elogio", "bom trabalho"] },
  { type: "warning", words: ["advertencia", "punicao", "ultima chance"] },
  { type: "crisis", words: ["crise", "urgente", "emergencia"] },
  { type: "training", words: ["treinamento", "curso", "aprender", "mentoria"] },
  { type: "negotiation", words: ["negociar", "proposta", "acordo"] },
  { type: "accountability", words: ["cobranca", "resultado", "atraso", "meta nao"] },
  { type: "evaluation", words: ["avaliacao", "desempenho", "avaliar"] },
  { type: "feedback", words: ["feedback", "melhorar", "retorno"] },
  { type: "debate", words: ["debate", "opinioes", "alternativas", "o que acha"] },
  { type: "technical", words: ["tecnica", "tatico", "analise", "metodo"] },
  { type: "alignment", words: ["alinhar", "alinhamento", "combinado"] },
  { type: "planning", words: ["planejar", "planejamento", "prazo", "objetivo"] },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function seededNumber(seed: string, salt: string) {
  let hash = 2166136261;
  const input = `${seed}:${salt}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function generatePersonality(seed: string) {
  const concepts = Object.fromEntries(
    PERSONALITY_CONCEPTS.map((concept) => [concept, Math.floor(seededNumber(seed, concept) * 6)]),
  ) as PersonalityLevels;
  const coreCount = 3 + Math.floor(seededNumber(seed, "core-count") * 3);
  const coreConcepts = [...PERSONALITY_CONCEPTS]
    .sort((a, b) => concepts[b] - concepts[a] || seededNumber(seed, b) - seededNumber(seed, a))
    .slice(0, coreCount);
  coreConcepts.forEach((concept, index) => {
    concepts[concept] = Math.max(concepts[concept], index === 0 ? 5 : 3);
  });
  return { concepts, coreConcepts };
}

export function generateNaturalTalents(seed: string, aptitudeKeys: string[]) {
  return Object.fromEntries(aptitudeKeys.map((key) => [key, Math.round(seededNumber(seed, `talent:${key}`) * 100)]));
}

export function naturalTalentModifier(talent: number) {
  return round((clamp(talent, 0, 100) - 50) * 0.16, 2);
}

export function satisfactionBand(score: number) {
  const safe = clamp(score, 0, 100);
  if (safe <= 14) return { label: "Hostil", qualityModifier: -10 };
  if (safe <= 29) return { label: "Muito insatisfeito", qualityModifier: -7 };
  if (safe <= 44) return { label: "Insatisfeito", qualityModifier: -4 };
  if (safe <= 59) return { label: "Neutro", qualityModifier: 0 };
  if (safe <= 74) return { label: "Satisfeito", qualityModifier: 1 };
  if (safe <= 89) return { label: "Muito satisfeito", qualityModifier: 3 };
  return { label: "Altamente comprometido", qualityModifier: 5 };
}

export function calculateAppliedQuality(input: {
  aptitude: number;
  naturalTalent: number;
  temporaryModifiers?: number;
  satisfaction: number;
}) {
  return round(clamp(
    input.aptitude
      + naturalTalentModifier(input.naturalTalent)
      + (input.temporaryModifiers || 0)
      + satisfactionBand(input.satisfaction).qualityModifier,
    0,
    100,
  ));
}

export function describePersonality(levels: PersonalityLevels, evidence: number) {
  if (evidence < 15) return [{ concept: null, label: "Ainda desconhecido", confidence: "low" as const }];
  return PERSONALITY_CONCEPTS
    .filter((concept) => levels[concept] >= 4 || levels[concept] <= 1)
    .sort((a, b) => Math.abs(levels[b] - 2.5) - Math.abs(levels[a] - 2.5))
    .slice(0, evidence < 45 ? 2 : evidence < 75 ? 3 : 5)
    .map((concept) => ({
      concept,
      label: evidence < 45 ? CONCEPT_LABELS[concept].hint : levels[concept] >= 4 ? CONCEPT_LABELS[concept].high : CONCEPT_LABELS[concept].low,
      confidence: evidence < 45 ? "medium" as const : "high" as const,
    }));
}

export function isMeetingInterpretation(value: unknown): value is MeetingInterpretation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MeetingInterpretation>;
  return Boolean(
    item.meetingClassification
      && item.tone
      && Array.isArray(item.topics)
      && Array.isArray(item.instructions)
      && Array.isArray(item.promises)
      && Array.isArray(item.complaints)
      && Array.isArray(item.praise)
      && typeof item.hasDebateSpace === "boolean"
      && typeof item.isCollective === "boolean"
      && typeof item.isClear === "boolean"
      && typeof item.suggestedNarrative === "string",
  );
}

export function classifyMeeting(originalText: string, options: { collective?: boolean; previousSubjects?: string[] } = {}): MeetingInterpretation {
  const text = normalizeText(originalText);
  const match = MEETING_KEYWORDS.find((entry) => entry.words.some((word) => text.includes(word)));
  const hostile = ["incompetente", "ridiculo", "cale a boca", "demitido se"].some((word) => text.includes(word));
  const critical = ["cobranca", "erro", "falhou", "insatisfeito", "advertencia"].some((word) => text.includes(word));
  const supportive = ["parabens", "confio", "apoio", "bom trabalho"].some((word) => text.includes(word));
  const direct = ["deve", "precisa", "determinei", "ordem", "faca"].some((word) => text.includes(word));
  const type = options.collective && !match ? "collective" : match?.type || (text.length > 140 ? "alignment" : "private");
  const dates = originalText.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || [];
  const promiseSentences = originalText
    .split(/[.!?\n]+/)
    .filter((sentence) => /\b(prometo|vamos garantir|me comprometo|sera entregue)\b/i.test(sentence));
  const promises = promiseSentences.slice(0, 5).map((sentence, index) => ({
    description: sentence.trim().slice(0, 600),
    deadline: dates[index] ? parseBrazilianDate(dates[index]) : null,
    importance: /salario|promoc|estrutura|contrato/i.test(sentence) ? 4 : 2,
  }));
  const topics = MEETING_KEYWORDS
    .filter((entry) => entry.words.some((word) => text.includes(word)))
    .map((entry) => entry.type)
    .slice(0, 6);
  const hasDebateSpace = /o que (acha|pensa)|sua opiniao|podemos discutir|alternativas|sugest/i.test(text);
  const isClear = originalText.trim().length >= 55 && /\b(meta|prazo|objetivo|responsavel|decid|proximo|ate|deve|vamos)\b/i.test(text);
  const normalizedLead = text.slice(0, 80);
  const isRepetitive = (options.previousSubjects || []).some((subject) => normalizeText(subject).slice(0, 80) === normalizedLead);
  const instructions = originalText.split(/[.!?\n]+/).filter((sentence) => /\b(deve|precisa|faca|organize|avalie|prepare)\b/i.test(sentence)).map((item) => item.trim()).slice(0, 6);
  const praise = originalText.split(/[.!?\n]+/).filter((sentence) => /\b(parabens|excelente|bom trabalho|reconheco)\b/i.test(sentence)).map((item) => item.trim()).slice(0, 5);
  const complaints = originalText.split(/[.!?\n]+/).filter((sentence) => /\b(problema|reclam|insatisfeito|atraso|erro)\b/i.test(sentence)).map((item) => item.trim()).slice(0, 5);
  return {
    meetingClassification: type,
    tone: hostile ? "hostile" : supportive ? "supportive" : critical ? "critical" : direct ? "direct" : hasDebateSpace ? "respectful" : "neutral",
    topics: topics.length ? topics : [type],
    instructions,
    promises,
    complaints,
    praise,
    hasDebateSpace,
    isCollective: Boolean(options.collective),
    isClear,
    isRepetitive,
    suggestedNarrative: hostile
      ? "A forma da conversa gerou forte desconforto."
      : isClear
        ? "A reuniao produziu uma orientacao compreensivel e aplicavel."
        : "A reuniao terminou sem um encaminhamento suficientemente claro.",
  };
}

function parseBrazilianDate(value: string) {
  const [day, month, yearValue] = value.split("/").map(Number);
  const year = yearValue ? (yearValue < 100 ? 2000 + yearValue : yearValue) : new Date().getUTCFullYear();
  if (!day || !month) return null;
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();
}

export function calculateMeetingTolerance(
  concepts: PersonalityLevels,
  state: EmployeeState,
  meeting: Pick<MeetingInterpretation, "meetingClassification" | "isCollective" | "hasDebateSpace">,
) {
  let tolerance = 2;
  if (concepts.diligence >= 4) tolerance += 1;
  if (concepts.ambition >= 4) tolerance += 1;
  if (concepts.learning >= 4) tolerance += 1;
  if (concepts.sociability >= 4 && meeting.isCollective) tolerance += 1;
  if (concepts.autonomy >= 4 && ["accountability", "warning"].includes(meeting.meetingClassification)) tolerance -= 1;
  if (concepts.contention >= 4 && !meeting.hasDebateSpace) tolerance -= 1;
  if (concepts.sociability <= 1 && meeting.isCollective) tolerance -= 1;
  if (state.workload > 75) tolerance -= 1;
  if (state.meetingFatigue > 70) tolerance -= 1;
  return clamp(tolerance, 1, 6);
}

export function evaluateMeeting(input: {
  employeeId: string;
  concepts: PersonalityLevels;
  state: EmployeeState;
  interpretation: MeetingInterpretation;
  recentMeetingCount: number;
  aptitudeTarget: string;
}) : MeetingEvaluation {
  const { concepts, state, interpretation, recentMeetingCount } = input;
  const tolerance = calculateMeetingTolerance(concepts, state, interpretation);
  let satisfaction = interpretation.meetingClassification === "praise" ? 2 : interpretation.isClear ? 2 : -2;
  let trust = interpretation.tone === "respectful" || interpretation.tone === "supportive" ? 1 : 0;
  let morale = interpretation.meetingClassification === "praise" ? 2 : interpretation.isClear ? 1 : 0;
  let fatigue = 4 + Math.min(10, recentMeetingCount * 2);
  let learningScore = interpretation.isClear && ["training", "technical", "planning", "feedback", "debate"].includes(interpretation.meetingClassification) ? 0.08 : 0;
  const warnings: string[] = [];

  if (interpretation.tone === "hostile") { satisfaction -= 7; trust -= 6; morale -= 5; warnings.push("A forma hostil pode provocar reclamacao ou pedido de demissao."); }
  if (interpretation.meetingClassification === "praise") satisfaction += concepts.recognition >= 4 ? 3 : 1;
  if (concepts.diligence >= 4) satisfaction += interpretation.isClear ? 1 : -2;
  if (concepts.ambition >= 4) satisfaction += ["promotion", "planning", "debate"].includes(interpretation.meetingClassification) ? 2 : 0;
  if (concepts.learning >= 4 && learningScore > 0) { satisfaction += 1; learningScore += 0.04; }
  if (concepts.autonomy >= 4) {
    if (["accountability", "warning"].includes(interpretation.meetingClassification) && !interpretation.hasDebateSpace) { satisfaction -= 5; trust -= 2; }
    if (interpretation.hasDebateSpace) trust += 1;
  }
  if (concepts.sociability >= 4 && interpretation.isCollective) satisfaction += 2;
  if (concepts.sociability <= 1 && interpretation.isCollective) { satisfaction -= 2; fatigue += 4; }
  if (concepts.contention >= 4) {
    if (interpretation.hasDebateSpace) { satisfaction += 2; learningScore += 0.02; }
    else if (["accountability", "warning"].includes(interpretation.meetingClassification)) { satisfaction -= 2; trust -= 2; warnings.push("O funcionario esperava espaco para argumentar."); }
  }
  if (concepts.integrity >= 4 && /ocult|mentir|distor|manipul/i.test(interpretation.instructions.join(" "))) {
    satisfaction -= 10; trust -= 7; warnings.push("A orientacao conflita com a integridade do funcionario.");
  }
  if (state.workload > 75) { satisfaction -= 1; fatigue += 3; }
  if (interpretation.isRepetitive) { satisfaction -= 2; learningScore = 0; warnings.push("O conteudo repetiu uma reuniao recente."); }

  const meetingsAbove = Math.max(0, recentMeetingCount + 1 - tolerance);
  const absorption = meetingsAbove === 0 ? 1 : meetingsAbove === 1 ? 0.35 : 0.1;
  if (meetingsAbove > 0) { satisfaction -= meetingsAbove === 1 ? 1 : 3; fatigue += meetingsAbove * 3; }
  const aptitudeDelta = interpretation.isRepetitive ? 0 : clamp(round(learningScore * absorption, 3), 0, 0.18);
  satisfaction = clamp(satisfaction, -12, 10);
  trust = clamp(trust, -12, 10);
  morale = clamp(morale, -12, 10);
  fatigue = clamp(fatigue, 0, 25);
  const qualityScore = clamp(50 + satisfaction * 4 + trust * 2 - fatigue, 0, 100);
  return {
    satisfactionDelta: satisfaction,
    trustDelta: trust,
    moraleDelta: morale,
    fatigueDelta: fatigue,
    aptitudeDelta,
    aptitudeTarget: input.aptitudeTarget,
    playerMoraleDelta: 0,
    relationshipDeltas: [{
      targetType: "user",
      targetId: "club-leader",
      relationshipDelta: clamp(Math.round((satisfaction + trust) / 3), -5, 5),
      trustDelta: clamp(trust, -5, 5),
      conflictDelta: satisfaction < -3 ? 3 : satisfaction > 2 ? -1 : 0,
    }],
    commitments: interpretation.instructions,
    tasks: interpretation.instructions,
    warnings,
    promises: interpretation.promises,
    importance: interpretation.promises.length || Math.abs(satisfaction) >= 5 ? 4 : 2,
    tolerance,
    recentMeetingCount,
    qualityScore,
    reportTone: satisfaction <= -5 ? "critical" : satisfaction < 0 ? "concern" : satisfaction >= 3 ? "positive" : "neutral",
    narrative: warnings.some((warning) => warning.includes("integridade"))
      ? "A orientacao entrou em conflito direto com os principios do funcionario."
      : warnings.some((warning) => warning.includes("argumentar"))
        ? "A ordem foi entendida, mas a falta de espaco para debate reduziu o comprometimento."
        : interpretation.suggestedNarrative,
  };
}

export function calculateCourseTolerance(concepts: PersonalityLevels, state: EmployeeState, options: { forced: boolean; repeated: boolean }) {
  let tolerance = 1;
  if (concepts.diligence >= 4) tolerance += 1;
  if (concepts.ambition >= 4) tolerance += 1;
  if (concepts.learning >= 4) tolerance += 2;
  if (concepts.autonomy >= 4 && options.forced) tolerance -= 1;
  if (concepts.contention >= 4 && options.repeated) tolerance -= 1;
  if (state.workload > 75) tolerance -= 1;
  if (state.trainingFatigue > 70) tolerance -= 1;
  return clamp(tolerance, 1, 5);
}

export function calculateCourseSaturation(completionsWithin180Days: number) {
  if (completionsWithin180Days <= 0) return 1;
  if (completionsWithin180Days === 1) return 0.65;
  if (completionsWithin180Days === 2) return 0.35;
  return 0.15;
}

export function calculateCourseReaction(input: {
  concepts: PersonalityLevels;
  state: EmployeeState;
  forced: boolean;
  selectedByEmployee: boolean;
  repeated: boolean;
  relatedToRole: boolean;
  recentCourseCount: number;
  courseLevel: "basic" | "intermediate" | "advanced";
}) {
  const tolerance = calculateCourseTolerance(input.concepts, input.state, { forced: input.forced, repeated: input.repeated });
  let satisfactionDelta = input.relatedToRole ? 0 : -3;
  if (input.concepts.diligence >= 4 && input.relatedToRole) satisfactionDelta += 1;
  if (input.concepts.ambition >= 4 && input.courseLevel === "advanced") satisfactionDelta += 2;
  if (input.concepts.learning >= 4) satisfactionDelta += input.repeated && input.courseLevel === "basic" ? -1 : 2;
  if (input.concepts.autonomy >= 4) satisfactionDelta += input.selectedByEmployee ? 2 : input.forced ? -3 : 0;
  if (input.concepts.contention >= 4 && input.repeated) satisfactionDelta -= 2;
  if (input.recentCourseCount >= tolerance) satisfactionDelta -= 2;
  const refusalRisk = clamp(
    (input.state.satisfaction < 30 ? 35 : 0)
      + (input.state.workload > 80 ? 20 : 0)
      + (input.state.trainingFatigue > 70 ? 20 : 0)
      + (input.forced && input.concepts.autonomy >= 4 ? 20 : 0)
      + (input.repeated && input.concepts.contention >= 4 ? 15 : 0),
    0,
    95,
  );
  return {
    tolerance,
    satisfactionDelta: clamp(satisfactionDelta, -8, 6),
    fatigueDelta: clamp(12 + Math.max(0, input.recentCourseCount - tolerance + 1) * 8, 4, 30),
    refusalRisk,
    response: refusalRisk >= 60 ? "question" as const : satisfactionDelta >= 2 ? "positive" as const : satisfactionDelta <= -3 ? "resistant" as const : "neutral" as const,
  };
}

export function selectAdvisorForEvent(employees: Array<{ id: string; roleId: string; status: string }>, eventType: string) {
  const priorities: Record<string, string[]> = {
    staff: ["admin-manager", "admin-staff", "football-manager", "football-director"],
    meeting: ["admin-manager", "admin-staff", "football-manager", "football-director"],
    course: ["admin-manager", "admin-staff", "football-manager"],
    squad: ["head-coach", "assistant-coach", "football-director"],
    fitness: ["fitness-coach", "physiologist", "doctor"],
    injury: ["doctor", "physiotherapist"],
    morale: ["psychologist", "head-coach", "admin-manager"],
    communication: ["press-officer", "marketing-manager"],
    logistics: ["admin-manager", "admin-staff"],
  };
  const active = employees.filter((employee) => employee.status === "active");
  for (const role of priorities[eventType] || priorities.staff) {
    const found = active.find((employee) => employee.roleId === role);
    if (found) return found;
  }
  return active[0] || null;
}

export function evaluatePromiseStatus(deadline: string | null, status: string, now = new Date()) {
  if (status !== "active" || !deadline) return status;
  return new Date(deadline).getTime() < now.getTime() ? "broken" : "active";
}

export function processEmployeeDailyState(state: EmployeeState, concepts: PersonalityLevels, elapsedDays: number) {
  const days = clamp(elapsedDays, 0, 30);
  const resilience = concepts.resilience >= 4 ? 1.5 : concepts.resilience <= 1 ? 0.65 : 1;
  const satisfactionRecovery = state.satisfaction < 55 ? Math.min(55 - state.satisfaction, days * 0.35 * resilience) : 0;
  return {
    ...state,
    satisfaction: round(clamp(state.satisfaction + satisfactionRecovery, 0, 100)),
    meetingFatigue: round(clamp(state.meetingFatigue - days * 6 * resilience, 0, 100)),
    trainingFatigue: round(clamp(state.trainingFatigue - days * 3.5 * resilience, 0, 100)),
  };
}
