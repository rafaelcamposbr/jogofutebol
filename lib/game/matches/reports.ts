import { clamp, createSeededRandom } from "../random.ts";
import type { MatchInput, MatchPlayer, MatchReportView, MatchSimulation, StaffAssignmentArea } from "./types.ts";

export type MatchStaffProfile = {
  id: string;
  name: string;
  roleId: string;
  roleLabel: string;
  area: StaffAssignmentArea;
  functionalAptitude: number;
  experience: number;
  familiarity: number;
  facilitiesQuality: number;
  dataQuality: number;
  satisfaction: number;
  workload: number;
  relationship: number;
  relevantCourses: number;
};

export type MatchPresentation = {
  reports: MatchReportView[];
  commission: { consensus: string[]; divergences: string[]; recommendation: string; contributors: string[] };
  basicStats: Array<{ label: string; home: string | number; away: string | number }>;
  advancedStats: Array<{ label: string; home: string | number; away: string | number; confidence: string }>;
  players: Array<{ id: string; name: string; position: string; minutes: number; rating: number | null; classification: string; goals: number; assists: number; keyActions: string[] }>;
};

export function reportAccuracy(profile: MatchStaffProfile) {
  const positive = profile.relevantCourses * 2 + Math.max(0, profile.relationship - 60) * 0.08 + Math.max(0, profile.satisfaction - 70) * 0.06;
  const negative = Math.max(0, profile.workload - 70) * 0.16 + (profile.familiarity < 30 ? 5 : 0) + (profile.satisfaction < 35 ? 5 : 0);
  return clamp(
    20 + profile.functionalAptitude * 0.5 + profile.familiarity * 0.15
      + profile.facilitiesQuality * 0.1 + profile.dataQuality * 0.1 + positive - negative,
    10,
    95,
  );
}

export function confidenceLabel(accuracy: number): "Baixa" | "Moderada" | "Alta" {
  if (accuracy < 52) return "Baixa";
  if (accuracy < 76) return "Moderada";
  return "Alta";
}

export function buildPreMatchAdvice(input: MatchInput, staff: MatchStaffProfile[]) {
  const coach = staff.find((item) => ["head-coach", "assistant-coach"].includes(item.roleId));
  const tired = input.home.players.filter((player) => player.condition - player.fatigue < 65);
  const noRhythm = input.home.players.filter((player) => player.condition >= 80 && player.fatigue < 10 && player.overall < 50);
  if (!coach) return {
    title: "Decisao sob responsabilidade da diretoria",
    summary: `A estrutura ${input.home.formation} esta registrada, mas nao ha tecnico ou auxiliar designado para assinar a leitura pre-jogo.`,
    strengths: ["Escalacao e plano tatico foram capturados"],
    risks: ["Sem responsavel tecnico, as adaptacoes automaticas terao leitura limitada"],
    alternatives: ["Designar um profissional da equipe tecnica antes de iniciar"],
  };
  return {
    title: `Plano recomendado por ${coach.name}`,
    summary: `Manter a estrutura ${input.home.formation}, controlar o centro e preparar respostas automaticas contra ${input.away.name}.`,
    strengths: ["Estrutura inicial equilibrada", "Banco preservado para ajustes automáticos"],
    risks: [
      tired.length ? `${tired.length} jogador(es) chegam com prontidao reduzida` : "Perdas no centro podem gerar transicoes",
      noRhythm.length ? `${noRhythm.length} jogador(es) podem sentir falta de ritmo` : "A intensidade precisa ser administrada",
    ],
    alternatives: ["Delegar as decisoes durante o jogo", "Revisar escalação e funções no modulo de tatica"],
  };
}

