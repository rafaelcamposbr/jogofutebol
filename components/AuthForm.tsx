"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";
import {
  formatBrazilianWhatsapp,
  getUsernameValidationError,
  normalizeUsername,
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
  login: { title: "Logar", submit: "Entrar", pending: "Entrando..." },
  signup: { title: "Cadastrar", submit: "Criar conta", pending: "Criando conta..." },
  reset: { title: "Recuperar senha", submit: "Enviar recuperacao", pending: "Enviando..." },
};

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "invalid" | "checking" | "available" | "unavailable" | "error"
  >("idle");
  const [whatsapp, setWhatsapp] = useState("");
  const usernameRequest = useRef(0);
  const configured = hasBrowserSupabaseEnv();

  useEffect(() => {
    if (mode !== "signup") return;
    const requestId = ++usernameRequest.current;
    const normalized = normalizeUsername(username);
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (getUsernameValidationError(username)) {
      setUsernameStatus("invalid");
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
        const result = (await response.json().catch(() => ({}))) as { available?: boolean | null };
        if (requestId !== usernameRequest.current) return;
        if (!response.ok || typeof result.available !== "boolean") {
          setUsernameStatus("error");
          return;
        }
        setUsernameStatus(result.available ? "available" : "unavailable");
      } catch (error) {
        if (requestId !== usernameRequest.current) return;
        if (!(error instanceof DOMException && error.name === "AbortError")) setUsernameStatus("error");
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [mode, username]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage(null);
    setFieldErrors({});

    if (!configured) {
      setMessage({ text: "Supabase ainda nao configurado neste ambiente.", kind: "error" });
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    let keepPending = false;

    try {
      if (mode === "reset") {
        const email = String(data.get("email") || "").trim().toLowerCase();
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
        });
        if (error) throw error;
        setMessage({
          text: "Se o e-mail estiver cadastrado, enviaremos as instrucoes de recuperacao.",
          kind: "success",
        });
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
        const fields = result.fields || {};
        setFieldErrors(fields);
        setMessage({ text: result.message || "Nao foi possivel concluir a acao.", kind: "error" });
        const firstField = Object.keys(fields).find((field) => field !== "form");
        if (firstField) {
          window.requestAnimationFrame(() => {
            form.querySelector<HTMLInputElement>(`[name="${firstField}"]`)?.focus();
          });
        }
        return;
      }

      keepPending = true;
      setMessage({
        text: mode === "signup" ? "Conta criada com sucesso." : "Login realizado com sucesso.",
        kind: "success",
      });
      window.setTimeout(() => {
        window.location.assign(result.next || (mode === "signup" ? "/criar-clube" : "/central"));
      }, 500);
    } catch {
      setMessage({ text: "Nao foi possivel concluir a acao. Tente novamente.", kind: "error" });
    } finally {
      if (!keepPending) setPending(false);
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
                onChange={(event) => {
                  setUsername(event.target.value);
                  setFieldErrors((current) => ({ ...current, username: undefined }));
                }}
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9._]{3,24}"
                autoComplete="username"
                required
                aria-describedby="username-status"
                aria-invalid={usernameStatus === "invalid" || usernameStatus === "unavailable" || Boolean(fieldErrors.username)}
              />
              <span id="username-status" className={`field-status ${usernameStatus}`} aria-live="polite">
                {usernameStatus === "checking" ? "Verificando disponibilidade..." : null}
                {usernameStatus === "available" ? "Nome de usuario disponivel." : null}
                {usernameStatus === "unavailable" ? "Este nome de usuario ja esta em uso." : null}
                {usernameStatus === "invalid" ? getUsernameValidationError(username) : null}
                {usernameStatus === "error" ? "Nao foi possivel verificar o nome de usuario. Tente novamente." : null}
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

        {message ? (
          <p className={`feedback-message ${message.kind === "success" ? "sent" : "error"}`} role={message.kind === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        ) : null}
        <button
          className="auth-submit"
          type="submit"
          disabled={
            pending ||
            !configured ||
            (mode === "signup" && ["invalid", "checking", "unavailable"].includes(usernameStatus))
          }
        >
          {pending ? copy[mode].pending : copy[mode].submit}
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
