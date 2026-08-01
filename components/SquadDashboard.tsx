"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/money";

type SquadPlayer = {
  id: string; known_as: string; age: number; squad_number: number | null; main_position: string; squad_role: string;
  observed_level: string; public_potential_band: string; dynamic: null | { morale: number; fatigue: number; physical_condition: number; form_rating: number; injury_status: string; suspension_status: string };
  contract: null | { contract_end: string; monthly_salary: number };
};

export function SquadDashboard({ players }: { players: SquadPlayer[] }) {
  const [position, setPosition] = useState("all");
  const [role, setRole] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [view, setView] = useState<"list" | "position">("list");
  const visible = useMemo(() => players.filter((player) => {
    if (position !== "all" && player.main_position !== position) return false;
    if (role !== "all" && player.squad_role !== role) return false;
    if (availability === "available" && (player.dynamic?.injury_status !== "available" || player.dynamic?.suspension_status === "suspended")) return false;
    if (availability === "unavailable" && player.dynamic?.injury_status === "available" && player.dynamic?.suspension_status !== "suspended") return false;
    return true;
  }), [players, position, role, availability]);
  return (
    <>
      <section className="sports-summary-band">
        <div><strong>{players.length}</strong><span>jogadores persistentes</span></div>
        <div><strong>{players.filter((item) => item.dynamic?.injury_status === "available").length}</strong><span>disponiveis</span></div>
        <div><strong>{players.filter((item) => Number(item.dynamic?.fatigue || 0) >= 65).length}</strong><span>fadiga critica</span></div>
        <div><strong>{players.filter((item) => item.squad_role === "development").length}</strong><span>em desenvolvimento</span></div>
      </section>
      <section className="sports-toolbar" aria-label="Filtros do elenco">
        <label>Posicao<select value={position} onChange={(event) => setPosition(event.target.value)}><option value="all">Todas</option>{[...new Set(players.map((item) => item.main_position))].sort().map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Papel<select value={role} onChange={(event) => setRole(event.target.value)}><option value="all">Todos</option>{[...new Set(players.map((item) => item.squad_role))].sort().map((item) => <option key={item}>{roleLabel(item)}</option>)}</select></label>
        <label>Condicao<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Todas</option><option value="available">Disponiveis</option><option value="unavailable">Indisponiveis</option></select></label>
        <div className="segmented-control" aria-label="Visualizacao"><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Lista</button><button type="button" aria-pressed={view === "position"} onClick={() => setView("position")}>Por posicao</button></div>
      </section>
      {view === "list" ? <div className="sports-table-wrap"><table className="sports-table"><thead><tr><th>#</th><th>Jogador</th><th>Pos.</th><th>Idade</th><th>Papel</th><th>Leitura</th><th>Moral</th><th>Condicao</th><th>Fadiga</th><th>Forma</th><th>Contrato</th><th>Salario</th></tr></thead><tbody>{visible.map((player) => <tr key={player.id}><td>{player.squad_number || "-"}</td><td><Link href={`/elenco/jogadores/${player.id}`}>{player.known_as}</Link></td><td><b>{player.main_position}</b></td><td>{player.age}</td><td>{roleLabel(player.squad_role)}</td><td>{player.observed_level}</td><td><Meter value={Number(player.dynamic?.morale || 0)} /></td><td><Meter value={Number(player.dynamic?.physical_condition || 0)} /></td><td><Meter value={Number(player.dynamic?.fatigue || 0)} inverse /></td><td>{Number(player.dynamic?.form_rating || 0).toFixed(1)}</td><td>{player.contract ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${player.contract.contract_end}T12:00:00`)) : "-"}</td><td>{player.contract ? formatBRL(player.contract.monthly_salary) : "-"}</td></tr>)}</tbody></table></div> : <div className="position-groups">{[...new Set(visible.map((item) => item.main_position))].sort().map((group) => <section key={group}><h2>{group}</h2><div>{visible.filter((item) => item.main_position === group).map((player) => <Link className="player-row-link" href={`/elenco/jogadores/${player.id}`} key={player.id}><span>{player.squad_number || "-"}</span><strong>{player.known_as}</strong><small>{player.observed_level}</small></Link>)}</div></section>)}</div>}
    </>
  );
}

function Meter({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = inverse ? value <= 35 : value >= 65;
  const bad = inverse ? value >= 65 : value < 40;
  return <span className={`metric-pill ${good ? "good" : bad ? "bad" : "neutral"}`}>{Math.round(value)}</span>;
}
function roleLabel(value: string) { return ({ franchise: "Franquia", starter: "Titular", rotation: "Rotacao", reserve: "Reserva", development: "Desenvolvimento", surplus: "Fora dos planos" } as Record<string, string>)[value] || value; }
