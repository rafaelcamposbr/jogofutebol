"use client";

import { useMemo, useState } from "react";
import { FORMATIONS, FORMATION_SLOTS, buildCoachRecommendation, suggestLineup, type Formation, type LineupAssignment, type Mentality } from "@/lib/game/tactics/engine";

type TacticsPlayer = { id: string; known_as: string; main_position: any; current_overall: number; dynamic: { tactical_familiarity: number; physical_condition: number } | null };

export function TacticsBoard({ setup }: { setup: any }) {
  const players = setup.players as TacticsPlayer[];
  const [formation, setFormation] = useState<Formation>(setup.tactic.formation);
  const [mentality, setMentality] = useState<Mentality>(setup.tactic.mentality);
  const [assignments, setAssignments] = useState<LineupAssignment[]>(setup.assignments.map((item: any) => ({ slotKey: item.slot_key, playerId: item.player_id, position: item.position, role: item.role, isStarter: item.is_starter, benchOrder: item.bench_order })));
  const [inPossession, setInPossession] = useState<Record<string, any>>(setup.tactic.in_possession || {});
  const [transitions, setTransitions] = useState<Record<string, any>>(setup.tactic.transitions || {});
  const [outOfPossession, setOutOfPossession] = useState<Record<string, any>>(setup.tactic.out_of_possession || {});
  const [status, setStatus] = useState(""); const [saving, setSaving] = useState(false);
  const playerById = useMemo(() => Object.fromEntries(players.map((player) => [player.id, player])), [players]);
  const recommendation = buildCoachRecommendation(formation, mentality, assignments);
  function changeFormation(next: Formation) {
    setFormation(next);
    const candidates = players.map((player) => ({
      id: player.id,
      main_position: player.main_position,
      current_overall: Number(player.current_overall),
      tactical_familiarity: Number(player.dynamic?.tactical_familiarity || 45),
    }));
    setAssignments(suggestLineup(next, candidates));
  }
  function assign(slotKey: string, playerId: string) {
    const target = FORMATION_SLOTS[formation].find((item) => item.key === slotKey)!;
    setAssignments((current) => current.map((item) => item.playerId === playerId ? { ...item, playerId: current.find((entry) => entry.slotKey === slotKey)?.playerId || item.playerId } : item).map((item) => item.slotKey === slotKey ? { ...item, playerId, position: target.position, role: target.role } : item));
  }
  async function save() {
    setSaving(true); setStatus("");
    const response = await fetch("/api/tactics", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tacticId: setup.tactic.id, lineupId: setup.lineup.id, formation, mentality, assignments, inPossession, transitions, outOfPossession }) });
    const body = await response.json(); setSaving(false); setStatus(body.message || (response.ok ? "Plano salvo." : "Nao foi possivel salvar."));
  }
  return (
    <div className="tactics-workspace">
      <aside className="tactics-controls">
        <h2>Plano principal</h2>
        <label>Formacao<select value={formation} onChange={(event) => changeFormation(event.target.value as Formation)}>{FORMATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Mentalidade<select value={mentality} onChange={(event) => setMentality(event.target.value as Mentality)}><option value="very_defensive">Muito defensiva</option><option value="defensive">Defensiva</option><option value="balanced">Equilibrada</option><option value="attacking">Ofensiva</option><option value="very_attacking">Muito ofensiva</option></select></label>
        <fieldset><legend>Com posse</legend><Range label="Largura" value={inPossession.width ?? 52} onChange={(value) => setInPossession({ ...inPossession, width: value })} /><Range label="Ritmo" value={inPossession.tempo ?? 52} onChange={(value) => setInPossession({ ...inPossession, tempo: value })} /><label>Tipo de passe<select value={inPossession.passing || "mixed"} onChange={(event) => setInPossession({ ...inPossession, passing: event.target.value })}><option value="short">Curto</option><option value="mixed">Misto</option><option value="direct">Direto</option></select></label><Toggle label="Saida curta" checked={Boolean(inPossession.shortBuildUp)} onChange={(value) => setInPossession({ ...inPossession, shortBuildUp: value })} /></fieldset>
        <fieldset><legend>Transicao</legend><Toggle label="Contra-pressao" checked={Boolean(transitions.counterPress)} onChange={(value) => setTransitions({ ...transitions, counterPress: value })} /><Toggle label="Contra-ataque" checked={Boolean(transitions.counterAttack)} onChange={(value) => setTransitions({ ...transitions, counterAttack: value })} /><Toggle label="Recompor" checked={Boolean(transitions.regroup)} onChange={(value) => setTransitions({ ...transitions, regroup: value })} /></fieldset>
        <fieldset><legend>Sem posse</legend><Range label="Linha defensiva" value={outOfPossession.defensiveLine ?? 50} onChange={(value) => setOutOfPossession({ ...outOfPossession, defensiveLine: value })} /><Range label="Pressao" value={outOfPossession.pressing ?? 54} onChange={(value) => setOutOfPossession({ ...outOfPossession, pressing: value })} /><Toggle label="Proteger a area" checked={Boolean(outOfPossession.protectBox)} onChange={(value) => setOutOfPossession({ ...outOfPossession, protectBox: value })} /></fieldset>
        <button className="primary-command" type="button" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar plano e escalacao"}</button>
        {status ? <p role="status" className="form-result">{status}</p> : null}
      </aside>
      <main className="tactics-main">
        <section className="football-pitch" aria-label={`Escalacao ${formation}`}>{FORMATION_SLOTS[formation].map((slot) => {
          const assignment = assignments.find((item) => item.slotKey === slot.key);
          return <label className="pitch-slot" key={slot.key} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}><span>{slot.key}</span><select aria-label={`Jogador em ${slot.key}`} value={assignment?.playerId || ""} onChange={(event) => assign(slot.key, event.target.value)}>{players.map((player) => <option value={player.id} key={player.id}>{player.known_as} - {player.main_position} - {Math.round(player.current_overall)}</option>)}</select></label>;
        })}</section>
        <section className="coach-recommendation"><h2>Leitura do tecnico</h2><p><strong>Plano:</strong> {recommendation.plan}</p><p><strong>Ponto forte:</strong> {recommendation.strength}</p><p><strong>Risco:</strong> {recommendation.risk}</p></section>
        <section className="bench-strip"><h2>Banco</h2>{assignments.filter((item) => item.isStarter === false).map((item) => <div key={item.slotKey}><span>{item.slotKey}</span><strong>{playerById[item.playerId]?.known_as}</strong><small>{playerById[item.playerId]?.main_position}</small></div>)}</section>
      </main>
    </div>
  );
}

function Range({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="range-control"><span>{label}<b>{value}</b></span><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="toggle-control"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }
