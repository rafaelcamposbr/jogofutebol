"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type VerificationPanelProps = {
  channel: "email" | "whatsapp";
  destination: string;
  nextPath: string;
  token?: string;
  verified: boolean;
};

type ApiResult = { ok?: boolean; message?: string; alreadyVerified?: boolean };

export function VerificationPanel({ channel, destination, nextPath, token, verified }: VerificationPanelProps) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(verified);
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState("");
  const isEmail = channel === "email";

  async function callEndpoint(path: string, body?: Record<string, string>) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = (await response.json().catch(() => ({}))) as ApiResult;
      setMessage(result.message || (response.ok ? "Solicitacao concluida." : "Nao foi possivel concluir."));
      if (response.ok && (path.endsWith("/confirm") || result.alreadyVerified)) setSuccess(true);
    } catch {
      setMessage("Nao foi possivel concluir. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function confirmWhatsapp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await callEndpoint("/api/verifications/whatsapp/confirm", { code });
  }

  return (
    <section className="plain-card verification-card">
      <p className={`verification-status ${success ? "verified" : "pending"}`}>
        {success ? "Canal confirmado" : "Confirmacao pendente"}
      </p>
      <h1>{isEmail ? "Confirme seu e-mail para acessar a Imprensa" : "Confirme seu WhatsApp para acessar o Escritorio"}</h1>
      <p>{success ? "A area protegida ja esta liberada." : `Destino: ${destination}`}</p>

      {!success && isEmail && token ? (
        <button
          className="auth-submit"
          type="button"
          disabled={pending}
          onClick={() => callEndpoint("/api/verifications/email/confirm", { token })}
        >
          {pending ? "Confirmando..." : "Confirmar e-mail"}
        </button>
      ) : null}

      {!success && isEmail && !token ? (
        <button
          className="auth-submit"
          type="button"
          disabled={pending}
          onClick={() => callEndpoint("/api/verifications/email/request")}
        >
          {pending ? "Enviando..." : "Enviar confirmacao"}
        </button>
      ) : null}

      {!success && !isEmail ? (
        <>
          <button
            className="auth-submit"
            type="button"
            disabled={pending}
            onClick={() => callEndpoint("/api/verifications/whatsapp/request")}
          >
            {pending ? "Enviando..." : "Enviar codigo"}
          </button>
          <form className="verification-code-form" onSubmit={confirmWhatsapp}>
            <label>
              Codigo recebido
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </label>
            <button className="auth-submit" type="submit" disabled={pending || code.length < 4}>
              Validar codigo
            </button>
          </form>
        </>
      ) : null}

      {message ? <p className={`feedback-message ${success ? "sent" : "error"}`} role="status">{message}</p> : null}
      <div className="link-row">
        {success ? <Link href={nextPath}>Continuar</Link> : null}
        <Link href="/minha-conta">Alterar {isEmail ? "e-mail" : "WhatsApp"}</Link>
        <Link href="/central">Voltar a Central</Link>
      </div>
    </section>
  );
}
