import type { MatchInput, MatchSimulation } from "./types.ts";

export function buildCoachReport(type: "pre_match" | "halftime" | "post_match", input: MatchInput, simulation?: MatchSimulation) {
  if (type === "pre_match") return {
    title: "Plano recomendado",
    summary: `Manter a estrutura ${input.home.formation}, proteger o centro e escolher bem o momento de acelerar contra ${input.away.name}.`,
    strengths: ["Estrutura inicial equilibrada", "Banco com alternativas para os corredores"],
    risks: ["Perdas no centro podem gerar transicoes", "A condicao fisica deve ser acompanhada"],
    recommendations: ["Evitar mudancas simultaneas", "Reavaliar a intensidade no intervalo"],
  };
  const stats = simulation!.teamStats;
  const score = `${simulation!.homeScore} x ${simulation!.awayScore}`;
  if (type === "halftime") return {
    title: "Leitura do intervalo", summary: `O placar e ${score}. A equipe teve ${stats.home.possession}% de posse e produziu ${stats.home.xg.toFixed(2)} xG.`,
    strengths: [stats.home.shotsOnTarget >= stats.away.shotsOnTarget ? "A equipe chega ao alvo com competitividade" : "Ainda ha margem para aumentar a presenca na area"],
    risks: [stats.home.fouls > stats.away.fouls ? "O volume de faltas merece controle" : "Cuidado com a transicao adversaria"],
    recommendations: [stats.home.xg < stats.away.xg ? "Reduzir perdas e aproximar os criadores" : "Preservar a estrutura e atacar os espacos livres"],
  };
  return {
    title: "Avaliacao do treinador", summary: `Resultado final: ${score}. O desempenho produziu ${stats.home.shots} finalizacoes e ${stats.home.xg.toFixed(2)} xG.`,
    strengths: [stats.home.xg >= stats.away.xg ? "O volume de chances foi competitivo" : "A equipe permaneceu no jogo mesmo sob pressao"],
    risks: [stats.home.turnovers > stats.away.turnovers ? "As perdas de bola reduziram o controle" : "A recuperacao fisica deve ser monitorada"],
    recommendations: ["Revisar os eventos de maior xG", "Acompanhar a recuperacao dos atletas mais exigidos"],
  };
}

export function buildAnalystReport(type: "pre_match" | "halftime" | "post_match", input: MatchInput, simulation?: MatchSimulation) {
  if (type === "pre_match") return {
    title: "Leitura do analista", summary: `${input.away.name} e um adversario tecnico temporario. A comparacao usa apenas o recorte desta partida QA.`,
    indicators: [{ label: "Modelo", value: input.version }, { label: "Semente", value: input.seed.slice(0, 12) }],
    patterns: ["Comparar ocupacao do terco final", "Observar eficiencia da pressao sem tratar PPDA como medicao cientifica"],
  };
  const stats = simulation!.teamStats;
  return {
    title: type === "halftime" ? "Analise do primeiro tempo" : "Analise final",
    summary: `Field tilt estimado em ${stats.home.fieldTilt}% e PPDA adaptado de ${stats.home.ppda}.`,
    indicators: [
      { label: "Precisao de passe", value: `${Math.round(stats.home.passesCompleted / Math.max(1, stats.home.passAttempts) * 100)}%` },
      { label: "Entradas na area", value: stats.home.boxEntries },
      { label: "Perdas", value: stats.home.turnovers },
      { label: "xG", value: stats.home.xg.toFixed(2) },
    ],
    patterns: [stats.home.fieldTilt >= 50 ? "A equipe sustentou mais acoes no terco ofensivo." : "O adversario empurrou a equipe para tras em parte relevante do periodo."],
  };
}

export function applyPostMatchConsequences(matchType: string) {
  return matchType === "qa" ? { applied: false, reason: "qa_isolated" } : { applied: true, reason: "persistent_competition" };
}
