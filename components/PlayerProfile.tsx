"use client";

import { useState, type FormEvent } from "react";

const TABS = ["Visao Geral", "Atributos", "Posicoes", "Forma", "Estatisticas", "Contrato", "Relacionamentos", "Historico", "Reunioes", "Desenvolvimento"] as const;

export function PlayerProfile({ profile }: { profile: Record<string, any> }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Visao Geral");
  const [meetingResult, setMeetingResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const player = profile.player;
  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMeetingResult("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/players/${player.id}/meetings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: form.get("subject"), text: form.get("text") }) });
    const body = await response.json(); setSubmitting(false);
    if (!response.ok) { setMeetingResult(body.message || "Nao foi possivel realizar a reuniao."); return; }
    setMeetingResult(body.reaction?.narrative || "Reuniao registrada."); event.currentTarget.reset();
  }
  return (
    <>
      <section className="player-identity-band"><div className="squad-number">{player.squad_number || "-"}</div><div><p>{player.main_position} - {player.nationality}</p><h1>{player.known_as}</h1><span>{player.age} anos - pe {player.preferred_foot === "left" ? "esquerdo" : "direito"} - {player.height_cm} cm</span></div><div className="overall-score"><strong>{Number(player.current_overall).toFixed(0)}</strong><span>Avaliacao</span></div></section>
      <nav className="profile-tabs" aria-label="Perfil do jogador">{TABS.map((item) => <button type="button" key={item} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <section className="profile-content">
        {tab === "Visao Geral" ? <><div className="sports-summary-band compact"><Metric label="Moral" value={profile.status?.morale} /><Metric label="Confianca" value={profile.status?.confidence} /><Metric label="Condicao" value={profile.status?.physical_condition} /><Metric label="Fadiga" value={profile.status?.fatigue} /><Metric label="Ritmo" value={profile.status?.match_fitness} /></div><div className="profile-columns"><section><h2>Leitura da comissao</h2><p>{profile.developmentAssessment}</p><p>{profile.potentialEstimate}</p></section><section><h2>Personalidade observada</h2><ul>{profile.personality.map((item: string) => <li key={item}>{item}</li>)}</ul></section><section><h2>Disponibilidade</h2><p>Lesao: {profile.status?.injury_status}</p><p>Suspensao: {profile.status?.suspension_status}</p></section></div></> : null}
        {tab === "Atributos" ? <div className="attribute-groups">{[["Tecnicos", profile.attributes?.technical], ["Mentais", profile.attributes?.mental], ["Fisicos", profile.attributes?.physical], ["Goleiro", profile.attributes?.goalkeeping]].map(([title, values]) => <section key={title as string}><h2>{title as string}</h2>{Object.entries(values || {}).map(([key, value]) => <div className="attribute-row" key={key}><span>{labelize(key)}</span><strong>{Number(value)}</strong></div>)}</section>)}</div> : null}
        {tab === "Posicoes" ? <div className="profile-columns"><section><h2>Posicoes</h2>{profile.positions.map((item: any) => <div className="attribute-row" key={item.position}><span>{item.position}</span><strong>{Math.round(item.aptitude)}%</strong></div>)}</section><section><h2>Funcoes</h2>{profile.roles.map((item: any) => <div className="attribute-row" key={item.role}><span>{labelize(item.role)}</span><strong>{Math.round(item.aptitude)}%</strong></div>)}</section></div> : null}
        {tab === "Forma" ? <div className="profile-columns"><section><h2>Estado atual</h2><Metric label="Forma" value={(profile.status?.form_rating || 0) * 10} /><Metric label="Prontidao" value={profile.status?.sharpness} /><Metric label="Carga" value={profile.status?.training_load} /></section><section><h2>Ocorrencias</h2><p>{profile.injuries.length ? `${profile.injuries.length} lesao(oes) no historico.` : "Sem lesoes registradas."}</p><p>{profile.suspensions.length ? `${profile.suspensions.length} suspensao(oes) no historico.` : "Sem suspensoes registradas."}</p></section></div> : null}
        {tab === "Estatisticas" ? <DataList empty="Nenhuma estatistica de temporada registrada." rows={profile.stats.map((item: any) => `${item.season} - ${item.competition}: ${item.appearances} jogos, ${item.goals} gols, nota ${item.average_rating}`)} /> : null}
        {tab === "Contrato" ? <div className="profile-columns">{profile.contracts.map((item: any) => <section key={item.id}><h2>{item.status === "active" ? "Contrato atual" : "Contrato"}</h2><p>{date(item.contract_start)} a {date(item.contract_end)}</p><p>Salario mensal: {currency(item.monthly_salary)}</p><p>Papel prometido: {labelize(item.squad_role_promised)}</p><p>Clausula: {currency(item.release_clause)}</p></section>)}</div> : null}
        {tab === "Relacionamentos" ? <DataList empty="Relacionamentos ainda em observacao." rows={profile.relationships.map((item: any) => `${labelize(item.target_type)} - afinidade ${Math.round(item.affinity)}, confianca ${Math.round(item.trust)}, respeito ${Math.round(item.respect)}`)} /> : null}
        {tab === "Historico" ? <><DataList empty="Sem passagens anteriores registradas." rows={profile.history.map((item: any) => `${item.club_name} - ${item.season_start}${item.season_end ? `-${item.season_end}` : ""}`)} /><h2>Memorias</h2><DataList empty="Nenhuma memoria estruturada." rows={profile.memories.map((item: any) => `${date(item.created_at)} - ${item.summary}`)} /></> : null}
        {tab === "Reunioes" ? <div className="meeting-layout"><form className="player-meeting-form" onSubmit={submitMeeting}><h2>Reuniao particular</h2><label>Assunto<input name="subject" required minLength={3} maxLength={180} /></label><label>Mensagem<textarea name="text" required minLength={3} maxLength={5000} /></label><button type="submit" disabled={submitting}>{submitting ? "Processando..." : "Conversar com jogador"}</button>{meetingResult ? <p className="form-result" role="status">{meetingResult}</p> : null}</form><section><h2>Reacoes anteriores</h2><DataList empty="Nenhuma reuniao anterior." rows={profile.meetings.map((item: any) => `${date(item.created_at)} - ${item.structured_reaction?.narrative || labelize(item.classification)}`)} /></section></div> : null}
        {tab === "Desenvolvimento" ? <div className="profile-columns"><section><h2>Avaliacao</h2><p>{profile.developmentAssessment}</p><p>{profile.potentialEstimate}</p></section><section><h2>Treinos recentes</h2><DataList empty="Ainda sem historico diario." rows={profile.training.map((item: any) => `${date(item.training_date)} - ${item.focus} - carga ${item.load}`)} /></section></div> : null}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="profile-metric"><span>{label}</span><strong>{Math.round(Number(value || 0))}</strong><div><i style={{ width: `${Math.max(0, Math.min(100, Number(value || 0)))}%` }} /></div></div>; }
function DataList({ rows, empty }: { rows: string[]; empty: string }) { return rows.length ? <ul className="data-list">{rows.map((row, index) => <li key={`${row}-${index}`}>{row}</li>)}</ul> : <p className="empty-state">{empty}</p>; }
function labelize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(value.length === 10 ? `${value}T12:00:00` : value)); }
function currency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0); }
