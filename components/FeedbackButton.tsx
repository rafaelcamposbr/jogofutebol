"use client";

import { FormEvent, useState } from "react";

const categories = ["Bug", "Interface", "Regra do jogo", "Desempenho", "Sugestao", "Outro"];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const description = String(data.get("description") || "").trim();

    if (!title || !description) {
      setStatus("error");
      setMessage("Preencha titulo e descricao.");
      return;
    }

    setStatus("sending");
    setMessage("");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        category: data.get("category"),
        title,
        description,
        page_url: window.location.href,
        browser: window.navigator.userAgent,
      }),
    });

    if (!response.ok) {
      setStatus("error");
      setMessage("Nao foi possivel registrar agora. Tente novamente em alguns instantes.");
      return;
    }

    form.reset();
    setStatus("sent");
    setMessage("Feedback registrado. Obrigado por testar a beta.");
  }

  return (
    <>
      <button className="feedback-fab" type="button" onClick={() => setOpen(true)}>
        Reportar problema
      </button>
      {open ? (
        <div className="feedback-backdrop" role="presentation">
          <div className="feedback-dialog" role="dialog" aria-modal="true" aria-label="Reportar problema">
            <div className="feedback-header">
              <div>
                <strong>Reportar problema</strong>
                <span>Ajude a melhorar a beta do simulador.</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulario">
                X
              </button>
            </div>
            <form onSubmit={submitFeedback} className="feedback-form">
              <label>
                Categoria
                <select name="category" defaultValue="Bug">
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Titulo
                <input name="title" maxLength={120} required />
              </label>
              <label>
                Descricao
                <textarea name="description" maxLength={1200} required />
              </label>
              {message ? <p className={`feedback-message ${status}`}>{message}</p> : null}
              <button className="feedback-submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Enviando..." : "Enviar feedback"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
