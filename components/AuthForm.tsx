"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";

type AuthMode = "login" | "signup" | "reset";

const copy = {
  login: {
    title: "Entrar",
    submit: "Entrar",
    success: "",
  },
  signup: {
    title: "Criar conta",
    submit: "Criar conta",
    success: "Conta criada. Verifique o e-mail caso a confirmacao esteja ativa no Supabase.",
  },
  reset: {
    title: "Recuperar senha",
    submit: "Enviar recuperacao",
    success: "Enviamos as instrucoes de recuperacao para o e-mail informado.",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const configured = hasBrowserSupabaseEnv();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setMessage("Supabase ainda nao configurado neste ambiente. Use o modo visitante ou preencha as variaveis.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const supabase = createSupabaseBrowserClient();
    setPending(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/central";
        return;
      }

      if (mode === "signup") {
        const displayName = String(data.get("displayName") || "").trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/central`,
          },
        });
        if (error) throw error;
        setMessage(copy.signup.success);
        form.reset();
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMessage(copy.reset.success);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel concluir a acao.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{copy[mode].title}</h2>
      {!configured ? (
        <p className="feedback-message error">
          Supabase nao configurado. Cadastre as variaveis de ambiente para ativar contas reais.
        </p>
      ) : null}
      <form className="auth-form" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label>
            Nome de exibicao
            <input name="displayName" maxLength={80} />
          </label>
        ) : null}
        <label>
          E-mail
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {mode !== "reset" ? (
          <label>
            Senha
            <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required />
          </label>
        ) : null}
        {message ? <p className={`feedback-message ${message.includes("nao") || message.includes("Nao") ? "error" : "sent"}`}>{message}</p> : null}
        <button className="auth-submit" type="submit" disabled={pending || !configured}>
          {pending ? "Aguarde..." : copy[mode].submit}
        </button>
      </form>
      <div className="link-row" style={{ marginTop: 14 }}>
        {mode !== "login" ? <Link href="/login">Entrar</Link> : null}
        {mode !== "signup" ? <Link href="/cadastro">Criar conta</Link> : null}
        {mode !== "reset" ? <Link href="/recuperar-senha">Recuperar senha</Link> : null}
        <Link href="/experimentar">Experimentar o jogo</Link>
      </div>
    </div>
  );
}