export function buildPostMatchPresentation(input: MatchInput, simulation: MatchSimulation, staff: MatchStaffProfile[]): MatchPresentation {
  const reports = staff.map((profile) => buildStaffReport(input, simulation, profile));
  const analysts = staff.filter((item) => ["performance-analyst", "performance-analysis-coordinator"].includes(item.roleId));
  const bestAnalyst = analysts.sort((first, second) => reportAccuracy(second) - reportAccuracy(first))[0];
  const analystAccuracy = bestAnalyst ? reportAccuracy(bestAnalyst) : 0;
  const basicStats = buildBasicStats(simulation);
  const advancedStats = bestAnalyst ? buildAdvancedStats(input, simulation, analystAccuracy) : [];
  const players = input.home.players.map((player) => playerPresentation(player, simulation, analystAccuracy));
  return { reports, basicStats, advancedStats, players, commission: buildCommissionView(simulation, reports) };
}

function buildBasicStats(simulation: MatchSimulation) {
  const home = simulation.teamStats.home;
  const away = simulation.teamStats.away;
  return [
    { label: "Posse aproximada", home: `${Math.round(home.possession)}%`, away: `${Math.round(away.possession)}%` },
    { label: "Finalizacoes", home: home.shots, away: away.shots },
    { label: "No alvo", home: home.shotsOnTarget, away: away.shotsOnTarget },
    { label: "Escanteios", home: home.corners, away: away.corners },
    { label: "Faltas", home: home.fouls, away: away.fouls },
    { label: "Cartoes", home: home.yellowCards + home.redCards, away: away.yellowCards + away.redCards },
    { label: "Impedimentos", home: home.offsides, away: away.offsides },
  ];
}

function perceived(input: MatchInput, value: number, accuracy: number, key: string, decimals = 0) {
  const random = createSeededRandom(`${input.seed}:report:${key}`);
  const error = (1 - accuracy / 100) * Math.max(1, Math.abs(value) * 0.22);
  const result = Math.max(0, value + (random.next() * 2 - 1) * error);
  return Number(result.toFixed(decimals));
}

function buildAdvancedStats(input: MatchInput, simulation: MatchSimulation, accuracy: number) {
  const home = simulation.teamStats.home;
  const away = simulation.teamStats.away;
  const confidence = confidenceLabel(accuracy);
  const metrics = [
    { label: "xG estimado", home: perceived(input, home.xg, accuracy, "home-xg", 2), away: perceived(input, away.xg, accuracy, "away-xg", 2) },
    { label: "Precisao de passes", home: `${perceived(input, home.passesCompleted / Math.max(1, home.passAttempts) * 100, accuracy, "home-pass")}%`, away: `${perceived(input, away.passesCompleted / Math.max(1, away.passAttempts) * 100, accuracy, "away-pass")}%` },
    { label: "Entradas no terco final", home: perceived(input, home.finalThirdEntries, accuracy, "home-third"), away: perceived(input, away.finalThirdEntries, accuracy, "away-third") },
    { label: "Entradas na area", home: perceived(input, home.boxEntries, accuracy, "home-box"), away: perceived(input, away.boxEntries, accuracy, "away-box") },
    { label: "Passes progressivos", home: perceived(input, home.progressivePasses, accuracy, "home-progressive"), away: perceived(input, away.progressivePasses, accuracy, "away-progressive") },
    { label: "Perdas", home: perceived(input, home.turnovers, accuracy, "home-turnover"), away: perceived(input, away.turnovers, accuracy, "away-turnover") },
    { label: "Field tilt estimado", home: `${perceived(input, home.fieldTilt, accuracy, "home-tilt")}%`, away: `${perceived(input, away.fieldTilt, accuracy, "away-tilt")}%` },
    { label: "PPDA estimado", home: perceived(input, home.ppda, accuracy, "home-ppda", 1), away: perceived(input, away.ppda, accuracy, "away-ppda", 1) },
  ].map((item) => ({ ...item, confidence }));
  if (accuracy < 52) return metrics.slice(0, 2);
  if (accuracy < 76) return metrics.slice(0, 5);
  return metrics;
}

