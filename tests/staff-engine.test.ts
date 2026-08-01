import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAppliedQuality,
  calculateCourseReaction,
  calculateCourseSaturation,
  calculateMeetingTolerance,
  classifyMeeting,
  describePersonality,
  evaluateMeeting,
  evaluatePromiseStatus,
  generateNaturalTalents,
  generatePersonality,
  naturalTalentModifier,
  PERSONALITY_CONCEPTS,
  processEmployeeDailyState,
  satisfactionBand,
  selectAdvisorForEvent,
  TUTORIAL_STEPS,
  type EmployeeState,
  type PersonalityConcept,
  type PersonalityLevels,
} from "../lib/staff/engine.ts";

const neutralState: EmployeeState = { satisfaction: 60, trust: 55, morale: 60, workload: 50, meetingFatigue: 0, trainingFatigue: 0 };

function concepts(values: Partial<PersonalityLevels> = {}) {
  return Object.assign(Object.fromEntries(PERSONALITY_CONCEPTS.map((concept) => [concept, 2])) as PersonalityLevels, values);
}

function meetingResult(levels: PersonalityLevels, text: string, options: { collective?: boolean; recent?: number } = {}) {
  const interpretation = classifyMeeting(text, { collective: options.collective });
  return evaluateMeeting({ employeeId: "employee", concepts: levels, state: neutralState, interpretation, recentMeetingCount: options.recent || 0, aptitudeTarget: "management" });
}

test("personalidade: gera treze conceitos e tres a cinco centrais de forma estavel", () => {
  const first = generatePersonality("employee-1");
  const second = generatePersonality("employee-1");
  assert.deepEqual(first, second);
  assert.equal(Object.keys(first.concepts).length, 13);
  assert.ok(first.coreConcepts.length >= 3 && first.coreConcepts.length <= 5);
  assert.ok(Object.values(first.concepts).every((level) => level >= 0 && level <= 5));
});

test("personalidade: diligente e ambicioso reage bem ao planejamento produtivo", () => {
  const result = meetingResult(concepts({ diligence: 5, ambition: 5 }), "Vamos planejar o objetivo, definir o responsavel e entregar ate sexta-feira.");
  assert.ok(result.satisfactionDelta >= 4);
});

test("personalidade: autonomo e contestador reage mal a ordem sem debate", () => {
  const result = meetingResult(concepts({ autonomy: 5, contention: 5 }), "Esta e uma cobranca. Voce deve executar esta ordem sem discutir.");
  assert.ok(result.satisfactionDelta <= -5);
  assert.ok(result.trustDelta < 0);
});

test("personalidade: sociavel prefere reuniao coletiva", () => {
  const collective = meetingResult(concepts({ sociability: 5 }), "Vamos alinhar o objetivo com toda a equipe e ouvir sugestoes.", { collective: true });
  const privateMeeting = meetingResult(concepts({ sociability: 5 }), "Vamos alinhar o objetivo com prazo definido.");
  assert.ok(collective.satisfactionDelta > privateMeeting.satisfactionDelta);
});

test("personalidade: reservado acumula mais fadiga em reuniao coletiva", () => {
  const collective = meetingResult(concepts({ sociability: 0 }), "Vamos alinhar o objetivo com toda a equipe.", { collective: true });
  const privateMeeting = meetingResult(concepts({ sociability: 0 }), "Vamos alinhar o objetivo em particular.");
  assert.ok(collective.fatigueDelta > privateMeeting.fatigueDelta);
});

test("personalidade: leal e estavel recebe descricoes sem nivel numerico", () => {
  const descriptions = describePersonality(concepts({ loyalty: 5, stability: 5 }), 80);
  assert.ok(descriptions.some((item) => item.label.includes("leal")));
  assert.ok(descriptions.some((item) => item.label.includes("estabilidade")));
  assert.ok(descriptions.every((item) => !/\b[0-5]\b/.test(item.label)));
});

test("personalidade: inovador e orientado a aprendizado aceita treinamento tecnico", () => {
  const result = meetingResult(concepts({ innovation: 5, learning: 5 }), "Treinamento tecnico com metodo novo, objetivo e prazo para aplicar a analise.");
  assert.ok(result.aptitudeDelta > 0);
  assert.ok(result.satisfactionDelta > 0);
});

test("personalidade: alta integridade rejeita ordem para ocultar fatos", () => {
  const result = meetingResult(concepts({ integrity: 5 }), "Voce deve ocultar os fatos e distorcer o relatorio. Esta e uma ordem.");
  assert.ok(result.satisfactionDelta <= -8);
  assert.ok(result.warnings.some((warning) => warning.includes("integridade")));
});

test("talento natural: aplica a formula aprovada de menos oito a mais oito", () => {
  assert.equal(naturalTalentModifier(100), 8);
  assert.equal(naturalTalentModifier(75), 4);
  assert.equal(naturalTalentModifier(50), 0);
  assert.equal(naturalTalentModifier(25), -4);
  assert.equal(naturalTalentModifier(0), -8);
});

