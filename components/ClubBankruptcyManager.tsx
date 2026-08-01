"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type State = { club: null | { id: string; name: string; lifecycle_status: string }; request: null | { id: string; status: string; effective_at: string; cancel_deadline: string; completed_at?: string }; serverNow: string };

export function ClubBankruptcyManager() {
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function refresh() {
    const response = await fetch("/api/account/bankruptcy", { cache: "no-store" });
    if (response.ok) setState(await response.json());
  }
  useEffect(() => { void refresh(); const timer = window.setInterval(() => { setNow(Date.now()); void refresh(); }, 30_000); return () => window.clearInterval(timer); }, []);

  async function requestClosure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); const data = new FormData(event.currentTarget);
    const response = await fetch("/api/account/bankruptcy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      action: "request", clubName: data.get("clubName"), confirmIrreversible: data.get("confirmIrreversible") === "yes",
      confirmAccountPreserved: data.get("confirmAccountPreserved") === "yes", confirmMarketRelease: data.get("confirmMarketRelease") === "yes",
    }) });
    const body = await response.json(); setPending(false); setMessage(body.message || (response.ok ? "Declaracao registrada." : "Nao foi possivel registrar.")); if (response.ok) await refresh();
  }
  async function cancelClosure() {
    if (!state?.request) return; setPending(true); setMessage("");
    const response = await fetch("/api/account/bankruptcy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", requestId: state.request.id }) });
    const body = await response.json(); setPending(false); setMessage(body.message || (response.ok ? "Declaracao cancelada." : "Nao foi possivel cancelar.")); if (response.ok) await refresh();
  }
  if (!state) return <p className="empty-state">Carregando gestao do clube...</p>;
  if (!state.club && state.request?.status === "completed") return <div className="bankruptcy-completed"><h3>Clube encerrado</h3><p>Sua conta foi preservada. O antigo clube aparece publicamente apenas como Clube encerrado.</p><Link className="primary-link" href="/criar-clube">Criar um novo clube</Link></div>;
  if (!state.club) return <p className="empty-state">Nenhum clube ativo vinculado a esta conta.</p>;
  if (state.request?.status === "pending") {
    const canCancel = now < new Date(state.request.cancel_deadline).getTime();
    return <div className="bankruptcy-pending"><h3>Encerramento programado</h3><p>Conclusao em {remaining(state.request.effective_at, now)}. Novas obrigacoes financeiras estao bloqueadas.</p><p>Cancelamento disponivel ate {formatDate(state.request.cancel_deadline)}.</p><button type="button" disabled={pending || !canCancel} onClick={cancelClosure}>{canCancel ? "Cancelar declaracao" : "Prazo de cancelamento encerrado"}</button>{message ? <p className="form-result">{message}</p> : null}</div>;
  }
  return <form className="bankruptcy-form" onSubmit={requestClosure}>
    <p>O processo leva 2 horas reais. Funcionarios voltam ao mercado, jogadores profissionais tornam-se agentes livres e atletas em teste deixam o clube.</p>
    <label><input type="checkbox" name="confirmIrreversible" value="yes" required /> Entendo que o encerramento sera irreversivel apos o prazo.</label>
    <label><input type="checkbox" name="confirmAccountPreserved" value="yes" required /> Entendo que minha conta sera preservada sem o clube.</label>
    <label><input type="checkbox" name="confirmMarketRelease" value="yes" required /> Entendo que profissionais e jogadores serao liberados.</label>
    <label>Digite o nome atual do clube<input name="clubName" required autoComplete="off" placeholder={state.club.name} /></label>
    <button type="submit" disabled={pending}>{pending ? "Registrando..." : "Declarar falencia do clube"}</button>
    {message ? <p className="form-result" role="status">{message}</p> : null}
  </form>;
}

function remaining(value: string, now: number) { const ms=Math.max(0,new Date(value).getTime()-now); const hours=Math.floor(ms/3_600_000); const minutes=Math.floor((ms%3_600_000)/60_000); const seconds=Math.floor((ms%60_000)/1_000); return `${hours}h ${minutes}min ${seconds}s`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