function buildStaffReport(input: MatchInput, simulation: MatchSimulation, profile: MatchStaffProfile): MatchReportView {
  const accuracy = reportAccuracy(profile);
  const confidence = confidenceLabel(accuracy);
  const home = simulation.teamStats.home;
  const away = simulation.teamStats.away;
  const won = simulation.homeScore > simulation.awayScore;
  const lost = simulation.homeScore < simulation.awayScore;
  const base = { role: profile.roleId, authorName: profile.name, confidence };
  if (["head-coach", "assistant-coach"].includes(profile.roleId)) {
    const structural = accuracy >= 70;
    return { ...base, title: profile.roleId === "head-coach" ? "Relatorio do tecnico" : "Leitura do auxiliar", summary: structural
      ? `O resultado ${simulation.homeScore} x ${simulation.awayScore} deve ser separado da qualidade coletiva: a equipe ${home.xg >= away.xg ? "criou de forma competitiva" : "cedeu as melhores oportunidades"}.`
      : `${won ? "A vitoria confirmou parte do plano" : lost ? "A derrota exige uma resposta" : "O empate mostrou equilibrio"}, embora a leitura ainda seja geral.`,
    findings: [simulation.decisions.length ? `${simulation.decisions.length} ajustes foram conduzidos pela comissao.` : "O plano inicial foi mantido por longo periodo.", structural ? sectorFinding(home, away) : "A execucao oscilou em momentos importantes."],
    recommendations: [structural ? "Ajustar o setor que perdeu controle sem confundir resultado e desempenho." : "Revisar o plano com apoio do analista."] };
  }
  if (["performance-analyst", "performance-analysis-coordinator"].includes(profile.roleId)) {
    return { ...base, title: "Relatorio de desempenho", summary: accuracy >= 76
      ? `A equipe registrou ${home.finalThirdEntries} entradas no terco final e field tilt estimado de ${home.fieldTilt}%.`
      : accuracy >= 52 ? "Os dados indicam uma disputa relativamente equilibrada, com margem de incerteza." : "A amostra permite apenas uma classificacao ampla do desempenho.",
    findings: accuracy >= 76 ? [sectorFinding(home, away), `As substituicoes alteraram ${simulation.substitutions.length} posicoes ao longo do jogo.`] : [home.shots >= away.shots ? "Volume ofensivo competitivo." : "O adversario finalizou mais."],
    recommendations: [accuracy >= 76 ? "Comparar zonas de criacao e efeito das substituicoes na proxima reuniao." : "Ampliar a coleta antes de conclusoes taticas."] };
  }
  if (profile.roleId === "fitness-coach" || profile.roleId === "physiologist") {
    const exhausted = Object.values(simulation.playerStats).filter((item) => item.teamSide === "home" && item.fatigue >= 55).length;
    return { ...base, title: profile.roleId === "physiologist" ? "Relatorio fisiologico" : "Relatorio fisico", summary: exhausted
      ? `${exhausted} atleta(s) apresentaram sinais relevantes de fadiga ao final.` : "A equipe concluiu a partida sem um alerta coletivo elevado de fadiga.",
    findings: [accuracy >= 70 ? `A carga estimada foi maior nos jogadores com mais de 75 minutos.` : "A intensidade caiu em parte do segundo tempo, sem medicao conclusiva."],
    recommendations: [exhausted ? "Priorizar recuperacao e reavaliar prontidao antes do proximo treino." : "Manter monitoramento da carga."] };
  }
  if (["doctor", "physiotherapy-coordinator", "physiotherapist"].includes(profile.roleId)) {
    return { ...base, title: "Relatorio medico", summary: simulation.injuries.length
      ? `${simulation.injuries.length} ocorrencia(s) exigem avaliacao; o prazo inicial pode ser revisado apos exames.` : "Nao houve lesao registrada pelo motor nesta partida.",
    findings: simulation.injuries.map((injury) => `Ocorrencia ${injury.severity} aos ${injury.minute} minutos.`), recommendations: simulation.injuries.length ? ["Realizar exames antes de confirmar retorno."] : ["Manter rotina preventiva."] };
  }
  if (profile.roleId === "psychologist") {
    return { ...base, title: "Relatorio psicologico", summary: won ? "O resultado tende a reforcar a confianca, com atencao aos atletas pouco utilizados." : "O resultado pode afetar jovens e jogadores sob maior pressao.", findings: ["A recomendacao considera apenas impactos de gestao e preserva informacoes clinicas."], recommendations: [lost ? "Avaliar reunioes individuais com atletas mais afetados." : "Acompanhar reservas e jovens na reapresentacao."] };
  }
  if (profile.roleId === "goalkeeper-coach") {
    const goalkeeper = Object.values(simulation.playerStats).find((item) => item.teamSide === "home" && item.position === "GK");
    return { ...base, title: "Relatorio de goleiros", summary: goalkeeper ? `O goleiro realizou ${goalkeeper.goalkeeper.saves} defesa(s) e sofreu ${goalkeeper.goalkeeper.goalsConceded} gol(s).` : "Nao foi possivel consolidar a atuacao do goleiro.", findings: [goalkeeper && goalkeeper.goalkeeper.errors ? "Houve uma decisao com impacto negativo." : "Posicionamento e reposicao devem ser revistos em video."], recommendations: ["Trabalhar a decisao mais recorrente identificada na partida."] };
  }
  return { ...base, title: profile.roleLabel, summary: "Relatorio restrito a competencia do profissional.", findings: [], recommendations: [] };
}

