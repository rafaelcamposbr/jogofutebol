"use client";

import Link from "next/link";
import { CalendarClock, Check, ClipboardCheck, LockKeyhole, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import type { MatchPublicView, PreMatchPlan, StaffAssignmentArea, StaffAssignments } from "@/lib/game/matches/types";

const AREA_LABELS: Record<StaffAssignmentArea, string> = {
  technical: "Analise tecnica",
  physical: "Analise fisica",
  medical: "Analise medica",
  psychological: "Analise psicologica",
  goalkeeping: "Goleiros",
};

export function MatchCenter({ initialView }: { initialView: MatchPublicView }) {
  const [view, setView] = useState(initialView);
  const [plan, setPlan] = useState<PreMatchPlan>(initialView.preparation?.plan || fallbackPlan());
  const [assignments, setAssignments] = useState<StaffAssignments>(initialView.preparation?.assignments || {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function request(method: "GET" | "POST", path = "", body?: unknown) {
    if (busy) return null;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/matches/${view.match.id}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Nao foi possivel concluir a operacao.");
        return null;
      }
      if (data.view) {
        setView(data.view);
        if (data.view.preparation) {
          setPlan(data.view.preparation.plan);
          setAssignments(data.view.preparation.assignments);
        }
      }
      return data;
    } catch {
      setMessage("A conexao falhou. Tente novamente.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function savePreparation(showConfirmation = true) {
    const data = await request("POST", "", { plan, assignments });
    if (data && showConfirmation) setMessage("Preparacao salva.");
    return Boolean(data);
  }

  async function start() {
    const saved = await savePreparation(false);
    if (!saved) return;
    const data = await request("POST", "/start");
    if (data) {
      await request("GET");
      setMessage("Decisoes bloqueadas. A partida foi iniciada.");
    }
  }

  function toggleStaff(area: StaffAssignmentArea, employeeId: string) {
    setAssignments((current) => {
      const selected = new Set(current[area] || []);
      if (selected.has(employeeId)) selected.delete(employeeId); else selected.add(employeeId);
      return { ...current, [area]: [...selected] };
    });
  }

  function toggleUnavailable(playerId: string) {
    setPlan((current) => {
      const selected = new Set(current.unavailablePlayerIds);
      if (selected.has(playerId)) selected.delete(playerId); else selected.add(playerId);
      return { ...current, unavailablePlayerIds: [...selected] };
    });
  }

  const home = view.teams?.home;
  const away = view.teams?.away;
  return <div className="managed-match">
    <header className={`managed-match-header state-${view.match.state}`}>
      <div><span>{home?.name || "Mandante"}</span>{view.summary ? <strong>{view.summary.score.home}</strong> : null}</div>
      <section><p>{view.match.competition}</p><b>{view.summary ? "Placar final" : statusLabel(view.match.state)}</b><small>{view.match.roundLabel || formatDate(view.match.scheduledAt)}</small></section>
      <div>{view.summary ? <strong>{view.summary.score.away}</strong> : null}<span>{away?.name || view.match.opponentName}</span></div>
    </header>

    {message ? <p className="match-feedback" role="status">{message}</p> : null}
    {view.preparation ? <PreparationView
      view={view}
      plan={plan}
      assignments={assignments}
      busy={busy}
      onPlan={setPlan}
      onToggleStaff={toggleStaff}
      onToggleUnavailable={toggleUnavailable}
      onSave={() => void savePreparation()}
      onStart={() => void start()}
    /> : null}
    {view.progress ? <ProgressView view={view} busy={busy} onRefresh={() => void request("GET")} /> : null}
    {view.summary ? <SummaryView view={view} /> : null}
    {["postponed", "cancelled", "failed"].includes(view.match.state) ? <section className="match-state-panel"><CalendarClock size={34} /><h2>{statusLabel(view.match.state)}</h2><p>Esta partida nao esta em disputa. Consulte o calendario para os proximos passos.</p><Link href="/calendario">Voltar ao calendario</Link></section> : null}
  </div>;
}

function PreparationView({ view, plan, assignments, busy, onPlan, onToggleStaff, onToggleUnavailable, onSave, onStart }: {
  view: MatchPublicView;
  plan: PreMatchPlan;
  assignments: StaffAssignments;
  busy: boolean;
  onPlan: (plan: PreMatchPlan) => void;
  onToggleStaff: (area: StaffAssignmentArea, employeeId: string) => void;
  onToggleUnavailable: (playerId: string) => void;
  onSave: () => void;
  onStart: () => void;
}) {
  const preparation = view.preparation!;
  const starters = view.teams?.home.players.filter((player) => player.isStarter) || [];
  return <div className="match-preparation-layout">
    <section className="match-advice-card">
      <div className="section-kicker"><ShieldCheck size={18} /> Orientacao pre-jogo</div>
      <h2>{preparation.advice.title}</h2>
      <p>{preparation.advice.summary}</p>
      <div className="match-advice-columns"><div><strong>Pontos fortes</strong>{preparation.advice.strengths.map((item) => <span key={item}>{item}</span>)}</div><div><strong>Riscos</strong>{preparation.advice.risks.map((item) => <span key={item}>{item}</span>)}</div></div>
      <div className="match-advice-actions">{preparation.advice.alternatives.map((item) => <span key={item}>{item}</span>)}</div>
    </section>

    <section className="match-setup-card">
      <header><div><span className="section-kicker"><ClipboardCheck size={18} /> Plano enviado</span><h2>Escalacao e tatica</h2></div><Link href="/elenco/tatica">Editar no Elenco</Link></header>
      <div className="submitted-plan-metrics"><div><small>Formacao</small><strong>{view.teams?.home.formation}</strong></div><div><small>Titulares</small><strong>{starters.length}</strong></div><div><small>Banco</small><strong>{(view.teams?.home.players.length || 0) - starters.length}</strong></div></div>
      <div className="submitted-lineup">{starters.map((player) => <span key={player.id}><b>{player.position}</b>{player.name}<small>Condicao {player.condition}%</small></span>)}</div>
    </section>

    <section className="match-plan-form">
      <header><span className="section-kicker"><LockKeyhole size={18} /> Decisoes antecipadas</span><h2>Plano de jogo e substituicoes</h2><p>Depois do inicio, a comissao interpreta estas orientacoes e nenhuma alteracao manual sera aceita.</p></header>
      <div className="match-form-grid">
        <label>Responsabilidade<select value={plan.decisionMode} onChange={(event) => onPlan({ ...plan, decisionMode: event.target.value as PreMatchPlan["decisionMode"] })}><option value="manager">Diretoria define limites</option><option value="shared">Decisao compartilhada</option><option value="delegated">Delegado ao tecnico</option></select></label>
        <label>Mentalidade inicial<select value={plan.initialMentality} onChange={(event) => onPlan({ ...plan, initialMentality: event.target.value as PreMatchPlan["initialMentality"] })}><option value="very_defensive">Muito defensiva</option><option value="defensive">Defensiva</option><option value="balanced">Equilibrada</option><option value="attacking">Ofensiva</option><option value="very_attacking">Muito ofensiva</option></select></label>
        <label>Atacar se estiver perdendo apos<input type="number" min="45" max="85" value={plan.offensiveWhenTrailingAfter} onChange={(event) => onPlan({ ...plan, offensiveWhenTrailingAfter: Number(event.target.value) })} /><small>minutos</small></label>
        <label>Proteger vantagem apos<input type="number" min="55" max="88" value={plan.protectLeadAfter} onChange={(event) => onPlan({ ...plan, protectLeadAfter: Number(event.target.value) })} /><small>minutos</small></label>
        <label>Poupar abaixo de<input type="number" min="35" max="75" value={plan.protectBelowReadiness} onChange={(event) => onPlan({ ...plan, protectBelowReadiness: Number(event.target.value) })} /><small>% de prontidao</small></label>
      </div>
      <div className="match-rule-toggles">
        <label><input type="checkbox" checked={plan.withdrawBookedAggressive} onChange={(event) => onPlan({ ...plan, withdrawBookedAggressive: event.target.checked })} /> Retirar jogador amarelado com alto risco disciplinar</label>
        <label><input type="checkbox" checked={plan.prioritizeYoungWhenComfortable} onChange={(event) => onPlan({ ...plan, prioritizeYoungWhenComfortable: event.target.checked })} /> Priorizar jovens com vantagem confortavel</label>
      </div>
      <details className="unavailable-players"><summary>Jogadores que nao podem ser utilizados</summary><div>{view.teams?.home.players.map((player) => <label key={player.id}><input type="checkbox" checked={plan.unavailablePlayerIds.includes(player.id)} onChange={() => onToggleUnavailable(player.id)} /> {player.name} <small>{player.position}</small></label>)}</div></details>
    </section>

    <section className="match-staff-form">
      <header><span className="section-kicker"><Users size={18} /> Visao da comissao</span><h2>Responsaveis pelos relatorios</h2><p>Cada profissional so pode analisar sua propria area de competencia.</p></header>
      <div className="staff-area-grid">{(Object.keys(AREA_LABELS) as StaffAssignmentArea[]).map((area) => {
        const options = preparation.staff.filter((employee) => employee.areas.includes(area));
        return <fieldset key={area}><legend>{AREA_LABELS[area]}</legend>{options.length ? options.map((employee) => <label key={employee.id} className={(assignments[area] || []).includes(employee.id) ? "selected" : ""}><input type="checkbox" checked={(assignments[area] || []).includes(employee.id)} onChange={() => onToggleStaff(area, employee.id)} /><span><strong>{employee.name}</strong><small>{employee.roleLabel}</small></span><Check size={17} /></label>) : <p>Nenhum profissional compativel contratado.</p>}</fieldset>;
      })}</div>
      <div className="match-preparation-actions"><button type="button" disabled={busy} onClick={onSave}>Salvar preparacao</button><button className="primary" type="button" disabled={busy} onClick={onStart}>{busy ? "Processando..." : "Confirmar e iniciar"}</button></div>
    </section>
  </div>;
}

function ProgressView({ view, busy, onRefresh }: { view: MatchPublicView; busy: boolean; onRefresh: () => void }) {
  return <section className="match-state-panel in-progress" aria-live="polite">
    <span className="match-state-icon"><CalendarClock size={36} /></span>
    <p>{view.match.state === "awaiting_processing" ? "Aguardando processamento" : "Partida em andamento"}</p>
    <h2>{view.progress!.message}</h2>
    <div className="progress-match-details">
      <span><small>Adversario</small><strong>{view.match.opponentName}</strong></span>
      <span><small>Estadio</small><strong>{view.match.venue || "Nao informado"}</strong></span>
      <span><small>Inicio</small><strong>{formatDate(view.match.startedAt)}</strong></span>
      <span><small>Previsao de encerramento</small><strong>{formatDate(view.match.expectedEndAt)}</strong></span>
      <span><small>Escalacao enviada</small><strong>{view.progress!.submittedFormation}</strong></span>
      <span><small>Tatica enviada</small><strong>{mentalityLabel(view.progress!.submittedMentality)}</strong></span>
    </div>
    <div className="match-state-actions"><Link href="/calendario">Voltar ao calendario</Link><button type="button" disabled={busy} onClick={onRefresh}><RefreshCw size={17} /> Atualizar estado</button></div>
    <small>A simulacao acontece no servidor. Nao e necessario manter esta pagina aberta.</small>
  </section>;
}

function SummaryView({ view }: { view: MatchPublicView }) {
  const summary = view.summary!;
  return <div className="match-summary-layout">
    <section className="match-objective-facts"><header><span className="section-kicker"><Check size={18} /> Fatos oficiais</span><h2>Resumo da partida</h2><p>Intervalo: {summary.score.halftimeHome} x {summary.score.halftimeAway}</p></header>{summary.facts.length ? <div>{summary.facts.map((fact) => <article key={fact.index}><time>{fact.minute}&apos;</time><span><strong>{fact.label}</strong>{fact.narrative}</span></article>)}</div> : <p className="empty-state">Nenhum incidente objetivo foi registrado.</p>}</section>

    <section className="match-statistics"><header><span className="section-kicker">Registro oficial</span><h2>Estatisticas basicas</h2></header><div className="comparison-stats">{summary.basicStats.map((item) => <div key={item.label}><strong>{item.home}</strong><span>{item.label}</span><strong>{item.away}</strong></div>)}</div></section>

    <section className="match-statistics advanced"><header><span className="section-kicker">Conhecimento imperfeito</span><h2>Analise avancada</h2></header>{summary.advancedStats.length ? <div className="comparison-stats">{summary.advancedStats.map((item) => <div key={item.label}><strong>{item.home}</strong><span>{item.label}<small>Confianca {item.confidence.toLowerCase()}</small></span><strong>{item.away}</strong></div>)}</div> : <p className="empty-state">Sem analista designado, apenas o registro oficial basico esta disponivel.</p>}</section>

    <section className="player-ratings"><header><span className="section-kicker">Por funcao</span><h2>Avaliacao dos jogadores</h2></header><div className="player-performance-grid">{summary.players.map((player) => <article key={player.id}><div><span>{player.position}</span><strong>{player.name}</strong></div><b>{player.rating == null ? player.classification : player.rating.toFixed(1)}</b><small>{player.minutes} min · {player.goals} G · {player.assists} A</small>{player.keyActions.length ? <p>{player.keyActions.join(" · ")}</p> : null}</article>)}</div></section>

    <section className="match-reports"><header><span className="section-kicker">Relatorios assinados</span><h2>Leituras da comissao</h2></header>{summary.reports.length ? <div>{summary.reports.map((report) => <article key={`${report.role}-${report.authorName}`}><p>{report.authorName}<span>Confianca {report.confidence.toLowerCase()}</span></p><h3>{report.title}</h3><strong>{report.summary}</strong>{report.findings.map((item) => <li key={item}>{item}</li>)}{report.recommendations.map((item) => <li className="recommendation" key={item}>{item}</li>)}</article>)}</div> : <p className="empty-state">Nenhum profissional foi designado para produzir relatorio.</p>}</section>

    <section className="commission-view"><header><span className="section-kicker"><Users size={18} /> Sintese</span><h2>Visao da comissao</h2></header><div><h3>Consenso</h3>{summary.commission.consensus.length ? summary.commission.consensus.map((item) => <p key={item}>{item}</p>) : <p>Sem consenso formal registrado.</p>}</div><div><h3>Divergencias</h3>{summary.commission.divergences.length ? summary.commission.divergences.map((item) => <p key={item}>{item}</p>) : <p>Nao houve leituras divergentes suficientes.</p>}</div><strong>{summary.commission.recommendation}</strong><small>Responsaveis: {summary.commission.contributors.join(", ") || "nenhum profissional designado"}</small></section>
  </div>;
}

function fallbackPlan(): PreMatchPlan {
  return { decisionMode: "shared", initialMentality: "balanced", offensiveWhenTrailingAfter: 60, protectLeadAfter: 75, protectBelowReadiness: 55, withdrawBookedAggressive: true, prioritizeYoungWhenComfortable: true, unavailablePlayerIds: [] };
}

function formatDate(value: string | null) {
  if (!value) return "Nao informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Nao informado" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function statusLabel(value: MatchPublicView["match"]["state"]) {
  return ({ draft: "Preparacao", ready: "Pre-jogo", in_progress: "Em andamento", awaiting_processing: "Aguardando processamento", finished: "Concluida", postponed: "Adiada", cancelled: "Cancelada", failed: "Falha de processamento" } as Record<string, string>)[value] || value;
}

function mentalityLabel(value: PreMatchPlan["initialMentality"]) {
  return ({ very_defensive: "Muito defensiva", defensive: "Defensiva", balanced: "Equilibrada", attacking: "Ofensiva", very_attacking: "Muito ofensiva" } as Record<string, string>)[value] || value;
}
