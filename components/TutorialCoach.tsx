"use client";

import { useCallback, useEffect, useState } from "react";

type TutorialData = {
  progress: {
    current_step: number;
    completed_steps: number[];
    status: "active" | "paused" | "completed" | "skipped";
  } | null;
  advisor: { name: string; role: string; subtitle: string; initials: string };
  steps: Array<{ id: number; title: string; target: string }>;
};

const STEP_COPY: Record<number, string> = {
  1: "Voce dirige um clube persistente. Em associacoes, atua como presidente; em SAFs, como CEO. O tempo e as decisoes continuam entre sessoes.",
  2: "A Central reune caixa, alertas, orientacoes e os proximos eventos do clube.",
  3: "Funcionarios possuem cargo, aptidoes, experiencia e um talento natural oculto que afeta a qualidade real do trabalho.",
  4: "Compare cargo, salario, contrato e exigencias de estrutura antes de apresentar uma proposta.",
  5: "No Escritorio ficam equipe, organograma, contratos, satisfacao, autonomia, cursos e historico profissional.",
  6: "Reunioes aceitam texto livre. O motor registra efeitos, tarefas e promessas sem permitir alteracoes arbitrarias.",
  7: "Cursos possuem custo, duracao e saturacao por conteudo. O mesmo metodo pode ser usado com temas diferentes.",
  8: "Instalacoes influenciam contratacoes, carga de trabalho e satisfacao dos departamentos.",
  9: "Central, Imprensa, Elenco, Mercado, Escritorio e Calendario concentram as rotinas principais.",
  10: "Comece conhecendo a Central, abrindo o Escritorio, avaliando um candidato, contratando e realizando a primeira reuniao.",
};

export function TutorialCoach({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState<TutorialData | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!enabled) return;
    const response = await fetch("/api/tutorial", { cache: "no-store" });
    if (response.ok) setData(await response.json());
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);
  const step = data?.steps.find((item) => item.id === data.progress?.current_step);
  useEffect(() => {
    if (!step || data?.progress?.status !== "active") return;
    let target: Element | null = null;
    try { target = document.querySelector(step.target); } catch { target = null; }
    target?.classList.add("tutorial-highlight");
    return () => target?.classList.remove("tutorial-highlight");
  }, [data?.progress?.status, step]);

  async function act(action: string) {
    setBusy(true);
    const response = await fetch("/api/tutorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) setData(await response.json());
    setBusy(false);
  }

  if (!enabled || !data?.progress || data.progress.status !== "active" || !step) return null;
  return (
    <aside className="tutorial-coach" aria-label="Tutorial do clube">
      <header>
        <span className="tutorial-avatar" aria-hidden="true">{data.advisor.initials}</span>
        <div>
          <strong>{data.advisor.name}</strong>
          <span>{data.advisor.role}</span>
        </div>
        <small>{step.id}/10</small>
      </header>
      <div className="tutorial-progress"><span style={{ width: `${step.id * 10}%` }} /></div>
      <h2>{step.title}</h2>
      <p>{STEP_COPY[step.id]}</p>
      <div className="tutorial-actions">
        <button type="button" onClick={() => act("back")} disabled={busy || step.id === 1}>Voltar</button>
        <button type="button" onClick={() => act("skip-step")} disabled={busy}>Pular etapa</button>
        <button type="button" onClick={() => act("pause")} disabled={busy}>Pausar</button>
        <button className="primary" type="button" onClick={() => act("next")} disabled={busy}>{step.id === 10 ? "Concluir" : "Continuar"}</button>
      </div>
      <button className="tutorial-end" type="button" onClick={() => act("end")} disabled={busy}>Encerrar tutorial</button>
    </aside>
  );
}
