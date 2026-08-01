"use client";

import { useState } from "react";

export function TryoutDetail({ initialTryout }: { initialTryout: any }) {
  const [tryout, setTryout] = useState(initialTryout);
  const [message, setMessage] = useState("");
  async function startTrial(candidateId: string) {
    setMessage("");
    const response = await fetch(`/api/tryouts/${tryout.id}/trial`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateId }) });
    const body = await response.json();
    if (!response.ok) { setMessage(body.message || "Nao foi possivel iniciar o teste."); return; }
    const refreshed = await fetch(`/api/tryouts/${tryout.id}`).then((result) => result.json());
    setTryout(refreshed.tryout); setMessage("Contrato de teste gratuito iniciado por 30 dias.");
  }
  if (tryout.status !== "completed") return <p className="empty-state">A peneira ainda esta em preparacao. O resultado sera processado pelo relogio do servidor.</p>;
  return <div className="tryout-result-workspace">
    {message ? <p className="form-result" role="status">{message}</p> : null}
    <div className="tryout-summary"><div><span>Olheiro</span><strong>{tryout.scoutName}</strong></div><div><span>Selecao</span><strong>{Math.round(tryout.selection_quality)}%</strong></div><div><span>Candidatos</span><strong>{tryout.candidate_count}</strong></div></div>
    <div className="tryout-candidates">{tryout.candidates.map((item: any) => <article key={item.id}>
      <header><div><span>{item.estimated_position} - confianca {item.confidence}%</span><h2>{item.player?.known_as}</h2></div><b>{recommendation(item.recommendation)}</b></header>
      <dl><div><dt>Nivel estimado</dt><dd>{item.observed_profile.level}</dd></div><div><dt>Faixa observada</dt><dd>{item.observed_profile.estimateRange}</dd></div><div><dt>Altura / peso</dt><dd>{item.observed_profile.heightCm} cm / {item.observed_profile.weightKg} kg</dd></div><div><dt>Pe</dt><dd>{item.observed_profile.preferredFoot === "left" ? "Esquerdo" : "Direito"}</dd></div></dl>
      <p>{item.observed_profile.caveat}</p>
      <button type="button" disabled={item.status !== "available"} onClick={() => startTrial(item.id)}>{item.status === "on_trial" ? "Em contrato de teste" : "Oferecer teste de 30 dias"}</button>
    </article>)}</div>
  </div>;
}
function recommendation(value: string) { return ({ trial: "Recomenda teste", observe: "Observar", release: "Dispensar" } as Record<string,string>)[value] || value; }
