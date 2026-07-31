"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { formatBrazilianWhatsapp } from "@/lib/auth/validation";

async function submitAccountChange(path: string, payload: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  return { ok: response.ok, message: result.message || "Nao foi possivel concluir." };
}

export function AccountManager({ emailVerified, whatsappVerified }: { emailVerified: boolean; whatsappVerified: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await submitAccountChange("/api/account/email", {
      email: String(data.get("email") || ""),
      currentPassword: String(data.get("currentPassword") || ""),
    });
    setMessage(result.message);
    setPending(false);
    if (result.ok) window.location.reload();
  }

  async function changeWhatsapp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await submitAccountChange("/api/account/whatsapp", {
      whatsapp: String(data.get("whatsapp") || ""),
      currentPassword: String(data.get("currentPassword") || ""),
    });
    setMessage(result.message);
    setPending(false);
    if (result.ok) window.location.reload();
  }

  return (
    <div className="account-actions">
      <div className="link-row">
        {!emailVerified ? <Link href="/verificar-email">Confirmar e-mail</Link> : null}
        {!whatsappVerified ? <Link href="/verificar-whatsapp">Confirmar WhatsApp</Link> : null}
        <Link href="/recuperar-senha">Alterar senha</Link>
        <Link href="/logout">Sair</Link>
      </div>

      <details id="email" className="account-editor">
        <summary>Alterar e-mail</summary>
        <form className="auth-form" onSubmit={changeEmail}>
          <label>
            Novo e-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Senha atual
            <input name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          <button className="auth-submit" type="submit" disabled={pending}>Salvar e-mail</button>
        </form>
      </details>

      <details id="whatsapp" className="account-editor">
        <summary>Alterar WhatsApp</summary>
        <form className="auth-form" onSubmit={changeWhatsapp}>
          <label>
            Novo WhatsApp
            <input
              name="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(formatBrazilianWhatsapp(event.target.value))}
              autoComplete="tel"
              required
            />
          </label>
          <label>
            Senha atual
            <input name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          <button className="auth-submit" type="submit" disabled={pending}>Salvar WhatsApp</button>
        </form>
      </details>

      {message ? <p className="feedback-message sent" role="status">{message}</p> : null}
    </div>
  );
}