function sectorFinding(home: MatchSimulation["teamStats"]["home"], away: MatchSimulation["teamStats"]["away"]) {
  if (home.turnovers > away.turnovers) return "As perdas reduziram o controle e favoreceram transicoes adversarias.";
  if (home.fieldTilt < 45) return "O adversario sustentou mais acoes no terco ofensivo.";
  return "A equipe ocupou o campo ofensivo com consistencia razoavel.";
}

function playerPresentation(player: MatchPlayer, simulation: MatchSimulation, analystAccuracy: number) {
  const stat = simulation.playerStats[player.id];
  const classification = ratingBand(stat.rating);
  const keyActions = [stat.goals ? `${stat.goals} gol(s)` : "", stat.assists ? `${stat.assists} assistencia(s)` : "", stat.yellowCards ? "Cartao amarelo" : "", stat.redCards ? "Expulsao" : ""].filter(Boolean);
  return { id: player.id, name: player.name, position: player.position, minutes: stat.minutesPlayed, rating: analystAccuracy >= 76 ? stat.rating : null, classification, goals: stat.goals, assists: stat.assists, keyActions };
}

function ratingBand(rating: number) {
  if (rating < 5) return "Atuacao ruim";
  if (rating < 6) return "Abaixo do esperado";
  if (rating < 7) return "Regular";
  if (rating < 8) return "Boa";
  return "Excelente";
}

function buildCommissionView(simulation: MatchSimulation, reports: MatchReportView[]) {
  const contributors = reports.map((report) => report.authorName);
  if (!reports.length) return { consensus: [], divergences: [], recommendation: "Designar a comissao para ampliar a leitura pos-jogo.", contributors };
  const consensus = [simulation.injuries.length ? "A recuperacao dos atletas com ocorrencias deve ser priorizada." : "Nao houve ocorrencia medica grave registrada."];
  const divergences: string[] = [];
  const hasCoach = reports.some((report) => ["head-coach", "assistant-coach"].includes(report.role));
  const hasAnalyst = reports.some((report) => ["performance-analyst", "performance-analysis-coordinator"].includes(report.role));
  const hasPhysical = reports.some((report) => ["fitness-coach", "physiologist"].includes(report.role));
  if (hasCoach && hasAnalyst) divergences.push("A leitura tecnica enfatiza a execucao do plano; a analise de dados pondera volume e zonas de criacao.");
  if (hasPhysical && hasAnalyst) divergences.push("A queda de intensidade pode ter origem fisica ou na ocupacao de espacos; os relatórios nao tratam uma hipotese como verdade.");
  return { consensus, divergences, recommendation: "Cruzar as leituras antes de alterar treinamento, escalação ou estratégia.", contributors };
}

export function applyPostMatchConsequences(matchType: string) {
  return matchType === "qa" ? { applied: false, reason: "qa_isolated" } : { applied: true, reason: "persistent_competition" };
}
