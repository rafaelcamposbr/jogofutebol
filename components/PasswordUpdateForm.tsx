"use client";

import { FormEvent, useState } from "react";
import { isStrongPassword } from "@/lib/auth/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasswordUpdateForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmation") || "");
    if (!isStrongPassword(password) || password !== confirmation) {
      setMessage("Use uma senha forte e repita exatamente o mesmo valor.");
      return;
    }

    setPending(true);
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
    setPending(false);
    if (error) {
      setMessage("Nao foi possivel alterar a senha. Solicite um novo link.");
      return;
    }
    window.location.assign("/");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label>Confirmar nova senha<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      {message ? <p className="feedback-message error">{message}</p> : null}
      <button className="auth-submit" type="submit" disabled={pending}>{pending ? "Salvando..." : "Alterar senha"}</button>
    </form>
  );
}
