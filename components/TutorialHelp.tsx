"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TutorialSummary = {
  progress: {
    current_step: number;
    completed_steps: number[];
    skipped_steps?: number[];
    status: "active" | "paused" | "completed" | "skipped";
  } | null;
  steps: Array<{ id: number; title: string }>;
};

const statusCopy = {
  active: "Em andamento",
  paused: "Pausado",
  completed: "Concluido",
  skipped: "Encerrado",
};

export function TutorialHelp() {
  const [data, setData] = useState<TutorialSummary | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/tutorial", { cache: "no-store", credentials: "same-origin" });
      const result = await response.json().catch(() => ({})) as TutorialSummary & { message?: string };
      if (!response.ok) throw new Error(result.message || "Nao foi possivel carregar o tutorial.");
      setData(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o tutorial.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function reopen() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/tutorial", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" }),
      });
      const result = await response.json().catch(() => ({})) as TutorialSummary & { message?: string };
      if (!response.ok) throw new Error(result.message || "Nao foi possivel retomar o tutorial.");
      setData(result);
      setMessage("Tutorial retomado. Abra uma area liberada para continuar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel retomar o tutorial.");
    } finally {
      setPending(false);
    }
  }

  if (!data && !message) return <p role="status">Carregando tutorial...</p>;
  if (!data) return <p className="feedback-message error" role="alert">{message}</p>;
  if (!data.progress) return <p>Crie seu clube para iniciar o tutorial.</p>;

  const current = data.steps.find((step) => step.id === data.progress?.current_step);
  return (
    <div className="tutorial-help">
      <p><strong>Status:</strong> {statusCopy[data.progress.status]}</p>
      <p><strong>Etapa:</strong> {current ? `${current.id}. ${current.title}` : "Concluido"}</p>
      <p>{data.progress.completed_steps.length} concluida(s) e {data.progress.skipped_steps?.length || 0} pulada(s).</p>
      <div className="link-row">
        {data.progress.status === "active" ? <Link href="/mercado">Continuar tutorial</Link> : null}
        {data.progress.status !== "active" ? (
          <button type="button" onClick={reopen} disabled={pending}>{pending ? "Retomando..." : "Retomar tutorial"}</button>
        ) : null}
      </div>
      {message ? <p className="feedback-message sent" role="status">{message}</p> : null}
    </div>
  );
}