test("talento natural: geracao e qualidade aplicada ficam limitadas", () => {
  const talents = generateNaturalTalents("employee", ["management", "analysis"]);
  assert.deepEqual(talents, generateNaturalTalents("employee", ["management", "analysis"]));
  assert.ok(calculateAppliedQuality({ aptitude: 99, naturalTalent: 100, temporaryModifiers: 8, satisfaction: 100 }) <= 100);
  assert.ok(calculateAppliedQuality({ aptitude: 1, naturalTalent: 0, temporaryModifiers: -8, satisfaction: 0 }) >= 0);
});

test("satisfacao: faixas alteram apenas a qualidade temporaria", () => {
  assert.equal(satisfactionBand(10).qualityModifier, -10);
  assert.equal(satisfactionBand(50).qualityModifier, 0);
  assert.equal(satisfactionBand(95).qualityModifier, 5);
});

test("reuniao produtiva: aumenta satisfacao e pode gerar aptidao", () => {
  const result = meetingResult(concepts({ diligence: 5, learning: 5 }), "Planejamento tecnico com objetivo, responsavel e prazo ate sexta-feira.");
  assert.ok(result.satisfactionDelta > 0);
  assert.ok(result.aptitudeDelta > 0 && result.aptitudeDelta <= 0.18);
});

test("reuniao vaga: reduz satisfacao e nao gera aptidao", () => {
  const result = meetingResult(concepts({ diligence: 5 }), "Vamos conversar sobre as coisas.");
  assert.ok(result.satisfactionDelta < 0);
  assert.equal(result.aptitudeDelta, 0);
});

test("varias reunioes: primeira acima usa 35% e demais usam 10%", () => {
  const levels = concepts({ diligence: 4 });
  const text = "Treinamento tecnico com objetivo, responsavel e prazo definido para aplicar o metodo.";
  const interpretation = classifyMeeting(text);
  const tolerance = calculateMeetingTolerance(levels, neutralState, interpretation);
  const within = meetingResult(levels, text, { recent: tolerance - 1 });
  const firstAbove = meetingResult(levels, text, { recent: tolerance });
  const secondAbove = meetingResult(levels, text, { recent: tolerance + 1 });
  assert.ok(firstAbove.aptitudeDelta < within.aptitudeDelta);
  assert.ok(secondAbove.aptitudeDelta < firstAbove.aptitudeDelta);
});

test("cobranca publica: tom hostil causa impacto grave", () => {
  const result = meetingResult(concepts({ recognition: 5 }), "Esta cobranca e publica. Seu trabalho foi ridiculo e voce sera demitido se falhar.", { collective: true });
  assert.ok(result.satisfactionDelta <= -8);
  assert.equal(result.reportTone, "critical");
});

test("elogio particular: aumenta satisfacao e moral", () => {
  const result = meetingResult(concepts({ recognition: 5 }), "Parabens pelo excelente trabalho. Reconheco sua organizacao e confio em voce.");
  assert.ok(result.satisfactionDelta >= 4);
  assert.ok(result.moraleDelta > 0);
});

test("reuniao coletiva: sociavel e reservado recebem efeitos diferentes", () => {
  const social = meetingResult(concepts({ sociability: 5 }), "Vamos alinhar o objetivo com toda a equipe e ouvir sugestoes.", { collective: true });
  const reserved = meetingResult(concepts({ sociability: 0 }), "Vamos alinhar o objetivo com toda a equipe e ouvir sugestoes.", { collective: true });
  assert.ok(social.satisfactionDelta > reserved.satisfactionDelta);
});

test("promessa criada: interpretacao extrai descricao, prazo e importancia", () => {
  const interpretation = classifyMeeting("Prometo melhorar a estrutura ate 30/08/2026. Vamos definir o responsavel e o prazo.");
  assert.equal(interpretation.promises.length, 1);
  assert.equal(interpretation.promises[0].deadline, "2026-08-30T23:59:59.000Z");
  assert.equal(interpretation.promises[0].importance, 4);
});

test("promessa cumprida: permanece identificavel como cumprida", () => {
  assert.equal(evaluatePromiseStatus("2026-08-30T00:00:00Z", "fulfilled", new Date("2026-09-01")), "fulfilled");
});

test("promessa quebrada: prazo vencido transforma promessa ativa", () => {
  assert.equal(evaluatePromiseStatus("2026-08-30T00:00:00Z", "active", new Date("2026-09-01")), "broken");
});

test("ordem para autonomo: perde mais satisfacao do que metas com liberdade", () => {
  const levels = concepts({ autonomy: 5 });
  const order = meetingResult(levels, "Esta e uma cobranca. Voce deve seguir cada detalhe desta ordem sem discutir.");
  const freedom = meetingResult(levels, "Vamos planejar a meta e o prazo. Voce tera liberdade e pode sugerir alternativas.");
  assert.ok(order.satisfactionDelta < freedom.satisfactionDelta);
});

test("debate com contestador: melhora satisfacao e aprendizado", () => {
  const result = meetingResult(concepts({ contention: 5 }), "Quero sua opiniao neste debate. Vamos discutir alternativas, objetivo e prazo.");
  assert.ok(result.satisfactionDelta > 0);
  assert.ok(result.aptitudeDelta > 0);
});

