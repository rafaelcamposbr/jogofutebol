"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatBRLCents } from "@/lib/money";

type Scout = { id: string; name: string; roleLabel: string; quality: number };
type Tryout = { id: string; scoutName: string; preparation_days: number; cost_cents: number; focus: string; status: string; candidate_count: number | null; started_at: string; completes_at: string };

export function TryoutDashboard({ initialTryouts, scouts }: { initialTryouts: Tryout[]; scouts: Scout[] }) {
  const [items, setItems] = useState(initialTryouts);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/tryouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      scoutId: data.get("scoutId"), days: Number(data.get("days")), ageMin: Number(data.get("ageMin")), ageMax: Number(data.get("ageMax")),
      positions: data.getAll("positions"), maxPerPosition: Number(data.get("maxPerPosition")), focus: data.get("focus"), region: data.get("region"), comments: data.get("comments"),
    }) });
    const body = await response.json(); setPending(false);
    if (!response.ok) { setMessage(body.message || "Nao foi possivel iniciar a peneira."); return; }
    const refreshed = await fetch("/api/tryouts").then((result) => result.json());
    setItems(refreshed.tryouts || []); setMessage("Peneira iniciada e custo registrado."); event.currentTarget.reset();
  }

  return <div className="tryout-workspace">
    <section className="tryout-create-band">
      <div><p>Custo fixo</p><strong>{formatBRLCents(145688)}</strong><span>Uma peneira ativa por olheiro</span></div>
      <form onSubmit={submit} className="tryout-form">
        <label>Olheiro<select name="scoutId" required disabled={!scouts.length}><option value="">Selecione</option>{scouts.map((item) => <option value={item.id} key={item.id}>{item.name} - qualidade {item.quality}</option>)}</select></label>
        <label>Dias de preparacao<input name="days" type="number" min="1" max="30" defaultValue="7" required /></label>
        <label>Idade minima<input name="ageMin" type="number" min="14" max="40" defaultValue="16" required /></label>
        <label>Idade maxima<input name="ageMax" type="number" min="14" max="45" defaultValue="24" required /></label>
        <label>Foco<select name="focus" defaultValue="broad"><option value="broad">Amplo</option><option value="technical">Tecnico</option><option value="physical">Fisico</option><option value="tactical">Tatico</option><option value="goalkeeper">Goleiros</option><option value="offensive">Ofensivo</option><option value="defensive">Defensivo</option></select></label>
        <label>Maximo por posicao<input name="maxPerPosition" type="number" min="1" max="50" defaultValue="8" /></label>
        <label>Regiao futura<input name="region" maxLength={80} placeholder="Opcional" /></label>
        <fieldset><legend>Posicoes prioritarias</legend>{["GK","RB","CB","LB","DM","CM","AM","RW","LW","ST"].map((position) => <label key={position}><input type="checkbox" name="positions" value={position} />{position}</label>)}</fieldset>
        <label className="full">Orientacoes ao olheiro<textarea name="comments" maxLength={600} /></label>
        <button type="submit" disabled={pending || !scouts.length}>{pending ? "Iniciando..." : "Iniciar peneira"}</button>
      </form>
      {!scouts.length ? <p className="form-result error">E necessario contratar e sincronizar um olheiro ativo.</p> : null}
      {message ? <p className="form-result" role="status">{message}</p> : null}
    </section>
    <section className="tryout-history"><h2>Peneiras do clube</h2>{items.length ? <div>{items.map((item) => <Link href={`/mercado/peneiras/${item.id}`} key={item.id}><div><strong>{item.scoutName}</strong><span>{focusLabel(item.focus)} - {item.preparation_days} dia(s)</span></div><div><b>{statusLabel(item.status)}</b><small>{item.status === "preparing" ? remaining(item.completes_at, now) : `${item.candidate_count || 0} candidatos`}</small></div></Link>)}</div> : <p className="empty-state">Nenhuma peneira registrada.</p>}</section>
  </div>;
}

function remaining(value: string, now: number) { const ms = Math.max(0, new Date(value).getTime() - now); const days = Math.floor(ms / 86_400_000); const hours = Math.floor((ms % 86_400_000) / 3_600_000); const minutes = Math.floor((ms % 3_600_000) / 60_000); return `${days}d ${hours}h ${minutes}min`; }
function focusLabel(value: string) { return ({ broad: "Ampla", technical: "Tecnica", physical: "Fisica", tactical: "Tatica", goalkeeper: "Goleiros", offensive: "Ofensiva", defensive: "Defensiva" } as Record<string,string>)[value] || value; }
function statusLabel(value: string) { return ({ preparing: "Em preparacao", processing: "Processando", completed: "Concluida", cancelled: "Cancelada", failed: "Falhou" } as Record<string,string>)[value] || value; }
