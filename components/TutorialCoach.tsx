"use client";

import { useCallback, useEffect, useState } from "react";

type TutorialData = {
  progress: {
    current_step: number;
    completed_steps: number[];
    skipped_steps: number[];
    status: "active" | "paused" | "completed" | "skipped";
  } | null;
  advisor: { name: string; role: string; subtitle: string; initials: string };
  steps: Array<{ id: number; title: string; target: string; route: string; actionLabel: string }>;
};

type TutorialCoachProps = {
  enabled: boolean;
  verification: { email: boolean; whatsapp: boolean };
};

const STEP_COPY: Record<number, string> = {
  1: "Voce dirige um clube persistente. Em associacoes, atua como presidente; em SAFs, como CEO. O tempo e as decisoes continuam entre sessoes.",
  2: "A visao geral agora fica no Escritorio, com caixa, alertas, orientacoes e os proximos eventos do clube.",
  3: "Funcionarios possuem cargo, aptidoes, experiencia e um talento natural oculto que afeta a qualidade real do trabalho.",
  4: "Compare cargo, salario, contrato e exigencias de estrutura antes de apresentar uma proposta.",
  5: "No Escritorio ficam equipe, organograma, contratos, satisfacao, autonomia, cursos e historico profissional.",
  6: "Reunioes aceitam texto livre. O motor registra efeitos, tarefas e promessas sem permitir alteracoes arbitrarias.",
  7: "Cursos possuem custo, duracao e saturacao por conteudo. O mesmo metodo pode ser usado com temas diferentes.",
  8: "Instalacoes influenciam contratacoes, carga de trabalho e satisfacao dos departamentos.",
  9: "Imprensa, Elenco, Mercado, Escritorio e Calendario concentram as rotinas principais.",
  10: "Comece avaliando o Mercado e, depois da verificacao, use o Escritorio para administrar equipe e compromissos.",
};

export function TutorialCoach({ enabled, verification }: TutorialCoachProps) {
  const [data, setData] = useState<TutorialData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setError("");
    try {
      const response = await fetch("/api/tutorial", { cache: "no-store", credentials: "same-origin" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Nao foi possivel carregar o tutorial.");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o tutorial.");
    }
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);
  const step = data?.steps.find((item) => item.id === data.progress?.current_step);
  useEffect(() => {
    if (!step || data?.progress?.status !== "active") return;
    let target: Element | null = null;
    try { target = document.querySelector(step.target); } catch { target = null; }
    target?.classList.add("tutorial-highlight");
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return () => target?.classList.remove("tutorial-highlight");
  }, [data?.progress?.status, step]);

  async function act(action: string) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/tutorial", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Nao foi possivel salvar esta acao.");
      setData(payload);
      setConfirmEnd(false);
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel salvar esta acao.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function openRelatedArea() {
    if (!step) return;
    const saved = await act("next");
    if (!saved) return;
    const route = step.route;
    if (route.startsWith("/escritorio") && !verification.whatsapp) {
      window.location.assign(`/verificar-whatsapp?next=${encodeURIComponent(route)}`);
      return;
    }
    if (route.startsWith("/imprensa") && !verification.email) {
      window.location.assign(`/verificar-email?next=${encodeURIComponent(route)}`);
      return;
    }
    window.location.assign(route);
  }

  if (!enabled) return null;
  if (error && !data?.progress) {
    return <aside className="tutorial-coach tutorial-error" aria-live="assertive"><strong>Tutorial indisponivel</strong><p>{error}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></aside>;
  }
  if (!data?.progress || ["completed", "skipped"].includes(data.progress.status)) return null;
  if (data.progress.status === "paused") return null;
  if (!step) return null;

  return (
    <aside className="tutorial-coach" aria-label="Tutorial do clube">
      <header>
        <span className="tutorial-avatar" aria-hidden="true">{data.advisor.initials}</span>
        <div><strong>{data.advisor.name}</strong><span>{data.advisor.role}</span></div>
        <small>{step.id}/{data.steps.length}</small>
      </header>
      <div className="tutorial-progress"><span style={{ width: `${step.id * 10}%` }} /></div>
      <h2>{step.title}</h2>
      <p>{STEP_COPY[step.id]}</p>
      {error ? <p className="tutorial-error-message" role="alert">{error}</p> : null}
      <button className="tutorial-related" type="button" onClick={() => void openRelatedArea()} disabled={busy}>{step.actionLabel}</button>
      <div className="tutorial-actions">
        <button type="button" onClick={() => void act("back")} disabled={busy || step.id === 1}>Voltar</button>
        <button type="button" onClick={() => void act("skip-step")} disabled={busy}>Pular etapa</button>
        <button type="button" onClick={() => void act("pause")} disabled={busy}>Pausar</button>
        <button className="primary" type="button" onClick={() => void act("next")} disabled={busy}>{step.id === data.steps.length ? "Concluir" : "Continuar"}</button>
      </div>
      <button className="tutorial-end" type="button" onClick={() => setConfirmEnd(true)} disabled={busy}>Encerrar tutorial</button>
      {confirmEnd ? <EndConfirmation busy={busy} onCancel={() => setConfirmEnd(false)} onConfirm={() => void act("end")} /> : null}
    </aside>
  );
}

function EndConfirmation({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="tutorial-confirm" role="alertdialog" aria-label="Confirmar encerramento"><strong>Encerrar o tutorial?</strong><p>O progresso ficara salvo e podera ser reaberto em Minha Conta.</p><div><button type="button" onClick={onCancel} disabled={busy}>Cancelar</button><button className="danger" type="button" onClick={onConfirm} disabled={busy}>Confirmar encerramento</button></div></div>;
}