test("curso: primeiro conteudo recebe ganho integral", () => assert.equal(calculateCourseSaturation(0), 1));
test("curso: segunda repeticao em 180 dias recebe 65%", () => assert.equal(calculateCourseSaturation(1), 0.65));
test("curso: terceira repeticao em 180 dias recebe 35%", () => assert.equal(calculateCourseSaturation(2), 0.35));
test("curso: quarta repeticao em 180 dias recebe 15%", () => assert.equal(calculateCourseSaturation(3), 0.15));

test("curso: conteudo diferente nao sofre penalidade de repeticao", () => {
  const reaction = calculateCourseReaction({ concepts: concepts({ learning: 5 }), state: neutralState, forced: false, selectedByEmployee: false, repeated: false, relatedToRole: true, recentCourseCount: 0, courseLevel: "intermediate" });
  assert.ok(reaction.satisfactionDelta > 0);
});

test("curso imposto: autonomo reage pior", () => {
  const levels = concepts({ autonomy: 5 });
  const imposed = calculateCourseReaction({ concepts: levels, state: neutralState, forced: true, selectedByEmployee: false, repeated: false, relatedToRole: true, recentCourseCount: 0, courseLevel: "intermediate" });
  const chosen = calculateCourseReaction({ concepts: levels, state: neutralState, forced: false, selectedByEmployee: true, repeated: false, relatedToRole: true, recentCourseCount: 0, courseLevel: "intermediate" });
  assert.ok(imposed.satisfactionDelta < chosen.satisfactionDelta);
});

test("curso escolhido: autonomia aumenta satisfacao", () => {
  const reaction = calculateCourseReaction({ concepts: concepts({ autonomy: 5 }), state: neutralState, forced: false, selectedByEmployee: true, repeated: false, relatedToRole: true, recentCourseCount: 0, courseLevel: "intermediate" });
  assert.ok(reaction.satisfactionDelta >= 2);
});

test("curso para ambicioso: nivel avancado e bem recebido", () => {
  const reaction = calculateCourseReaction({ concepts: concepts({ ambition: 5 }), state: neutralState, forced: false, selectedByEmployee: false, repeated: false, relatedToRole: true, recentCourseCount: 0, courseLevel: "advanced" });
  assert.ok(reaction.satisfactionDelta >= 2);
});

test("curso para resistente: baixa satisfacao e fadiga elevam risco de recusa", () => {
  const reaction = calculateCourseReaction({ concepts: concepts({ autonomy: 5, contention: 5 }), state: { ...neutralState, satisfaction: 20, workload: 90, trainingFatigue: 80 }, forced: true, selectedByEmployee: false, repeated: true, relatedToRole: true, recentCourseCount: 4, courseLevel: "basic" });
  assert.ok(reaction.refusalRisk >= 60);
  assert.equal(reaction.response, "question");
});

test("orientacao: escolhe coordenador administrativo para contratacoes e reunioes", () => {
  const advisor = selectAdvisorForEvent([
    { id: "coach", roleId: "head-coach", status: "active" },
    { id: "admin", roleId: "admin-manager", status: "active" },
  ], "meeting");
  assert.equal(advisor?.id, "admin");
});

test("orientacao: escolhe psicologo para moral e conflitos", () => {
  const advisor = selectAdvisorForEvent([
    { id: "coach", roleId: "head-coach", status: "active" },
    { id: "psych", roleId: "psychologist", status: "active" },
  ], "morale");
  assert.equal(advisor?.id, "psych");
});

test("estado diario: resiliencia acelera recuperacao e reduz fadiga", () => {
  const resilient = processEmployeeDailyState({ ...neutralState, satisfaction: 30, meetingFatigue: 80, trainingFatigue: 70 }, concepts({ resilience: 5 }), 3);
  const fragile = processEmployeeDailyState({ ...neutralState, satisfaction: 30, meetingFatigue: 80, trainingFatigue: 70 }, concepts({ resilience: 0 }), 3);
  assert.ok(resilient.satisfaction > fragile.satisfaction);
  assert.ok(resilient.meetingFatigue < fragile.meetingFatigue);
});

test("tutorial: possui dez etapas progressivas e alvos contextuais", () => {
  assert.equal(TUTORIAL_STEPS.length, 10);
  assert.deepEqual(TUTORIAL_STEPS.map((step) => step.id), [1,2,3,4,5,6,7,8,9,10]);
  assert.ok(TUTORIAL_STEPS.every((step) => step.target.length > 0));
  assert.ok(TUTORIAL_STEPS.every((step) => step.route.startsWith("/") && step.actionLabel.length > 0));
});

test("conceitos: lista aprovada permanece completa", () => {
  const expected: PersonalityConcept[] = ["diligence", "ambition", "learning", "autonomy", "loyalty", "stability", "sociability", "recognition", "discipline", "contention", "innovation", "resilience", "integrity"];
  assert.deepEqual(PERSONALITY_CONCEPTS, expected);
});
