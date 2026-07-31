"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";
import {
  formatBrazilianWhatsapp,
  normalizeUsername,
  RESERVED_USERNAMES,
  type SignupErrors,
} from "@/lib/auth/validation";

type AuthMode = "login" | "signup" | "reset";

type ApiResult = {
  ok?: boolean;
  message?: string;
  next?: string;
  fields?: SignupErrors;
};

const copy = {
  login: { title: "Logar", submit: "Entrar" },
  signup: { title: "Cadastrar", submit: "Criar conta" },
  reset: { title: "Recuperar senha", submit: "Enviar recuperacao" },
};

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [whatsapp, setWhatsapp] = useState("");
  const configured = hasBrowserSupabaseEnv();

  useEffect(() => {
    if (mode !== "signup") return;
    const normalized = normalizeUsername(username);
    if (!/^[a-z0-9._]{3,24}$/.test(normalized) || RESERVED_USERNAMES.has(normalized)) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/availability?username=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await response.json()) as { available?: boolean };
        setUsernameStatus(response.ok && result.available ? "available" : "unavailable");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setUsernameStatus("idle");
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [mode, username]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});

    if (!configured) {
      setMessage("Supabase ainda nao configurado neste ambiente.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);

    try {
      if (mode === "reset") {
        const email = String(data.get("email") || "").trim().toLowerCase();
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
        });
        if (error) throw error;
        setMessage("Se o e-mail estiver cadastrado, enviaremos as instrucoes de recuperacao.");
        form.reset();
        return;
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "login"
        ? {
            identifier: String(data.get("identifier") || ""),
            password: String(data.get("password") || ""),
          }
        : {
            username: String(data.get("username") || ""),
            firstName: String(data.get("firstName") || ""),
            lastName: String(data.get("lastName") || ""),
            email: String(data.get("email") || ""),
            whatsapp: String(data.get("whatsapp") || ""),
            password: String(data.get("password") || ""),
            confirmPassword: String(data.get("confirmPassword") || ""),
          };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as ApiResult;

      if (!response.ok || !result.ok) {
        setFieldErrors(result.fields || {});
        setMessage(result.message || "Nao foi possivel concluir a acao.");
        return;
      }

      window.location.assign(result.next || (mode === "signup" ? "/criar-clube" : "/central"));
    } catch {
      setMessage("Nao foi possivel concluir a acao. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{copy[mode].title}</h2>
      {!configured ? <p className="feedback-message error">Supabase nao configurado neste ambiente.</p> : null}
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {mode === "login" ? (
          <label>
            Nome de usuario, e-mail ou WhatsApp
            <input name="identifier" autoComplete="username" required />
          </label>
        ) : null}

        {mode === "signup" ? (
          <>
            <label>
              Nome de usuario
              <input
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={24}
                autoComplete="username"
                required
                aria-describedby="username-status"
              />
              <span id="username-status" className={`field-status ${usernameStatus}`} aria-live="polite">
                {usernameStatus === "checking" ? "Verificando disponibilidade..." : null}
                {usernameStatus === "available" ? "Nome disponivel." : null}
                {usernameStatus === "unavailable" ? "Nome indisponivel." : null}
              </span>
              <FieldError message={fieldErrors.username} />
            </label>
            <div className="auth-field-grid">
              <label>
                Nome
                <input name="firstName" minLength={2} maxLength={60} autoComplete="given-name" required />
                <FieldError message={fieldErrors.firstName} />
              </label>
              <label>
                Sobrenome
                <input name="lastName" minLength={2} maxLength={100} autoComplete="family-name" required />
                <FieldError message={fieldErrors.lastName} />
              </label>
            </div>
            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" required />
              <FieldError message={fieldErrors.email} />
            </label>
            <label>
              WhatsApp
              <input
                name="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(formatBrazilianWhatsapp(event.target.value))}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(31) 99999-9999"
                required
              />
              <FieldError message={fieldErrors.whatsapp} />
            </label>
          </>
        ) : null}

        {mode === "reset" ? (
          <label>
            E-mail cadastrado
            <input name="email" type="email" autoComplete="email" required />
          </label>
        ) : null}

        {mode !== "reset" ? (
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 8 : 6}
              required
            />
            <FieldError message={fieldErrors.password} />
          </label>
        ) : null}

        {mode === "signup" ? (
          <label>
            Confirmar senha
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            <FieldError message={fieldErrors.confirmPassword} />
          </label>
        ) : null}

        {message ? <p className="feedback-message error" role="alert">{message}</p> : null}
        <button className="auth-submit" type="submit" disabled={pending || !configured || usernameStatus === "checking"}>
          {pending ? "Aguarde..." : copy[mode].submit}
        </button>
      </form>
      <div className="link-row auth-links">
        {mode !== "login" ? <Link href="/login">Logar</Link> : null}
        {mode !== "signup" ? <Link href="/cadastro">Cadastrar</Link> : null}
        {mode !== "reset" ? <Link href="/recuperar-senha">Recuperar senha</Link> : null}
        <Link href="/">Voltar</Link>
      </div>
    </div>
  );
}
