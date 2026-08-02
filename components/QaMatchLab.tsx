"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QaMatchLab() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError(""); const response = await fetch("/api/matches", { method: "POST" }); const body = await response.json();
    if (!response.ok) { setBusy(false); setError(body.message || "Nao foi possivel criar a partida."); return; }
    router.push(`/calendario/partidas/${body.matchId}`);
  }
  return <section className="qa-lab"><div><p>Ambiente isolado</p><h2>Partida QA</h2><span>Valida preparacao, resultado e relatorios sem alterar economia, reputacao ou competicoes.</span></div><button type="button" onClick={create} disabled={busy}>{busy ? "Preparando..." : "Criar partida de teste"}</button>{error ? <p role="alert">{error}</p> : null}</section>;
}
