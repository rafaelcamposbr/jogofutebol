import "server-only";

import { getEmailVerificationEnv, getSiteUrl } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

export async function sendGameEmailVerification(options: {
  destination: string;
  firstName: string;
  requestOrigin: string;
  token: string;
}) {
  const env = getEmailVerificationEnv();
  if (!env.configured) return { ok: false as const, reason: "not_configured" as const };

  const verificationUrl = new URL("/verificar-email", getSiteUrl(options.requestOrigin));
  verificationUrl.searchParams.set("token", options.token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.from,
      to: [options.destination],
      subject: "Confirme seu e-mail no jogo",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#141614">
          <h1 style="font-size:22px">Confirme seu e-mail</h1>
          <p>Ola, ${escapeHtml(options.firstName)}.</p>
          <p>Use o link abaixo para liberar a area de Imprensa no jogo.</p>
          <p><a href="${escapeHtml(verificationUrl.toString())}">Confirmar e-mail</a></p>
          <p>Este link expira em 30 minutos e funciona uma unica vez.</p>
        </div>
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) return { ok: false as const, reason: "provider_error" as const };
  return { ok: true as const };
}
