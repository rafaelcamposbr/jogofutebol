"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function MatchCenter({ initialView }: { initialView: any }) {
  const [view, setView] = useState(initialView);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [mentality, setMentality] = useState("balanced");
  const [playerOutId, setPlayerOutId] = useState(""); const [playerInId, setPlayerInId] = useState("");
  const [speech, setSpeech] = useState("");
  const id = view.match.id;
  async function update(method: "GET" | "POST", path = "", body?: unknown) {
    if (busyRef.current) return null; busyRef.current = true; setBusy(true);
    const response = await fetch(`/api/matches/${id}${path}`, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json(); busyRef.current = false; setBusy(false);
    if (!response.ok) { setMessage(data.message || "A operacao foi recusada."); return null; }
    if (data.view) setView(data.view); return data;
  }
  async function refresh() { await update("GET"); }
  async function command(type: string, payload: Record<string, unknown> = {}) { const data = await update("POST", "", { type, payload }); if (data) { setMessage(data.appliesFromMinute ? `Comando salvo para o minuto ${data.appliesFromMinute}.` : "Comando aplicado."); await refresh(); } }
  useEffect(() => {
    if (view.match.status !== "in_progress") return;
    let cancelled = false;
    let timer = window.setTimeout(async function poll() {
      await update("POST", "/process");
      if (!cancelled) timer = window.setTimeout(poll, 1800);
    }, 1800);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [view.match.status, id]);
  const homePlayers = view.teams?.home.players || []; const awayPlayers = view.teams?.away.players || [];
  const substitutions = view.substitutions || [];
  const activeHomeIds = useMemo(() => {
    const values = new Set(homePlayers.filter((item: any) => item.isStarter).map((item: any) => item.id));
    substitutions.filter((item: any) => item.team_side === "home").forEach((item: any) => { values.delete(item.player_out_id); values.add(item.player_in_id); });
    view.events.filter((item: any) => item.team_side === "home" && item.event_type === "red_card").forEach((item: any) => values.delete(item.player_id));
    return values;
  }, [homePlayers, substitutions, view.events]);
  const starters = homePlayers.filter((item: any) => activeHomeIds.has(item.id));
  const bench = homePlayers.filter((item: any) => !activeHomeIds.has(item.id) && !substitutions.some((sub: any) => sub.player_out_id === item.id));
  const homeStats = view.teamStats.find((item: any) => item.team_side === "home"); const awayStats = view.teamStats.find((item: any) => item.team_side === "away");
  async function halftimeTalk() {
    if (speech.trim().length >= 3) await command("instruction", { text: speech.trim(), context: "halftime" });
    await command("resume"); setSpeech("");
  }
  return (
    <div className="match-center">
      <header className="scoreboard"><div><span>{view.teams?.home.name}</span><strong>{view.match.home_score}</strong></div><section><p>{view.match.competition}</p><b>{view.match.current_minute}&apos;</b><small>{statusLabel(view.match.status)}</small></section><div><strong>{view.match.away_score}</strong><span>{view.teams?.away.name || view.match.opponent_name}</span></div></header>
      <section className="match-command-bar">
        {view.match.status === "ready" ? <button type="button" disabled={busy} onClick={async () => { const data = await update("POST", "/start"); if (data) { await refresh(); setMessage("Partida iniciada."); } }}>Iniciar partida</button> : null}
        {view.match.status === "in_progress" ? <button type="button" disabled={busy} onClick={() => command("pause")}>Pausar</button> : null}
        {view.match.status === "paused" ? <button type="button" disabled={busy} onClick={() => command("resume")}>Continuar</button> : null}
        {view.match.match_type === "qa" ? <label>Velocidade<select value={view.match.speed} disabled={busy || view.match.status === "finished"} onChange={(event) => command("speed", { speed: Number(event.target.value) })}><option value="1">1x</option><option value="10">10x</option><option value="30">30x</option><option value="90">90x</option></select></label> : null}
        {view.match.status === "in_progress" || view.match.status === "halftime" ? <><label>Mentalidade<select value={mentality} onChange={(event) => setMentality(event.target.value)}><option value="very_defensive">Muito defensiva</option><option value="defensive">Defensiva</option><option value="balanced">Equilibrada</option><option value="attacking">Ofensiva</option><option value="very_attacking">Muito ofensiva</option></select></label><button type="button" disabled={busy} onClick={() => command("mentality", { mentality })}>Aplicar no proximo minuto</button></> : null}
        {message ? <span role="status">{message}</span> : null}
      </section>
      {view.match.status === "halftime" ? <section className="halftime-room"><div><p>Intervalo</p><h2>Conversa com o elenco</h2><span>O comando entra no registro e afeta apenas o segundo tempo.</span></div><textarea aria-label="Discurso do intervalo" value={speech} onChange={(event) => setSpeech(event.target.value)} placeholder="Escreva uma orientacao curta ao elenco" /><button type="button" disabled={busy} onClick={halftimeTalk}>Aplicar discurso e voltar</button></section> : null}
      <div className="match-live-grid">
        <section className="match-timeline"><h2>Eventos</h2><div>{[...view.events].reverse().map((event: any) => <article key={event.event_index} className={`timeline-event ${event.event_type}`}><time>{event.minute}&apos;</time><div><strong>{eventLabel(event.event_type)}</strong><p>{event.narrative}</p>{event.displayed_xg != null ? <small>xG exibido: {Number(event.displayed_xg).toFixed(2)}</small> : null}</div></article>)}</div>{!view.events.length ? <p className="empty-state">A linha do tempo comeca quando a bola rolar.</p> : null}</section>
        <section className="match-field-panel"><h2>Campo</h2><div className="match-pitch"><div className="half-line" />{starters.slice(0, 11).map((player: any, index: number) => <span key={player.id} className="match-dot home" style={{ left: `${12 + (index % 4) * 22}%`, top: `${63 + Math.floor(index / 4) * 10}%` }} title={player.name}>{player.position}</span>)}{awayPlayers.filter((item: any) => item.isStarter).slice(0, 11).map((player: any, index: number) => <span key={player.id} className="match-dot away" style={{ left: `${12 + (index % 4) * 22}%`, top: `${27 - Math.floor(index / 4) * 9}%` }} title={player.name}>{player.position}</span>)}</div><p className="indicator-note">Representacao tatica, nao rastreamento espacial em tempo real.</p></section>
        <aside className="match-alerts"><h2>Comandos e alertas</h2><div className="substitution-form"><label>Sai<select value={playerOutId} onChange={(event) => setPlayerOutId(event.target.value)}><option value="">Selecionar titular</option>{starters.map((player: any) => <option value={player.id} key={player.id}>{player.name} - {player.position}</option>)}</select></label><label>Entra<select value={playerInId} onChange={(event) => setPlayerInId(event.target.value)}><option value="">Selecionar reserva</option>{bench.map((player: any) => <option value={player.id} key={player.id}>{player.name} - {player.position}</option>)}</select></label><button type="button" disabled={busy || !playerOutId || !playerInId || view.match.status === "finished"} onClick={async () => { await command("substitution", { playerOutId, playerInId }); setPlayerOutId(""); setPlayerInId(""); }}>Fazer substituicao</button></div><ul>{view.injuries.map((item: any) => <li key={item.id}>Lesao aos {item.minute}&apos; - {item.severity}</li>)}{view.commands.slice(-6).map((item: any) => <li key={item.id}>{item.command_type} - {item.status} - {item.applies_from_minute}&apos;</li>)}</ul></aside>
      </div>
      <section className="match-statistics"><h2>Estatisticas da equipe</h2>{homeStats && awayStats ? <div className="comparison-stats">{[["Posse", homeStats.possession, awayStats.possession, "%"], ["Finalizacoes", homeStats.shots, awayStats.shots, ""], ["No alvo", homeStats.shots_on_target, awayStats.shots_on_target, ""], ["xG", homeStats.xg, awayStats.xg, ""], ["Passes", homeStats.pass_attempts, awayStats.pass_attempts, ""], ["Escanteios", homeStats.corners, awayStats.corners, ""], ["Faltas", homeStats.fouls, awayStats.fouls, ""], ["Field tilt", homeStats.extended_stats?.fieldTilt, awayStats.extended_stats?.fieldTilt, "%"], ["PPDA adaptado", homeStats.extended_stats?.ppda, awayStats.extended_stats?.ppda, ""]].map(([label, home, away, unit]) => <div key={label as string}><strong>{Number(home || 0).toFixed(label === "xG" ? 2 : 0)}{unit}</strong><span>{label}</span><strong>{Number(away || 0).toFixed(label === "xG" ? 2 : 0)}{unit}</strong></div>)}</div> : <p className="empty-state">As estatisticas aparecem durante a partida.</p>}<p className="indicator-note">Field tilt e PPDA sao indicadores estimados pelo motor, adequados para comparacao interna.</p></section>
      <section className="player-ratings"><h2>Notas e desempenho</h2><div className="sports-table-wrap"><table className="sports-table"><thead><tr><th>Jogador</th><th>Pos.</th><th>Min.</th><th>Nota</th><th>G</th><th>A</th><th>Fin.</th><th>No alvo</th><th>Passes</th><th>Fadiga</th></tr></thead><tbody>{view.playerStats.filter((item: any) => item.team_side === "home").map((item: any) => <tr key={item.id}><td>{item.player_name}</td><td>{item.position}</td><td>{item.minutes_played}</td><td><b>{Number(item.rating).toFixed(1)}</b></td><td>{item.goals}</td><td>{item.assists}</td><td>{item.shots}</td><td>{item.shots_on_target}</td><td>{item.passes_completed}/{item.pass_attempts}</td><td>{Math.round(item.extended_stats?.fatigue || 0)}</td></tr>)}</tbody></table></div></section>
      <section className="match-reports"><h2>Relatorios</h2><div>{view.reports.map((report: any) => <article key={`${report.report_type}-${report.author_role}`}><p>{report.author_role === "coach" ? "Tecnico" : "Analista"} - {reportType(report.report_type)}</p><h3>{report.content.title}</h3><span>{report.content.summary}</span>{report.content.recommendations?.map((item: string) => <li key={item}>{item}</li>)}{report.content.patterns?.map((item: string) => <li key={item}>{item}</li>)}</article>)}</div></section>
    </div>
  );
}

function statusLabel(value: string) { return ({ ready: "Pre-jogo", in_progress: "Ao vivo", halftime: "Intervalo", paused: "Pausada", finished: "Encerrada" } as Record<string, string>)[value] || value; }
function eventLabel(value: string) { return ({ goal: "Gol", save: "Defesa", miss: "Finalizacao", yellow_card: "Cartao amarelo", red_card: "Expulsao", injury: "Lesao", substitution: "Substituicao", tactical_change: "Mudanca tatica", halftime: "Intervalo", fulltime: "Fim de jogo" } as Record<string, string>)[value] || value.replaceAll("_", " "); }
function reportType(value: string) { return ({ pre_match: "Pre-jogo", halftime: "Intervalo", post_match: "Pos-jogo" } as Record<string, string>)[value] || value; }
